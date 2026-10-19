import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.database import get_db
from app.models import (
    Campaign, StoryBlock, Source, CampaignAsset, CampaignReach,
    Report, Feedback, CampaignUpdate, User
)
from app.schemas import (
    CampaignPublic, CampaignDetail, StoryBlockBase, SourceBase,
    AssetBase, ReachBase, ReportResponse, ReachEstimateRequest,
    ReachEstimateResponse, FeedbackRequest, CampaignUpdateCreate,
    CampaignUpdateResponse
)
from app.config import settings
from app.services.reach import estimate_reach
from app.services.lifecycle import execute_transition
from app.auth.dependencies import get_current_user, get_current_user_optional

router = APIRouter(tags=["campaigns"])

@router.get("/config/public")
def get_public_config():
    return {
        "cpm_usd": settings.CPM_USD,
        "avg_frequency": settings.AVG_FREQUENCY,
        "platform_fee_pct": settings.PLATFORM_FEE_PCT,
        "payment_fee_pct": settings.PAYMENT_FEE_PCT,
        "payment_fee_fixed": settings.PAYMENT_FEE_FIXED,
        "min_goal": settings.MIN_GOAL,
        "max_goal": settings.MAX_GOAL,
        "preset_amounts": settings.PRESET_AMOUNTS,
        "preset_goals": settings.PRESET_GOALS,
        "default_duration_days": settings.DEFAULT_DURATION_DAYS
    }

@router.post("/reach/estimate", response_model=ReachEstimateResponse)
def get_reach_estimate(req: ReachEstimateRequest):
    return estimate_reach(req.amount)

@router.get("/campaigns", response_model=List[CampaignPublic])
def list_campaigns(
    q: Optional[str] = Query(None, description="Search query across title, summary, creator"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status (default: public active statuses)"),
    sort: Optional[str] = Query("trending", description="trending, newest, most_funded, ending_soon, closest_to_goal"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Campaign)

    # Filter status: default to publicly visible campaigns
    if status:
        query = query.filter(Campaign.status == status)
    else:
        query = query.filter(
            Campaign.status.in_(["available_for_funding", "goal_reached", "distribution_preparation", "promoting", "completed"])
        )

    # Category filter
    if category and category != "all":
        query = query.filter(Campaign.category == category)

    # Search filter
    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                Campaign.title.ilike(term),
                Campaign.summary.ilike(term),
                Campaign.creator_name.ilike(term),
                Campaign.tagline.ilike(term)
            )
        )

    # Sorting
    if sort == "newest":
        query = query.order_by(desc(Campaign.created_at))
    elif sort == "most_funded":
        query = query.order_by(desc(Campaign.amount_raised))
    elif sort == "ending_soon":
        query = query.order_by(asc(Campaign.deadline))
    elif sort == "closest_to_goal":
        # Order by percentage funded descending
        query = query.order_by(desc(Campaign.amount_raised / Campaign.funding_goal))
    else:  # trending / default
        query = query.order_by(desc(Campaign.backer_count), desc(Campaign.amount_raised))

    offset = (page - 1) * page_size
    campaigns = query.offset(offset).limit(page_size).all()

    # Calculate percent_funded dynamically
    results = []
    for c in campaigns:
        pct = int(round((c.amount_raised / c.funding_goal) * 100)) if c.funding_goal > 0 else 0
        pub = CampaignPublic(
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
        )
        results.append(pub)

    return results

