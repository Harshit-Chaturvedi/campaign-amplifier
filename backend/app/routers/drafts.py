import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Campaign, StoryBlock, Source, CampaignAsset, CampaignReach, User
from app.schemas import (
    DraftCreate, DraftPatch, CampaignDetail, CampaignPublic,
    StoryBlockBase, SourceBase, AssetBase, ReachBase
)
from app.config import settings
from app.services.reach import estimate_reach
from app.services.lifecycle import execute_transition
from app.auth.dependencies import get_current_user

router = APIRouter(tags=["drafts"])

@router.post("/drafts", response_model=CampaignDetail)
def create_draft(
    req: DraftCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign_id = f"cmp-{uuid.uuid4().hex[:8]}"
    goal = req.funding_goal or 1000.0

    campaign = Campaign(
        id=campaign_id,
        owner_id=user.id,
        status="draft",
        title=req.title or "Untitled Campaign",
        category=req.category or "community",
        creator_type=req.creator_type or "individual",
        creator_name=req.creator_name or user.name,
        summary=req.summary or "",
        tagline=req.tagline or "",
        funding_goal=goal,
        amount_raised=0.0,
        backer_count=0,
        duration_days=req.duration_days or 30,
        draft_step=1,
        estimated_reach_at_goal=estimate_reach(goal)["estimate"]
    )
    db.add(campaign)

    # Reach settings placeholder
    reach = CampaignReach(
        campaign_id=campaign_id,
        locations=[],
        interests=[],
        channels=["Meta", "Instagram"],
        budget_alloc={"Meta": 60, "Instagram": 40},
        platform_finalized={}
    )
    db.add(reach)

    db.commit()
    db.refresh(campaign)

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
        percent_funded=0,
        backer_count=0,
        estimated_reach_at_goal=campaign.estimated_reach_at_goal,
        duration_days=campaign.duration_days,
        created_at=campaign.created_at,
        published_at=campaign.published_at,
        deadline=campaign.deadline,
        headline=campaign.headline,
        ad_description=campaign.ad_description,
        cta=campaign.cta,
        draft_step=campaign.draft_step,
        story_blocks=[],
        sources=[],
        assets=[],
        reach=ReachBase(
            locations=reach.locations,
            interests=reach.interests,
            channels=reach.channels,
            budget_alloc=reach.budget_alloc
        )
    )

