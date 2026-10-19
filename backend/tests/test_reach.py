from app.services.reach import estimate_reach, estimate_reach_per_dollar, calculate_backer_fee
from app.config import settings

def test_reach_estimation_formula():
    amount = 100.0
    result = estimate_reach(amount)
    
    # 1. ad_budget = 100 * (1 - 0.05) = 95.0
    expected_budget = 95.0
    assert result["ad_budget"] == expected_budget
    
    # 2. impressions = (95.0 / 14.50) * 1000 = 6551.72 -> 6552
    expected_impressions = int(round((expected_budget / settings.CPM_USD) * 1000.0))
    assert result["impressions"] == expected_impressions
    
    # 3. estimate = impressions / 2.2
    expected_estimate = int(round(expected_impressions / settings.AVG_FREQUENCY))
    assert result["estimate"] == expected_estimate
    assert result["label"] == "Estimate"

def test_reach_per_dollar():
    rpd = estimate_reach_per_dollar()
    assert rpd == 30  # For CPM $14.50, freq 2.2, platform fee 5%, rpd is exactly 30

def test_calculate_backer_fee():
    amount = 50.0
    fee, total = calculate_backer_fee(amount)
    expected_fee = round(50.0 * 0.029 + 0.30, 2)
    assert fee == expected_fee
    assert total == round(amount + expected_fee, 2)

def test_reach_consistency_for_three_active_campaigns(client):
    """
    Consistency test for 3 campaigns that are NOT at 100%:
    - cmp-clean-water (Goal $8,000, Raised $5,340)
    - cmp-antibiotic-watch (Goal $9,500, Raised $4,200)
    - cmp-tree-canopy (Goal $11,000, Raised $7,650)
    Verifies reach at goal and reach at current funding match between
    reach service, campaign detail, and report analytics endpoint.
    """
    test_cases = [
        ("cmp-clean-water", 8000.0, 5340.0),
        ("cmp-antibiotic-watch", 9500.0, 4200.0),
        ("cmp-tree-canopy", 11000.0, 7650.0),
    ]

    for cid, goal, raised in test_cases:
        # Expected from reach formula
        exp_reach_goal = estimate_reach(goal)["estimate"]
        exp_reach_current = estimate_reach(raised)["estimate"]

        # 1. From campaign detail
        camp_res = client.get(f"/api/v1/campaigns/{cid}")
        assert camp_res.status_code == 200
        camp_data = camp_res.json()
        assert camp_data["funding_goal"] == goal
        assert camp_data["amount_raised"] == raised
        assert camp_data["estimated_reach_at_goal"] == exp_reach_goal

        # 2. From report analytics
        ana_res = client.get(f"/api/v1/campaigns/{cid}/analytics")
        assert ana_res.status_code == 200
        ana_data = ana_res.json()
        assert ana_data["delivery"]["estimated"]["reach"] == exp_reach_current
        assert ana_data["delivery"]["estimated_at_goal"]["reach"] == exp_reach_goal

def test_seed_parity_clean_water(client):
    """Confirm clean water campaign has amount_raised = 5340.0 in backend seed"""
    res = client.get("/api/v1/campaigns/cmp-clean-water")
    assert res.status_code == 200
    data = res.json()
    assert data["amount_raised"] == 5340.0
    assert data["funding_goal"] == 8000.0

def test_published_campaign_stays_in_explore(client, db_session):
    """
    Creator Edit on live campaign:
    Active campaign must stay available_for_funding and remain visible in /campaigns.
    Attempting invalid transition to draft or changes_requested raises 400 Bad Request.
    """
    import pytest
    from fastapi import HTTPException
    from app.services.lifecycle import execute_transition
    from app.models import Campaign

    # 1. Available in /campaigns
    list_res = client.get("/api/v1/campaigns")
    assert list_res.status_code == 200
    active_ids = [c["id"] for c in list_res.json()]
    assert "cmp-clean-water" in active_ids

    # 2. Transition available_for_funding -> draft or changes_requested is rejected
    camp = db_session.query(Campaign).filter(Campaign.id == "cmp-clean-water").first()
    assert camp.status == "available_for_funding"

    with pytest.raises(HTTPException) as excinfo:
        execute_transition(db_session, camp, to_status="draft", actor_role="creator")
    assert excinfo.value.status_code == 409
    assert "Illegal transition" in excinfo.value.detail

    with pytest.raises(HTTPException) as excinfo2:
        execute_transition(db_session, camp, to_status="changes_requested", actor_role="creator")
    assert excinfo2.value.status_code == 409

    # 3. Campaign is still available_for_funding and in /campaigns
    camp_res = client.get("/api/v1/campaigns/cmp-clean-water")
    assert camp_res.status_code == 200
    assert camp_res.json()["status"] == "available_for_funding"

    list_res2 = client.get("/api/v1/campaigns")
    assert "cmp-clean-water" in [c["id"] for c in list_res2.json()]

