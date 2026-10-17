import datetime
import uuid
from typing import Dict, Any, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Campaign, ModerationEvent, Notification, User
from app.config import settings

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

# Transition definition: (from_status, to_status) -> allowed_roles, description
TRANSITION_RULES = {
    # 1. Creator submits draft
    ("draft", "submitted"): {
        "roles": ["creator", "admin"],
        "desc": "Submit campaign draft for editorial and advertising review",
    },
    # 2. Reviewer decisions
    ("submitted", "approved"): {
        "roles": ["reviewer", "admin"],
        "desc": "Approve campaign story, claims, sources, and ad creatives",
    },
    ("submitted", "changes_requested"): {
        "roles": ["reviewer", "admin"],
        "desc": "Request revisions to claims, sources, or advertising copy",
    },
    ("submitted", "rejected"): {
        "roles": ["reviewer", "admin"],
        "desc": "Reject submission that fails community guidelines or ad policies",
    },
    # 3. Creator resubmits after requested changes
    ("changes_requested", "submitted"): {
        "roles": ["creator", "admin"],
        "desc": "Resubmit revised campaign for review",
    },
    # 4. Publishing approved campaign for funding
    ("approved", "available_for_funding"): {
        "roles": ["creator", "reviewer", "admin", "system"],
        "desc": "Open campaign for community amplification contributions",
    },
    # 5. Funding milestones (NOTE: goal_reached NEVER auto-promotes!)
    ("available_for_funding", "goal_reached"): {
        "roles": ["system", "admin"],
        "desc": "100% of funding goal reached by community backers",
    },
    ("available_for_funding", "funding_ended"): {
        "roles": ["system", "admin", "creator"],
        "desc": "Funding duration completed",
    },
    # 6. Preparing advertising distribution
    ("goal_reached", "distribution_preparation"): {
        "roles": ["reviewer", "admin", "system"],
        "desc": "Ad ops prepares audience targeting, assets, and channel placements",
    },
    ("funding_ended", "distribution_preparation"): {
        "roles": ["reviewer", "admin", "system"],
        "desc": "Ad ops prepares distribution with funded budget",
    },
    # 7. Launching advertising (requires can_start_promotion)
    ("distribution_preparation", "promoting"): {
        "roles": ["reviewer", "admin"],
        "desc": "Deploy sponsored advertising campaigns across selected channels",
    },
    # 8. Completing advertising run and delivering final report
    ("promoting", "completed"): {
        "roles": ["reviewer", "admin", "system"],
        "desc": "Complete advertising schedule and publish final distribution report",
    },
    # 9. Exceptional cancellations & refunds
    ("available_for_funding", "refund_pending"): {
        "roles": ["admin", "system"],
        "desc": "Campaign cancelled while funded; initiate backer refunds",
    },
    ("refund_pending", "failed"): {
        "roles": ["admin", "system"],
        "desc": "All refunds successfully processed",
    },
    ("draft", "cancelled"): {
        "roles": ["creator", "admin"],
        "desc": "Creator cancelled draft",
    },
    ("changes_requested", "cancelled"): {
        "roles": ["creator", "admin"],
        "desc": "Creator closed campaign instead of revising",
    },
}

def can_start_promotion(campaign: Campaign) -> Tuple[bool, List[str]]:
    reasons: List[str] = []

    # Condition 1: Must have editorial review approval
    if not campaign.approved_at and campaign.status not in ["approved", "distribution_preparation"]:
        reasons.append("Campaign must have editorial review approval")

    # Condition 2: Community funding settled
    if campaign.amount_raised <= 0:
        reasons.append("Community funding contributions must be received and settled")

    # Condition 3: Reach channels configured
    if not campaign.reach or not campaign.reach.channels or len(campaign.reach.channels) == 0:
        reasons.append("At least one advertising channel must be selected in reach settings")

    # Condition 4: Advertising creative assets complete
    if not campaign.cover_url:
        reasons.append("Campaign ad creative requires a primary cover visual")
    if not campaign.headline or len(campaign.headline.strip()) == 0:
        reasons.append("Advertising headline is required")
    if not campaign.ad_description or len(campaign.ad_description.strip()) == 0:
        reasons.append("Advertising copy/description is required")

    return (len(reasons) == 0, reasons)

def check_preconditions(campaign: Campaign, to_status: str) -> Tuple[bool, Optional[str]]:
    if to_status == "submitted":
        if not campaign.title or len(campaign.title.strip()) == 0:
            return False, "Title is required"
        if not campaign.funding_goal or campaign.funding_goal < settings.MIN_GOAL:
            return False, f"Funding goal must be at least ${settings.MIN_GOAL}"
        if not campaign.category:
            return False, "Category is required"

    elif to_status == "goal_reached":
        if campaign.amount_raised < campaign.funding_goal:
            return False, f"Amount raised (${campaign.amount_raised}) must meet or exceed goal (${campaign.funding_goal})"

    elif to_status == "promoting":
        ok, reasons = can_start_promotion(campaign)
        if not ok:
            return False, "; ".join(reasons)

    return True, None

def execute_transition(
    db: Session,
    campaign: Campaign,
    to_status: str,
    actor_role: str,
    actor_id: Optional[str] = None,
    note: str = ""
) -> Campaign:
    from_status = campaign.status

    # Normalize roles: 'user' acts as 'creator' for own campaign; 'admin' is superuser
    effective_role = actor_role
    if effective_role == "user":
        effective_role = "creator"

    rule_key = (from_status, to_status)
    if rule_key not in TRANSITION_RULES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Illegal transition from '{from_status}' to '{to_status}'. Permitted transitions from '{from_status}' do not include '{to_status}'."
        )

    rule = TRANSITION_RULES[rule_key]
    allowed_roles = rule["roles"]

    if actor_role != "admin" and effective_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{actor_role}' is not authorized to transition campaign from '{from_status}' to '{to_status}'."
        )

    # Check preconditions
    ok, reason = check_preconditions(campaign, to_status)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Preconditions for '{to_status}' not satisfied: {reason}"
        )

    # Apply status and timestamps
    now = utcnow()
    campaign.status = to_status
    campaign.updated_at = now

    if to_status == "submitted":
        campaign.submitted_at = now
    elif to_status == "approved":
        campaign.approved_at = now
    elif to_status == "available_for_funding":
        campaign.published_at = now
        if not campaign.deadline:
            campaign.deadline = now + datetime.timedelta(days=campaign.duration_days)

    # Record moderation event (audit log)
    mod_event = ModerationEvent(
        id=f"mod-{uuid.uuid4().hex[:8]}",
        campaign_id=campaign.id,
        actor_id=actor_id,
        from_status=from_status,
        to_status=to_status,
        note=note or rule["desc"],
        created_at=now
    )
    db.add(mod_event)

    # Notify campaign owner
    if campaign.owner_id:
        title = f"Campaign Status: {to_status.replace('_', ' ').title()}"
        body = note if note else f"Your campaign '{campaign.title}' has moved to {to_status.replace('_', ' ')}."
        notif = Notification(
            id=f"notif-{uuid.uuid4().hex[:8]}",
            user_id=campaign.owner_id,
            type="review" if to_status in ["approved", "changes_requested", "rejected"] else "status",
            campaign_id=campaign.id,
            title=title,
            body=body,
            read=False,
            created_at=now
        )
        db.add(notif)

    db.commit()
    db.refresh(campaign)
    return campaign
