import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Contribution, Campaign, Notification, User
from app.schemas import (
    ContributionCreate, PaymentSimulateRequest, ContributionResponse, ReceiptResponse
)
from app.services.reach import calculate_backer_fee, estimate_reach
from app.services.lifecycle import execute_transition
from app.auth.dependencies import get_current_user, get_current_user_optional

router = APIRouter(tags=["contributions"])

def generate_receipt_no():
    year = datetime.datetime.now().year
    return f"REC-{year}-{uuid.uuid4().hex[:6].upper()}"

@router.post("/contributions", response_model=ContributionResponse)
def create_contribution(
    req: ContributionCreate,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == req.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    if campaign.status != "available_for_funding":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Campaign is not open for funding (current status: '{campaign.status}')"
        )

    fee, total = calculate_backer_fee(req.amount)
    contrib_id = f"con-{uuid.uuid4().hex[:8]}"
    receipt_no = generate_receipt_no()

    contrib = Contribution(
        id=contrib_id,
        campaign_id=campaign.id,
        user_id=user.id if user else None,
        guest_email=req.guest_email if not user else None,
        amount=req.amount,
        fee=fee,
        total=total,
        status="pending",
        show_name=req.show_name,
        receipt_no=receipt_no
    )
    db.add(contrib)
    db.commit()
    db.refresh(contrib)

    backer_name = "Anonymous"
    if req.show_name and user:
        backer_name = user.name

    return ContributionResponse(
        id=contrib.id,
        campaign_id=contrib.campaign_id,
        amount=contrib.amount,
        fee=contrib.fee,
        total=contrib.total,
        status=contrib.status,
        show_name=contrib.show_name,
        receipt_no=contrib.receipt_no,
        created_at=contrib.created_at,
        backer_name=backer_name
    )

@router.post("/payments/simulate")
def simulate_payment(
    req: PaymentSimulateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    valid_outcomes = ["success", "pending", "failed", "cancelled", "rejected"]
    if req.outcome not in valid_outcomes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Outcome must be one of {valid_outcomes}"
        )

    contrib = db.query(Contribution).filter(Contribution.id == req.contribution_id).first()
    if not contrib:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contribution not found")

    campaign = db.query(Campaign).filter(Campaign.id == contrib.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    # CRITICAL: Once a contribution has succeeded, ignore any status change.
    # It cannot transition out of succeeded or alter campaign stats.
    if contrib.status == "succeeded":
        return {
            "status": "ok",
            "contribution_id": contrib.id,
            "payment_status": "succeeded",
            "receipt_no": contrib.receipt_no,
            "amount": contrib.amount,
            "campaign_amount_raised": campaign.amount_raised,
            "campaign_status": campaign.status,
            "ignored": True
        }

    # If the contribution is owned by a registered user, only that owner can simulate
    if contrib.user_id:
        if not current_user or current_user.id != contrib.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorised to modify payment for this contribution"
            )

    old_status = contrib.status
    new_status = "succeeded" if req.outcome == "success" else req.outcome
    contrib.status = new_status

    # CRITICAL: Only succeeded outcome increments amount_raised and backer_count
    if old_status != "succeeded" and new_status == "succeeded":
        old_pct = int(round((campaign.amount_raised / campaign.funding_goal) * 100)) if campaign.funding_goal > 0 else 0

        campaign.amount_raised = round(campaign.amount_raised + contrib.amount, 2)
        campaign.backer_count += 1

        new_pct = int(round((campaign.amount_raised / campaign.funding_goal) * 100)) if campaign.funding_goal > 0 else 0

        # Check milestones: 25%, 50%, 75%, 100%
        for milestone in [25, 50, 75, 100]:
            if old_pct < milestone <= new_pct:
                if campaign.owner_id:
                    notif = Notification(
                        id=f"notif-{uuid.uuid4().hex[:8]}",
                        user_id=campaign.owner_id,
                        type="milestone",
                        campaign_id=campaign.id,
                        title=f"Milestone Reached: {milestone}% Funded!",
                        body=f"'{campaign.title}' has crossed {milestone}% of its distribution funding goal (${campaign.amount_raised:.0f}/${campaign.funding_goal:.0f}).",
                        read=False
                    )
                    db.add(notif)

        # If goal reached, transition state machine
        if campaign.amount_raised >= campaign.funding_goal and campaign.status == "available_for_funding":
            execute_transition(
                db=db,
                campaign=campaign,
                to_status="goal_reached",
                actor_role="system",
                actor_id=None,
                note=f"Community backers pooled 100% of funding goal (${campaign.amount_raised:.2f}/${campaign.funding_goal:.2f})"
            )

    db.commit()
    db.refresh(contrib)

    return {
        "status": "ok",
        "contribution_id": contrib.id,
        "payment_status": contrib.status,
        "receipt_no": contrib.receipt_no,
        "amount": contrib.amount,
        "campaign_amount_raised": campaign.amount_raised,
        "campaign_status": campaign.status
    }

@router.get("/me/contributions", response_model=List[ContributionResponse])
def get_my_contributions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contribs = db.query(Contribution).filter(Contribution.user_id == user.id).order_by(Contribution.created_at.desc()).all()
    return [
        ContributionResponse(
            id=c.id,
            campaign_id=c.campaign_id,
            amount=c.amount,
            fee=c.fee,
            total=c.total,
            status=c.status,
            show_name=c.show_name,
            receipt_no=c.receipt_no,
            created_at=c.created_at,
            backer_name=user.name if c.show_name else "Anonymous"
        )
        for c in contribs
    ]

@router.get("/receipts/{id}", response_model=ReceiptResponse)
def get_receipt(id: str, db: Session = Depends(get_db)):
    # Match either receipt_no or contribution id
    contrib = db.query(Contribution).filter(
        (Contribution.receipt_no == id) | (Contribution.id == id)
    ).first()
    if not contrib:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt not found")

    campaign = db.query(Campaign).filter(Campaign.id == contrib.campaign_id).first()
    campaign_title = campaign.title if campaign else "Amplification Campaign"

    est = estimate_reach(contrib.amount)["estimate"]

    return ReceiptResponse(
        receipt_no=contrib.receipt_no,
        campaign_id=contrib.campaign_id,
        campaign_title=campaign_title,
        amount=contrib.amount,
        fee=contrib.fee,
        total=contrib.total,
        status=contrib.status,
        estimated_reach=est,
        created_at=contrib.created_at,
        show_name=contrib.show_name
    )
