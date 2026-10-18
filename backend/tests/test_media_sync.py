import pytest
from app.database import SessionLocal
from app.models import Campaign, CampaignAsset, StoryBlock, Contribution
from app.seed import sync_media

def test_sync_media_idempotent_and_safe():
    db = SessionLocal()
    try:
        # 1. Fetch clean water campaign
        c = db.query(Campaign).filter(Campaign.id == "cmp-clean-water").first()
        assert c is not None, "cmp-clean-water must exist in seed data"

        original_amount_raised = c.amount_raised
        original_funding_goal = c.funding_goal
        original_status = c.status
        original_backer_count = c.backer_count

        contrib_count = db.query(Contribution).filter(Contribution.campaign_id == c.id).count()

        # 2. Run sync_media
        sync_media(db_session=db)

        # 3. Reload campaign and verify media updated
        db.refresh(c)
        assert c.cover_url == "https://images.unsplash.com/photo-1521207418485-99c705420785?w=1200&q=80"
        
        # Verify CampaignAsset records
        cov_asset = db.query(CampaignAsset).filter(
            CampaignAsset.campaign_id == c.id,
            CampaignAsset.kind == "cover"
        ).first()
        assert cov_asset is not None
        assert cov_asset.url == c.cover_url

        ad_assets = db.query(CampaignAsset).filter(
            CampaignAsset.campaign_id == c.id,
            CampaignAsset.kind == "ad_image"
        ).all()
        assert len(ad_assets) >= 1
        assert ad_assets[0].url == "https://images.unsplash.com/photo-1429056147644-31d142d21ac2?w=1200&q=80"

        # Verify story block image
        img_block = db.query(StoryBlock).filter(
            StoryBlock.campaign_id == c.id,
            StoryBlock.type == "image"
        ).first()
        assert img_block is not None
        assert img_block.content.get("url") == "https://images.unsplash.com/photo-1521207418485-99c705420785?w=1200&q=80"

        # 4. Strict assertions: Financial and status fields remain UNCHANGED
        assert c.amount_raised == original_amount_raised
        assert c.funding_goal == original_funding_goal
        assert c.status == original_status
        assert c.backer_count == original_backer_count
        assert db.query(Contribution).filter(Contribution.campaign_id == c.id).count() == contrib_count

        # 5. Run a second time to prove idempotency
        sync_media(db_session=db)
        db.refresh(c)
        assert c.amount_raised == original_amount_raised
        assert c.status == original_status
        assert c.cover_url == "https://images.unsplash.com/photo-1521207418485-99c705420785?w=1200&q=80"

    finally:
        db.close()