@router.get("/drafts", response_model=List[CampaignPublic])
def list_my_drafts(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    drafts = db.query(Campaign).filter(
        Campaign.owner_id == user.id,
        Campaign.status == "draft"
    ).order_by(Campaign.updated_at.desc()).all()

    return [
        CampaignPublic(
            id=d.id,
            title=d.title,
            category=d.category,
            creator_name=d.creator_name,
            creator_type=d.creator_type,
            summary=d.summary,
            tagline=d.tagline,
            cover_url=d.cover_url,
            status=d.status,
            funding_goal=d.funding_goal,
            amount_raised=d.amount_raised,
            percent_funded=0,
            backer_count=0,
            estimated_reach_at_goal=d.estimated_reach_at_goal,
            duration_days=d.duration_days,
            created_at=d.created_at,
            published_at=d.published_at,
            deadline=d.deadline
        )
        for d in drafts
    ]

@router.get("/drafts/{id}", response_model=CampaignDetail)
def get_draft(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    if campaign.owner_id != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Serialize detailed model
    story_blocks = [
        StoryBlockBase(id=b.id, position=b.position, type=b.type, content=b.content)
        for b in sorted(campaign.story_blocks, key=lambda x: x.position)
    ]
    sources = [SourceBase(id=s.id, title=s.title, url=s.url) for s in campaign.sources]
    assets = [AssetBase(id=a.id, kind=a.kind, url=a.url, meta=a.meta) for a in campaign.assets]
    reach_data = None
    if campaign.reach:
        reach_data = ReachBase(
            locations=campaign.reach.locations or [],
            interests=campaign.reach.interests or [],
            channels=campaign.reach.channels or [],
            budget_alloc=campaign.reach.budget_alloc or {},
            platform_finalized=campaign.reach.platform_finalized
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
        percent_funded=0,
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
        reach=reach_data
    )

@router.patch("/drafts/{id}", response_model=CampaignDetail)
def patch_draft(
    id: str,
    patch: DraftPatch,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    if campaign.owner_id != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Only drafts or changes_requested can be modified
    if campaign.status not in ["draft", "changes_requested"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot edit campaign in status '{campaign.status}'"
        )

    # Update top-level fields
    if patch.title is not None:
        campaign.title = patch.title[:120]
    if patch.category is not None:
        campaign.category = patch.category
    if patch.creator_name is not None:
        campaign.creator_name = patch.creator_name
    if patch.creator_type is not None:
        campaign.creator_type = patch.creator_type
    if patch.summary is not None:
        campaign.summary = patch.summary
    if patch.tagline is not None:
        campaign.tagline = patch.tagline
    if patch.cover_url is not None:
        campaign.cover_url = patch.cover_url
    if patch.headline is not None:
        campaign.headline = patch.headline[:120]
    if patch.ad_description is not None:
        campaign.ad_description = patch.ad_description
    if patch.cta is not None:
        campaign.cta = patch.cta
    if patch.duration_days is not None:
        campaign.duration_days = max(7, min(90, patch.duration_days))
    if patch.draft_step is not None:
        campaign.draft_step = max(1, min(5, patch.draft_step))

    if patch.funding_goal is not None:
        if patch.funding_goal < settings.MIN_GOAL or patch.funding_goal > settings.MAX_GOAL:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Funding goal must be between ${settings.MIN_GOAL} and ${settings.MAX_GOAL}"
            )
        campaign.funding_goal = patch.funding_goal
        campaign.estimated_reach_at_goal = estimate_reach(patch.funding_goal)["estimate"]

    # Replace story blocks if provided
    if patch.story_blocks is not None:
        db.query(StoryBlock).filter(StoryBlock.campaign_id == campaign.id).delete()
        for idx, b in enumerate(patch.story_blocks):
            sb = StoryBlock(
                id=b.id or f"blk-{uuid.uuid4().hex[:8]}",
                campaign_id=campaign.id,
                position=idx,
                type=b.type,
                content=b.content
            )
            db.add(sb)

    # Replace sources if provided
    if patch.sources is not None:
        db.query(Source).filter(Source.campaign_id == campaign.id).delete()
        for s in patch.sources:
            src = Source(
                id=s.id or f"src-{uuid.uuid4().hex[:8]}",
                campaign_id=campaign.id,
                title=s.title,
                url=s.url
            )
            db.add(src)

    # Replace assets if provided
    if patch.assets is not None:
        db.query(CampaignAsset).filter(CampaignAsset.campaign_id == campaign.id).delete()
        for a in patch.assets:
            ca = CampaignAsset(
                id=a.id or f"ast-{uuid.uuid4().hex[:8]}",
                campaign_id=campaign.id,
                kind=a.kind,
                url=a.url,
                meta=a.meta or {}
            )
            db.add(ca)

    # Update reach if provided
    if patch.reach is not None:
        reach = db.query(CampaignReach).filter(CampaignReach.campaign_id == campaign.id).first()
        if not reach:
            reach = CampaignReach(campaign_id=campaign.id)
            db.add(reach)
        reach.locations = patch.reach.locations
        reach.interests = patch.reach.interests
        reach.channels = patch.reach.channels
        reach.budget_alloc = patch.reach.budget_alloc
        if patch.reach.platform_finalized:
            reach.platform_finalized = patch.reach.platform_finalized

    db.commit()
    db.refresh(campaign)

    return get_draft(id=campaign.id, user=user, db=db)

@router.post("/drafts/{id}/submit")
def submit_draft(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    if campaign.owner_id != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    updated = execute_transition(
        db=db,
        campaign=campaign,
        to_status="submitted",
        actor_role=user.role,
        actor_id=user.id,
        note="Draft submitted by creator for editorial review"
    )
    return {"status": "ok", "campaign_status": updated.status, "submitted_at": updated.submitted_at}

@router.get("/me/campaigns", response_model=List[CampaignPublic])
def list_my_campaigns(
    status: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Campaign).filter(Campaign.owner_id == user.id)
    if status:
        query = query.filter(Campaign.status == status)

    campaigns = query.order_by(Campaign.created_at.desc()).all()
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
