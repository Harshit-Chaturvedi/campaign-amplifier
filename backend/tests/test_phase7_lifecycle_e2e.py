import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.models import Campaign, Notification, Report, Contribution

client = TestClient(app)

def test_phase7_complete_lifecycle_e2e(db_session):
    """
    Test Phase 7 requirement 6:
    Run a campaign through its entire lifecycle from /admin:
    approve -> available for funding -> back it -> start promotion -> simulate delivery -> complete.
    Confirm notifications are generated at each step,
    creator dashboard / public endpoints show the right status,
    and report page shows measured numbers.
    """
    # 1. Login as creator
    creator_login = client.post("/api/v1/auth/login", json={
        "email": "creator@demo.org",
        "password": "demo123"
    })
    assert creator_login.status_code == 200, creator_login.text
    creator_token = creator_login.json()["access_token"]
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    # 2. Creator creates draft campaign
    draft_res = client.post("/api/v1/drafts", headers=creator_headers, json={
        "title": "Clean School Air Filters Project",
        "category": "health",
        "creator_name": "Dr. Aris Thorne",
        "summary": "Upgrading HVAC filters in 12 high-traffic classrooms across the district."
    })
    assert draft_res.status_code in [200, 201], draft_res.text
    campaign_id = draft_res.json()["id"]

    # 3. Patch draft with details, reach, and funding goal
    patch_res = client.patch(f"/api/v1/drafts/{campaign_id}", headers=creator_headers, json={
        "tagline": "Cleaner air for growing minds.",
        "cover_url": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80",
        "headline": "Classroom Air Quality Matters",
        "ad_description": "Join our community initiative to fund medical-grade air filtration.",
        "reach_channels": ["facebook", "instagram"],
        "reach_locations": ["Metro District"],
        "reach_interests": ["Public Health", "Education"],
        "budget_allocation": {"facebook": 50, "instagram": 50},
        "funding_goal": 2000.0,
        "duration_days": 14,
        "draft_step": 5
    })
    assert patch_res.status_code == 200, patch_res.text

    # 4. Creator submits campaign for review
    submit_res = client.post(f"/api/v1/drafts/{campaign_id}/submit", headers=creator_headers)
    assert submit_res.status_code == 200, submit_res.text
    assert submit_res.json()["campaign_status"] == "submitted"

    # 5. Admin logs in
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@demo.org",
        "password": "demo123"
    })
    assert admin_login.status_code == 200, admin_login.text
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Verify review queue contains the submitted campaign
    queue_res = client.get("/api/v1/admin/review-queue", headers=admin_headers)
    assert queue_res.status_code == 200
    queue_ids = [c["id"] for c in queue_res.json()]
    assert campaign_id in queue_ids

    # 6. Admin approves campaign -> transitions to approved then available_for_funding
    approve_res = client.post(
        f"/api/v1/admin/campaigns/{campaign_id}/approve",
        headers=admin_headers,
        json={"note": "Approved by moderation team with verified public health sources."}
    )
    assert approve_res.status_code == 200, approve_res.text
    assert approve_res.json()["campaign_status"] == "available_for_funding"

    # Verify notification generated for creator
    notifs_res = client.get("/api/v1/notifications", headers=creator_headers)
    assert notifs_res.status_code == 200
    notif_titles = [n["title"] for n in notifs_res.json()]
    assert any("Available For Funding" in t or "Approved" in t for t in notif_titles)

    # 7. Backer creates a contribution and simulates successful payment
    contrib_res = client.post("/api/v1/contributions", json={
        "campaign_id": campaign_id,
        "amount": 2000.0,
        "show_name": False,
        "guest_email": "secret@demo.org"
    })
    assert contrib_res.status_code == 200, contrib_res.text
    contrib_id = contrib_res.json()["id"]
    receipt_no = contrib_res.json()["receipt_no"]

    sim_pay = client.post("/api/v1/payments/simulate", json={
        "contribution_id": contrib_id,
        "outcome": "success"
    })
    assert sim_pay.status_code == 200, sim_pay.text

    # Confirm rule: goal reached does NOT start ads automatically
    camp_res = client.get(f"/api/v1/campaigns/{campaign_id}")
    assert camp_res.status_code == 200
    assert camp_res.json()["status"] == "goal_reached"

    # 8. Admin starts promotion -> moves to distribution_preparation then promoting
    promo_res = client.post(
        f"/api/v1/admin/campaigns/{campaign_id}/start-promotion",
        headers=admin_headers
    )
    assert promo_res.status_code == 200, promo_res.text
    assert promo_res.json()["campaign_status"] == "promoting"

    # 9. Admin simulates delivery (ad impressions and clicks recorded)
    sim_res = client.post(
        f"/api/v1/admin/campaigns/{campaign_id}/simulate-delivery",
        headers=admin_headers,
        json={
            "impressions": 84200,
            "measured_reach": 42100,
            "clicks": 1850
        }
    )
    assert sim_res.status_code == 200, sim_res.text
    assert sim_res.json()["impressions"] == 84200
    assert sim_res.json()["measured_reach"] == 42100

    # 10. Admin completes campaign
    complete_res = client.post(
        f"/api/v1/admin/campaigns/{campaign_id}/complete",
        headers=admin_headers
    )
    assert complete_res.status_code == 200, complete_res.text
    assert complete_res.json()["campaign_status"] == "completed"

    # 11. Check public analytics / report endpoint
    analytics_res = client.get(f"/api/v1/campaigns/{campaign_id}/analytics")
    assert analytics_res.status_code == 200, analytics_res.text
    report_data = analytics_res.json()

    # Verify measured data label is explicit and honest
    assert report_data["delivery"]["measured"]["label"] == "Measured (demo data)"
    assert report_data["delivery"]["measured"]["impressions"] == 84200
    assert report_data["delivery"]["measured"]["measured_reach"] == 42100
    assert report_data["delivery"]["measured"]["clicks"] == 1850
    assert report_data["delivery"]["measured"]["is_final"] is True

    # Verify estimates label
    assert "Estimated" in report_data["delivery"]["estimated"]["label"]

    # Verify funding summary: 2000 raised, 1 backer
    assert report_data["funding"]["amount_raised"] == 2000.0
    assert report_data["funding"]["backer_count"] == 1
    assert report_data["funding"]["percent_funded"] == 100

    # 12. Check receipt retrieval
    receipt_res = client.get(f"/api/v1/receipts/{receipt_no}")
    assert receipt_res.status_code == 200, receipt_res.text
    receipt_data = receipt_res.json()
    assert receipt_data["amount"] == 2000.0
    assert receipt_data["show_name"] is False
    assert "secret@demo.org" not in str(receipt_data)

    # 13. Notifications verification
    final_notifs_res = client.get("/api/v1/notifications", headers=creator_headers)
    assert final_notifs_res.status_code == 200
    all_notif_titles = [n["title"] for n in final_notifs_res.json()]
    assert any("Completed" in t for t in all_notif_titles)
