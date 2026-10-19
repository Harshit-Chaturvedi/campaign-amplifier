from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Campaign, Report, User, Contribution, Notification, Follow, Save
from app.schemas import (
    CampaignPublic, ModerationNoteRequest, SimulateDeliveryRequest, ReportResponse
)
from app.services.lifecycle import execute_transition
from app.auth.dependencies import require_admin
from app.services.reach import estimate_reach

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/review-queue", response_model=List[CampaignPublic])
def get_review_queue(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    campaigns = db.query(Campaign).filter(
        Campaign.status.in_(["submitted", "changes_requested", "distribution_preparation", "promoting"])
    ).order_by(Campaign.updated_at.desc()).all()

    results = []
    for c in campaigns:
        pct = int(round((c.amount_raised / c.funding_goal) * 100)) if c.funding_goal > 0 else 0
        results.append(CampaignPublic(
            id=c.id,
            title=c.title,
            category=c.category,
            creator_name=c.creator_name,
            creator_type=c.creator_type,
            summary=c.summary,
            tagline=c.tagline,
            cover_url=c.cover_url,
            status=c.status,
            funding_goal=c.funding_goal,
            amount_raised=c.amount_raised,
            percent_funded=pct,
            backer_count=c.backer_count,
            estimated_reach_at_goal=c.estimated_reach_at_goal,
            duration_days=c.duration_days,
            created_at=c.created_at,
            published_at=c.published_at,
            deadline=c.deadline
        ))
    return results

@router.post("/campaigns/{id}/approve")
def approve_campaign(
    id: str,
    req: Optional[ModerationNoteRequest] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    note = req.note if (req and req.note) else "Content, sources, creative and targeting reviewed."
    # Transition submitted -> approved
    execute_transition(
        db=db,
        campaign=campaign,
        to_status="approved",
        actor_role="admin",
        actor_id=admin.id,
        note=note
    )
    # Transition approved -> available_for_funding
    execute_transition(
        db=db,
        campaign=campaign,
        to_status="available_for_funding",
        actor_role="admin",
        actor_id=admin.id,
        note=note
    )

    return {"status": "ok", "campaign_status": campaign.status}

@router.post("/campaigns/{id}/request-changes")
def request_changes(
    id: str,
    req: ModerationNoteRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    note = req.note or "Please review claims and update supporting source citations."
    execute_transition(
        db=db,
        campaign=campaign,
        to_status="changes_requested",
        actor_role="admin",
        actor_id=admin.id,
        note=note
    )
    return {"status": "ok", "campaign_status": campaign.status, "feedback": note}

@router.post("/campaigns/{id}/reject")
def reject_campaign(
    id: str,
    req: ModerationNoteRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    note = req.note or "Submission does not satisfy community guidelines or advertising policies."
    execute_transition(
        db=db,
        campaign=campaign,
        to_status="rejected",
        actor_role="admin",
        actor_id=admin.id,
        note=note
    )
    return {"status": "ok", "campaign_status": campaign.status}

@router.post("/campaigns/{id}/start-promotion")
def start_promotion(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    # If in goal_reached or funding_ended, first advance to distribution_preparation
    if campaign.status in ["goal_reached", "funding_ended"]:
        execute_transition(
            db=db,
            campaign=campaign,
            to_status="distribution_preparation",
            actor_role="admin",
            actor_id=admin.id,
            note="Ad operations initialized distribution parameters"
        )

    # Transition to promoting (will check can_start_promotion preconditions)
    execute_transition(
        db=db,
        campaign=campaign,
        to_status="promoting",
        actor_role="admin",
        actor_id=admin.id,
        note="Digital ad delivery scheduled across selected channels"
    )

    return {"status": "ok", "campaign_status": campaign.status}

@router.post("/admin/campaigns/{id}/simulate-delivery", response_model=ReportResponse)
@router.post("/campaigns/{id}/simulate-delivery", response_model=ReportResponse)
def simulate_delivery(
    id: str,
    req: SimulateDeliveryRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    est = estimate_reach(campaign.amount_raised)
    report = db.query(Report).filter(Report.campaign_id == campaign.id).first()
    if not report:
        report = Report(
            campaign_id=campaign.id,
            funds_raised=campaign.amount_raised,
            ad_spend=est["ad_budget"],
            impressions=req.impressions,
            measured_reach=req.measured_reach,
            clicks=req.clicks,
            est_reach=est["estimate"],
            is_final=False
        )
        db.add(report)
    else:
        report.impressions = req.impressions
        report.measured_reach = req.measured_reach
        report.clicks = req.clicks
        report.funds_raised = campaign.amount_raised

    db.commit()
    db.refresh(report)

    return ReportResponse(
        campaign_id=report.campaign_id,
        funds_raised=report.funds_raised,
        ad_spend=report.ad_spend,
        impressions=report.impressions,
        measured_reach=report.measured_reach,
        clicks=report.clicks,
        est_reach=report.est_reach,
        is_final=report.is_final
    )

@router.post("/campaigns/{id}/complete")
def complete_campaign(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    execute_transition(
        db=db,
        campaign=campaign,
        to_status="completed",
        actor_role="admin",
        actor_id=admin.id,
        note="Advertising delivery schedule completed. Final distribution report published."
    )

    # Mark report as final
    report = db.query(Report).filter(Report.campaign_id == campaign.id).first()
    if report:
        report.is_final = True
        db.commit()

    return {"status": "ok", "campaign_status": campaign.status}
 
@router.delete("/campaigns/{id}")
def delete_campaign(
    id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    # Delete contributions associated with this campaign
    db.query(Contribution).filter(Contribution.campaign_id == id).delete()
    # Delete notifications referencing this campaign
    db.query(Notification).filter(Notification.campaign_id == id).delete()
    # Delete follows and saves
    db.query(Follow).filter(Follow.campaign_id == id).delete()
    db.query(Save).filter(Save.campaign_id == id).delete()

    db.delete(campaign)
    db.commit()
    return {"status": "ok", "deleted_id": id}
