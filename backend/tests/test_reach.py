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
