import math
from typing import Dict, Any, Tuple
from app.config import settings

def estimate_reach(amount: float) -> Dict[str, Any]:
    safe_amount = max(0.0, float(amount))
    ad_budget = round(safe_amount * (1.0 - settings.PLATFORM_FEE_PCT), 2)
    impressions = int(round((ad_budget / settings.CPM_USD) * 1000.0))
    estimate = int(round(impressions / settings.AVG_FREQUENCY))

    return {
        "estimate": estimate,
        "ad_budget": ad_budget,
        "impressions": impressions,
        "assumptions": {
            "cpm_usd": settings.CPM_USD,
            "avg_frequency": settings.AVG_FREQUENCY,
            "platform_fee_pct": settings.PLATFORM_FEE_PCT,
        },
        "label": "Estimate"
    }

def estimate_reach_per_dollar() -> int:
    return estimate_reach(1.0)["estimate"]

def calculate_backer_fee(amount: float) -> Tuple[float, float]:
    safe_amount = max(0.0, float(amount))
    fee = round(safe_amount * settings.PAYMENT_FEE_PCT + settings.PAYMENT_FEE_FIXED, 2)
    total = round(safe_amount + fee, 2)
    return fee, total
