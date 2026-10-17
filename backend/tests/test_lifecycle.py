import pytest
from fastapi import HTTPException
from app.models import Campaign, CampaignReach
from app.services.lifecycle import (
    execute_transition, can_start_promotion, check_preconditions
)

def test_full_happy_path_lifecycle(db_session):
    # 1. Create a draft campaign
    campaign = Campaign(
        id="cmp-test-lifecycle",
        owner_id="creator-demo",
        status="draft",
        title="Valid Test Campaign Title",
        category="environment",
        creator_name="Test Creator",
        funding_goal=5000.0,
        amount_raised=0.0,
        headline="Documented Environmental Evidence",
        ad_description="Learn what the records show.",
        cover_url="https://picsum.photos/seed/test/800/500"
    )
    db_session.add(campaign)
    reach = CampaignReach(
        campaign_id=campaign.id,
        channels=["Meta", "Instagram"],
        locations=["Cook County"],
        budget_alloc={"Meta": 60, "Instagram": 40}
    )
    db_session.add(reach)
    db_session.commit()

    # Step 1: draft -> submitted (by creator)
    execute_transition(db_session, campaign, "submitted", actor_role="creator", actor_id="creator-demo")
    assert campaign.status == "submitted"
    assert campaign.submitted_at is not None

    # Step 2: submitted -> approved (by admin)
    execute_transition(db_session, campaign, "approved", actor_role="admin", actor_id="admin-demo")
    assert campaign.status == "approved"
    assert campaign.approved_at is not None

    # Step 3: approved -> available_for_funding
    execute_transition(db_session, campaign, "available_for_funding", actor_role="admin")
    assert campaign.status == "available_for_funding"
    assert campaign.published_at is not None
    assert campaign.deadline is not None

    # Step 4: Backers fund the goal
    campaign.amount_raised = 5000.0
    db_session.commit()

    # Step 5: available_for_funding -> goal_reached
    execute_transition(db_session, campaign, "goal_reached", actor_role="system")
    assert campaign.status == "goal_reached"

    # Step 6: goal_reached -> distribution_preparation
    execute_transition(db_session, campaign, "distribution_preparation", actor_role="admin")
    assert campaign.status == "distribution_preparation"

    # Step 7: distribution_preparation -> promoting (requires can_start_promotion)
    can_start, reasons = can_start_promotion(campaign)
    assert can_start is True, f"Failed preconditions: {reasons}"
    execute_transition(db_session, campaign, "promoting", actor_role="admin")
    assert campaign.status == "promoting"

    # Step 8: promoting -> completed
    execute_transition(db_session, campaign, "completed", actor_role="admin")
    assert campaign.status == "completed"

def test_illegal_transition_raises_409(db_session):
    campaign = Campaign(
        id="cmp-test-illegal",
        status="draft",
        title="Illegal Skip Campaign",
        category="health",
        creator_name="Test Creator",
        funding_goal=1000.0
    )
    db_session.add(campaign)
    db_session.commit()

    # Trying to jump directly from draft to promoting must raise 409
    with pytest.raises(HTTPException) as exc:
        execute_transition(db_session, campaign, "promoting", actor_role="admin")
    assert exc.value.status_code == 409

def test_goal_reached_never_auto_promotes(db_session):
    campaign = Campaign(
        id="cmp-test-no-autopromote",
        status="goal_reached",
        title="Goal Reached Campaign",
        category="health",
        creator_name="Test Creator",
        funding_goal=2000.0,
        amount_raised=2000.0
    )
    db_session.add(campaign)
    db_session.commit()

    # Transitioning directly from goal_reached to promoting is illegal; must go via distribution_preparation
    with pytest.raises(HTTPException) as exc:
        execute_transition(db_session, campaign, "promoting", actor_role="admin")
    assert exc.value.status_code == 409
