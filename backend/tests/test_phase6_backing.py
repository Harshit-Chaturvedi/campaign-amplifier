import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_phase6_guest_backing_flow_and_rules():
    client = TestClient(app)

    # 1. Browse public campaigns as a guest (no auth header)
    res = client.get("/api/v1/campaigns")
    assert res.status_code == 200
    campaigns = res.json()
    assert len(campaigns) > 0

    # Pick an available_for_funding campaign
    target_campaign = next((c for c in campaigns if c["status"] == "available_for_funding"), campaigns[0])
    cid = target_campaign["id"]
    initial_raised = target_campaign["amount_raised"]
    initial_backers = target_campaign["backer_count"]

    # 2. Guest backs campaign without login (Guest Backing)
    # Contribution amount: $50.00
    # Expected payment processing fee: 50 * 0.029 + 0.30 = $1.75
    # Total charged: $51.75
    contrib_payload = {
        "campaign_id": cid,
        "amount": 50.0,
        "guest_email": "guest.backer@example.com",
        "show_name": False # PRIVATE BY DEFAULT!
    }

    res_contrib = client.post("/api/v1/contributions", json=contrib_payload)
    assert res_contrib.status_code == 200, f"Guest contribution failed: {res_contrib.text}"
    contrib_data = res_contrib.json()

    assert contrib_data["amount"] == 50.0
    assert contrib_data["fee"] == 1.75 # 2.9% + $0.30
    assert contrib_data["total"] == 51.75
    assert contrib_data["status"] == "pending"
    assert contrib_data["show_name"] is False
    assert contrib_data["backer_name"] == "Anonymous" # Name private by default!
    assert contrib_data["receipt_no"].startswith("REC-")
    contrib_id = contrib_data["id"]
    receipt_no = contrib_data["receipt_no"]

    # 3. Test Simulated Checkout Outcomes
    # Test Failed Simulation
    res_failed = client.post("/api/v1/payments/simulate", json={
        "contribution_id": contrib_id,
        "outcome": "failed"
    })
    assert res_failed.status_code == 200
    failed_data = res_failed.json()
    assert failed_data["payment_status"] == "failed"

    # Verify amount_raised has NOT increased
    res_c_check = client.get(f"/api/v1/campaigns/{cid}")
    assert res_c_check.json()["amount_raised"] == initial_raised

    # Test Pending Simulation
    res_pending = client.post("/api/v1/payments/simulate", json={
        "contribution_id": contrib_id,
        "outcome": "pending"
    })
    assert res_pending.status_code == 200
    assert res_pending.json()["payment_status"] == "pending"
    assert client.get(f"/api/v1/campaigns/{cid}").json()["amount_raised"] == initial_raised

    # Test Cancelled Simulation
    res_cancelled = client.post("/api/v1/payments/simulate", json={
        "contribution_id": contrib_id,
        "outcome": "cancelled"
    })
    assert res_cancelled.status_code == 200
    assert res_cancelled.json()["payment_status"] == "cancelled"
    assert client.get(f"/api/v1/campaigns/{cid}").json()["amount_raised"] == initial_raised

    # 4. Test Succeeded Simulation -> increments raised and backer_count
    res_success = client.post("/api/v1/payments/simulate", json={
        "contribution_id": contrib_id,
        "outcome": "success"
    })
    assert res_success.status_code == 200
    success_data = res_success.json()
    assert success_data["payment_status"] == "succeeded"
    assert success_data["campaign_amount_raised"] == initial_raised + 50.0

    # Verify campaign updated
    res_c_updated = client.get(f"/api/v1/campaigns/{cid}")
    updated_campaign = res_c_updated.json()
    assert updated_campaign["amount_raised"] == initial_raised + 50.0
    assert updated_campaign["backer_count"] == initial_backers + 1

    # 5. Verify Digital Receipt Retrieval
    res_receipt = client.get(f"/api/v1/receipts/{receipt_no}")
    assert res_receipt.status_code == 200
    receipt_data = res_receipt.json()
    assert receipt_data["receipt_no"] == receipt_no
    assert receipt_data["amount"] == 50.0
    assert receipt_data["fee"] == 1.75
    assert receipt_data["total"] == 51.75
    assert receipt_data["status"] == "succeeded"
    assert receipt_data["show_name"] is False
    assert receipt_data["estimated_reach"] > 0

def test_phase6_goal_reached_never_starts_ads():
    client = TestClient(app)

    # Find or pick an available campaign
    res = client.get("/api/v1/campaigns")
    available = [c for c in res.json() if c["status"] == "available_for_funding"]
    assert len(available) > 0
    camp = available[0]
    cid = camp["id"]
    remaining = camp["funding_goal"] - camp["amount_raised"]

    # Fund remaining amount + 10 to push it over 100%
    fund_amount = max(remaining + 10, 50.0)
    res_contrib = client.post("/api/v1/contributions", json={
        "campaign_id": cid,
        "amount": fund_amount,
        "show_name": False
    })
    assert res_contrib.status_code == 200
    contrib_id = res_contrib.json()["id"]

    # Simulate success
    res_sim = client.post("/api/v1/payments/simulate", json={
        "contribution_id": contrib_id,
        "outcome": "success"
    })
    assert res_sim.status_code == 200
    sim_data = res_sim.json()

    # CRITICAL RULE: Goal reached transitions to 'goal_reached', NEVER starts ads ('promoting')
    assert sim_data["campaign_status"] == "goal_reached"
    assert sim_data["campaign_status"] != "promoting"
    assert sim_data["campaign_status"] != "distribution_preparation"

    # Verify on public detail endpoint as well
    res_detail = client.get(f"/api/v1/campaigns/{cid}")
    detail = res_detail.json()
    assert detail["status"] == "goal_reached"
    assert detail["status"] != "promoting"
