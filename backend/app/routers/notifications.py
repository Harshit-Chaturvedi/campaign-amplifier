from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Notification, NotificationPref, Follow, User
from app.schemas import NotificationResponse, NotificationPrefSchema
from app.auth.dependencies import get_current_user

router = APIRouter(tags=["notifications"])

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    tab: Optional[str] = Query("all", description="all, funding, updates, following"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification).filter(Notification.user_id == user.id)

    if tab == "funding":
        query = query.filter(Notification.type.in_(["milestone", "funding"]))
    elif tab == "updates":
        query = query.filter(Notification.type.in_(["update", "report", "review", "status"]))
    elif tab == "following":
        # Only for followed campaigns
        followed_ids = [f.campaign_id for f in db.query(Follow).filter(Follow.user_id == user.id).all()]
        query = query.filter(Notification.campaign_id.in_(followed_ids))

    notifications = query.order_by(Notification.created_at.desc()).all()
    return notifications

@router.patch("/notifications/{id}/read")
def mark_notification_read(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == id, Notification.user_id == user.id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notif.read = True
    db.commit()
    return {"status": "ok", "read": True}

@router.get("/notification-prefs", response_model=NotificationPrefSchema)
def get_prefs(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = db.query(NotificationPref).filter(NotificationPref.user_id == user.id).first()
    if not pref:
        pref = NotificationPref(user_id=user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)

    return NotificationPrefSchema(
        funding_milestones=pref.funding_milestones,
        campaign_updates=pref.campaign_updates,
        review_decisions=pref.review_decisions,
        email_summary=pref.email_summary
    )

@router.put("/notification-prefs", response_model=NotificationPrefSchema)
def update_prefs(
    req: NotificationPrefSchema,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = db.query(NotificationPref).filter(NotificationPref.user_id == user.id).first()
    if not pref:
        pref = NotificationPref(user_id=user.id)
        db.add(pref)

    pref.funding_milestones = req.funding_milestones
    pref.campaign_updates = req.campaign_updates
    pref.review_decisions = req.review_decisions
    pref.email_summary = req.email_summary

    db.commit()
    db.refresh(pref)

    return NotificationPrefSchema(
        funding_milestones=pref.funding_milestones,
        campaign_updates=pref.campaign_updates,
        review_decisions=pref.review_decisions,
        email_summary=pref.email_summary
    )
