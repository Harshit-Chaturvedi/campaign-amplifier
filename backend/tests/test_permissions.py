def test_admin_permissions(client, user_token, admin_token):
    # Non-admin user gets 403 Forbidden
    res = client.get(
        "/api/v1/admin/review-queue",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert res.status_code == 403

    # Admin gets 200 OK
    admin_res = client.get(
        "/api/v1/admin/review-queue",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_res.status_code == 200
    queue = admin_res.json()
    assert isinstance(queue, list)

def test_admin_approval_and_notification(client, admin_token, db_session):
    # Campaign cmp-ballot-plain is in 'submitted'
    camp_res = client.get("/api/v1/campaigns/cmp-ballot-plain")
    assert camp_res.status_code == 200
    assert camp_res.json()["status"] == "submitted"

    # Admin approves
    approve_res = client.post(
        "/api/v1/admin/campaigns/cmp-ballot-plain/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"note": "Approved by review team"}
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["campaign_status"] == "available_for_funding"

    # Campaign is now available_for_funding
    updated_camp = client.get("/api/v1/campaigns/cmp-ballot-plain").json()
    assert updated_camp["status"] == "available_for_funding"

def test_privacy_no_leaked_emails(client):
    # Public campaign detail
    res = client.get("/api/v1/campaigns/cmp-clean-water")
    assert res.status_code == 200
    data = res.text
    # Guest email from seed data must NOT appear in public output
    assert "guest.sarah@example.com" not in data
    assert "rural.operator@example.com" not in data
