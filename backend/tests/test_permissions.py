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

def test_health_check_db_connectivity(client):
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "healthy"
    assert body["database"] == "connected"
    assert body["service"] == "campaign-amplifier-backend"

def test_delete_campaign_permissions(client, user_token, admin_token):
    # Unauthenticated gets 401
    unauth_res = client.delete("/api/v1/admin/campaigns/cmp-clean-water")
    assert unauth_res.status_code == 401

    # Non-admin gets 403 Forbidden
    non_admin_res = client.delete(
        "/api/v1/admin/campaigns/cmp-clean-water",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert non_admin_res.status_code == 403

    # Admin gets 200 on a test campaign
    from app.models import Campaign
    # Create a throwaway test campaign to delete
    create_res = client.post(
        "/api/v1/drafts",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"title": "Throwaway for delete test", "category": "environment"}
    )
    assert create_res.status_code == 200
    test_id = create_res.json()["id"]

    admin_del_res = client.delete(
        f"/api/v1/admin/campaigns/{test_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_del_res.status_code == 200
    assert admin_del_res.json()["status"] == "ok"
    assert admin_del_res.json()["deleted_id"] == test_id

