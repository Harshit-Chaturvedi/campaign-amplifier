from app.models import Campaign, Contribution

def test_contribution_and_payment_simulation(client, user_token):
    # 1. Create a contribution (guest or user)
    res = client.post(
        "/api/v1/contributions",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "campaign_id": "cmp-clean-water",
            "amount": 100.0,
            "show_name": False
        }
    )
    assert res.status_code == 200, res.text
    contrib = res.json()
    assert contrib["status"] == "pending"
    assert contrib["amount"] == 100.0
    assert contrib["receipt_no"].startswith("REC-")
    contrib_id = contrib["id"]

    # 2. Get campaign before simulation
    camp_before = client.get("/api/v1/campaigns/cmp-clean-water").json()
    initial_raised = camp_before["amount_raised"]
    initial_backers = camp_before["backer_count"]

    # 3. Simulate failure -> amount_raised must NOT change
    fail_res = client.post(
        "/api/v1/payments/simulate",
        json={"contribution_id": contrib_id, "outcome": "failed"}
    )
    assert fail_res.status_code == 200
    assert fail_res.json()["payment_status"] == "failed"

    camp_after_fail = client.get("/api/v1/campaigns/cmp-clean-water").json()
    assert camp_after_fail["amount_raised"] == initial_raised
    assert camp_after_fail["backer_count"] == initial_backers

    # 4. Simulate success -> amount_raised MUST increment
    succ_res = client.post(
        "/api/v1/payments/simulate",
        json={"contribution_id": contrib_id, "outcome": "success"}
    )
    assert succ_res.status_code == 200
    assert succ_res.json()["payment_status"] == "succeeded"

    camp_after_succ = client.get("/api/v1/campaigns/cmp-clean-water").json()
    assert camp_after_succ["amount_raised"] == initial_raised + 100.0
    assert camp_after_succ["backer_count"] == initial_backers + 1
