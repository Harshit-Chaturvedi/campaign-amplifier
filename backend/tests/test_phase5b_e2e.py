import sys
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Campaign, Notification

def test_phase5b_creator_submission_and_admin_approval():
    print("=== Testing Phase 5B End-to-End Submission & Moderation Lifecycle ===")
    client = TestClient(app)

    # 1. Login as creator
    login_res = client.post("/api/v1/auth/login", json={
        "email": "creator@demo.org",
        "password": "demo123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    creator_token = login_res.json()["access_token"]
    creator_headers = {"Authorization": f"Bearer {creator_token}"}
    print("[1] Logged in as creator@demo.org successfully.")

    # 2. Create draft
    draft_res = client.post("/api/v1/drafts", headers=creator_headers, json={
        "title": "Phase 5B Test Campaign: Solar for Community Centers",
        "category": "environment",
        "creator_name": "Elena Rostova",
        "summary": "Funding local clean energy reach across Cook County neighborhoods."
    })
    assert draft_res.status_code == 200, f"Draft creation failed: {draft_res.text}"
    draft_data = draft_res.json()
    draft_id = draft_data["id"]
    print(f"[2] Draft created with ID: {draft_id}, initial status: {draft_data['status']}")

    # 3. Patch draft with Reach (Step 4) and Visuals
    patch_res = client.patch(f"/api/v1/drafts/{draft_id}", headers=creator_headers, json={
        "headline": "Clean solar power for our neighborhood centers",
        "ad_description": "Support verified outreach to get municipal grants installed.",
        "cover_url": "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&q=80",
        "cta": "Learn More",
        "draft_step": 4,
        "duration_days": 14,
        "reach": {
            "locations": ["Cook County", "Chicago Metro"],
            "interests": ["Public Health & Clean Water", "Environmental Quality & Parks"],
            "channels": ["Meta", "Instagram"],
            "budget_alloc": {
                "Meta": 60,
                "Instagram": 40
            }
        }
    })
    assert patch_res.status_code == 200, f"Patch reach failed: {patch_res.text}"
    print(f"[3] Step 4 Reach saved successfully: {patch_res.json()['reach']}")

    # 4. Patch draft with Goal (Step 5)
    goal_res = client.patch(f"/api/v1/drafts/{draft_id}", headers=creator_headers, json={
        "funding_goal": 2500,
        "draft_step": 5
    })
    assert goal_res.status_code == 200, f"Patch goal failed: {goal_res.text}"
    print(f"[4] Step 5 Goal saved ($2,500): est_reach={goal_res.json()['estimated_reach_at_goal']}")

    # 5. Submit draft for review
    submit_res = client.post(f"/api/v1/drafts/{draft_id}/submit", headers=creator_headers)
    assert submit_res.status_code == 200, f"Submit failed: {submit_res.text}"
    submit_data = submit_res.json()
    assert submit_data["campaign_status"] == "submitted"
    print(f"[5] Draft submitted successfully. Status: {submit_data['campaign_status']}")

    # 6. Verify campaign appears in GET /me/campaigns with status 'submitted'
    my_camps_res = client.get("/api/v1/me/campaigns", headers=creator_headers)
    assert my_camps_res.status_code == 200, f"List my campaigns failed: {my_camps_res.text}"
    my_camps = my_camps_res.json()
    found = next((c for c in my_camps if c["id"] == draft_id), None)
    assert found is not None, f"Campaign {draft_id} not found in /me/campaigns"
    assert found["status"] == "submitted"
    print(f"[6] Verified campaign in creator's /me/campaigns list with status 'submitted'")

    # 7. Login as admin
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@demo.org",
        "password": "demo123"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[7] Logged in as admin@demo.org")

    # 8. Approve campaign via /admin endpoint
    approve_res = client.post(f"/api/v1/admin/campaigns/{draft_id}/approve", headers=admin_headers, json={
        "note": "Content, sources, creative and targeting reviewed."
    })
    assert approve_res.status_code == 200, f"Approve failed: {approve_res.text}"
    approved_data = approve_res.json()
    assert approved_data["status"] == "ok"
    assert approved_data["campaign_status"] == "available_for_funding"
    print(f"[8] Campaign approved via admin endpoint. Status: {approved_data['campaign_status']}")

    # 9. Verify campaign status in creator's /me/campaigns is now 'available_for_funding'
    my_camps_res2 = client.get("/api/v1/me/campaigns", headers=creator_headers)
    my_camps2 = my_camps_res2.json()
    found2 = next((c for c in my_camps2 if c["id"] == draft_id), None)
    assert found2 is not None
    assert found2["status"] == "available_for_funding"
    print(f"[9] Creator's /me/campaigns confirms status changed to '{found2['status']}'")

    # 10. Check creator's notifications
    db = SessionLocal()
    notif = db.query(Notification).filter(
        Notification.campaign_id == draft_id,
        Notification.user_id == "creator-demo"
    ).first()
    assert notif is not None, "Notification not created for creator"
    print(f"[10] Verified creator notification: '{notif.title}' - '{notif.body}'")
    db.close()

    print("\n>>> ALL PHASE 5B END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    verify_phase5b()