@router.get("/campaigns/{id}", response_model=CampaignDetail)
def get_campaign_detail(id: str, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    pct = int(round((campaign.amount_raised / campaign.funding_goal) * 100)) if campaign.funding_goal > 0 else 0

    story_blocks = [
        StoryBlockBase(
            id=b.id,
            position=b.position,
            type=b.type,
            content=b.content
        )
        for b in sorted(campaign.story_blocks, key=lambda x: x.position)
    ]

    sources = [
        SourceBase(id=s.id, title=s.title, url=s.url)
        for s in campaign.sources
    ]

    assets = [
        AssetBase(id=a.id, kind=a.kind, url=a.url, meta=a.meta)
        for a in campaign.assets
    ]

    reach_data = None
    if campaign.reach:
        reach_data = ReachBase(
            locations=campaign.reach.locations or [],
            interests=campaign.reach.interests or [],
            channels=campaign.reach.channels or [],
            budget_alloc=campaign.reach.budget_alloc or {},
            platform_finalized=campaign.reach.platform_finalized
        )

    report_data = None
    if campaign.report:
        report_data = ReportResponse(
            campaign_id=campaign.report.campaign_id,
            funds_raised=campaign.report.funds_raised,
            ad_spend=campaign.report.ad_spend,
            impressions=campaign.report.impressions,
            measured_reach=campaign.report.measured_reach,
            clicks=campaign.report.clicks,
            est_reach=campaign.report.est_reach,
            is_final=campaign.report.is_final
        )

    return CampaignDetail(
        id=campaign.id,
        title=campaign.title,
        category=campaign.category,
        creator_name=campaign.creator_name,
        creator_type=campaign.creator_type,
        summary=campaign.summary,
        tagline=campaign.tagline,
        cover_url=campaign.cover_url,
        status=campaign.status,
        funding_goal=campaign.funding_goal,
        amount_raised=campaign.amount_raised,
        percent_funded=pct,
        backer_count=campaign.backer_count,
        estimated_reach_at_goal=campaign.estimated_reach_at_goal,
        duration_days=campaign.duration_days,
        created_at=campaign.created_at,
        published_at=campaign.published_at,
        deadline=campaign.deadline,
        headline=campaign.headline,
        ad_description=campaign.ad_description,
        cta=campaign.cta,
        draft_step=campaign.draft_step,
        story_blocks=story_blocks,
        sources=sources,
        assets=assets,
        reach=reach_data,
        report=report_data
    )

@router.post("/campaigns/{id}/feedback")
def submit_feedback(
    id: str,
    req: FeedbackRequest,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    fb = Feedback(
        id=f"fb-{uuid.uuid4().hex[:8]}",
        campaign_id=campaign.id,
        visuals_kept_reading=req.visuals_kept_reading,
        changed_mind=req.changed_mind
    )
    db.add(fb)
    db.commit()
    return {"status": "ok", "message": "Feedback submitted"}

@router.get("/campaigns/{id}/analytics")
def get_campaign_analytics(
    id: str,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    est = estimate_reach(campaign.amount_raised)
    est_goal = estimate_reach(campaign.funding_goal)
    pct = int(round((campaign.amount_raised / campaign.funding_goal) * 100)) if campaign.funding_goal > 0 else 0

    measured = None
    if campaign.report:
        measured = {
            "impressions": campaign.report.impressions,
            "measured_reach": campaign.report.measured_reach,
            "clicks": campaign.report.clicks,
            "ad_spend": campaign.report.ad_spend,
            "is_final": campaign.report.is_final,
            "label": "Measured (demo data)"
        }

    return {
        "campaign_id": campaign.id,
        "title": campaign.title,
        "status": campaign.status,
        "funding": {
            "amount_raised": campaign.amount_raised,
            "funding_goal": campaign.funding_goal,
            "percent_funded": pct,
            "backer_count": campaign.backer_count
        },
        "budget": {
            "total_raised": campaign.amount_raised,
            "ad_budget": est["ad_budget"],
            "platform_fee": round(campaign.amount_raised * settings.PLATFORM_FEE_PCT, 2),
            "spent": campaign.report.ad_spend if campaign.report else 0.0
        },
        "delivery": {
            "estimated": {
                "reach": est["estimate"],
                "impressions": est["impressions"],
                "label": "Estimated (based on demo assumptions, not a guarantee)"
            },
            "estimated_at_goal": {
                "reach": est_goal["estimate"],
                "impressions": est_goal["impressions"],
                "label": "Estimated Reach at Goal"
            },
            "measured": measured
        }
    }

@router.post("/campaigns/{id}/updates", response_model=CampaignUpdateResponse)
def create_campaign_update(
    id: str,
    req: CampaignUpdateCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    # Only campaign owner or admin can post updates
    if campaign.owner_id != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this campaign")

    up = CampaignUpdate(
        id=f"up-{uuid.uuid4().hex[:8]}",
        campaign_id=campaign.id,
        title=req.title,
        body=req.body
    )
    db.add(up)
    db.commit()
    db.refresh(up)
    return up

@router.post("/campaigns/{id}/respond")
def respond_to_review(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    if campaign.owner_id != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if campaign.status != "changes_requested":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot respond: campaign is in '{campaign.status}', not 'changes_requested'"
        )

    updated = execute_transition(
        db=db,
        campaign=campaign,
        to_status="submitted",
        actor_role=user.role,
        actor_id=user.id,
        note="Creator revised campaign per feedback and resubmitted"
    )
    return {"status": "ok", "campaign_status": updated.status}
