from app.models import Campaign, Contribution

def test_contribution_and_payment_simulation(client, user_token):
    # 1. Create a contribution owned by user
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

    # 3. Unauthorized simulation: caller without user_token cannot simulate on an owned contribution -> 403
    unauth_res = client.post(
        "/api/v1/payments/simulate",
        json={"contribution_id": contrib_id, "outcome": "failed"}
    )
    assert unauth_res.status_code == 403, "Non-owner must be forbidden from simulating owned contribution"

    # 4. Simulate failure with owner token -> amount_raised must NOT change
    fail_res = client.post(
        "/api/v1/payments/simulate",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"contribution_id": contrib_id, "outcome": "failed"}
    )
    assert fail_res.status_code == 200
    assert fail_res.json()["payment_status"] == "failed"

    camp_after_fail = client.get("/api/v1/campaigns/cmp-clean-water").json()
    assert camp_after_fail["amount_raised"] == initial_raised
    assert camp_after_fail["backer_count"] == initial_backers

    # 5. Simulate success with owner token -> amount_raised MUST increment
    succ_res = client.post(
        "/api/v1/payments/simulate",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"contribution_id": contrib_id, "outcome": "success"}
    )
    assert succ_res.status_code == 200
    assert succ_res.json()["payment_status"] == "succeeded"

    camp_after_succ = client.get("/api/v1/campaigns/cmp-clean-water").json()
    assert camp_after_succ["amount_raised"] == initial_raised + 100.0
    assert camp_after_succ["backer_count"] == initial_backers + 1

    # 6. IDEMPOTENCY / IMMUTABILITY: Once succeeded, ignore ANY status change
    retry_fail = client.post(
        "/api/v1/payments/simulate",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"contribution_id": contrib_id, "outcome": "failed"}
    )
    assert retry_fail.status_code == 200
    assert retry_fail.json().get("ignored") is True
    assert retry_fail.json()["payment_status"] == "succeeded"

    # Verify campaign amount was NOT altered by the ignored call
    camp_after_retry = client.get("/api/v1/campaigns/cmp-clean-water").json()
    assert camp_after_retry["amount_raised"] == initial_raised + 100.0
    assert camp_after_retry["backer_count"] == initial_backers + 1

    # Attempting to simulate success again also ignored (never double-credits)
    retry_succ = client.post(
        "/api/v1/payments/simulate",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"contribution_id": contrib_id, "outcome": "success"}
    )
    assert retry_succ.status_code == 200
    assert retry_succ.json().get("ignored") is True
    assert retry_succ.json()["payment_status"] == "succeeded"

    camp_final = client.get("/api/v1/campaigns/cmp-clean-water").json()
    assert camp_final["amount_raised"] == initial_raised + 100.0
    assert camp_final["backer_count"] == initial_backers + 1
