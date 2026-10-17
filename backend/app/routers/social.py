import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Follow, Save, Campaign, User
from app.schemas import CampaignPublic
from app.auth.dependencies import get_current_user

router = APIRouter(tags=["social"])

@router.post("/campaigns/{id}/follow")
def follow_campaign(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    existing = db.query(Follow).filter(Follow.user_id == user.id, Follow.campaign_id == id).first()
    if not existing:
        follow = Follow(
            id=f"fol-{uuid.uuid4().hex[:8]}",
            user_id=user.id,
            campaign_id=id
        )
        db.add(follow)
        db.commit()

    return {"status": "ok", "following": True}

@router.delete("/campaigns/{id}/follow")
def unfollow_campaign(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Follow).filter(Follow.user_id == user.id, Follow.campaign_id == id).delete()
    db.commit()
    return {"status": "ok", "following": False}

@router.post("/campaigns/{id}/save")
def save_campaign(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    existing = db.query(Save).filter(Save.user_id == user.id, Save.campaign_id == id).first()
    if not existing:
        save = Save(
            id=f"sav-{uuid.uuid4().hex[:8]}",
            user_id=user.id,
            campaign_id=id
        )
        db.add(save)
        db.commit()

    return {"status": "ok", "saved": True}

@router.delete("/campaigns/{id}/save")
def unsave_campaign(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Save).filter(Save.user_id == user.id, Save.campaign_id == id).delete()
    db.commit()
    return {"status": "ok", "saved": False}

@router.get("/me/saved", response_model=List[CampaignPublic])
def get_saved_campaigns(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saves = db.query(Save).filter(Save.user_id == user.id).all()
    campaign_ids = [s.campaign_id for s in saves]
    campaigns = db.query(Campaign).filter(Campaign.id.in_(campaign_ids)).all()

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

@router.get("/me/following", response_model=List[CampaignPublic])
def get_followed_campaigns(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    follows = db.query(Follow).filter(Follow.user_id == user.id).all()
    campaign_ids = [f.campaign_id for f in follows]
    campaigns = db.query(Campaign).filter(Campaign.id.in_(campaign_ids)).all()

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
