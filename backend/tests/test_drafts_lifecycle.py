import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_draft_lifecycle_and_404_handling():
    # 1. Login as user to get auth token
    login_resp = client.post("/api/v1/auth/login", json={"email": "creator@demo.org", "password": "demo123"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. POST /drafts -> create a new draft
    create_resp = client.post("/api/v1/drafts", json={
        "title": "Clean Tap Water in County Schools",
        "category": "health",
        "creator_name": "Elena Rostova",
        "summary": "Documented elevated lead levels across school drinking water.",
        "funding_goal": 2500.0,
    }, headers=headers)
    assert create_resp.status_code == 200
    draft_data = create_resp.json()
    draft_id = draft_data["id"]
    assert draft_id.startswith("cmp-")
    assert draft_data["status"] == "draft"
    assert draft_data["title"] == "Clean Tap Water in County Schools"
    assert draft_data["funding_goal"] == 2500.0

    # 3. PATCH /drafts/{id} -> update fields
    patch_resp = client.patch(f"/api/v1/drafts/{draft_id}", json={
        "title": "Clean Tap Water in Every County Public School",
        "summary": "Updated summary with test report citations.",
        "funding_goal": 3000.0,
        "draft_step": 5,
        "headline": "Lead levels documented in 11 schools.",
        "ad_description": "State funds exist to fix school water lines.",
        "cta": "Learn More",
    }, headers=headers)
    assert patch_resp.status_code == 200
    patched_data = patch_resp.json()
    assert patched_data["title"] == "Clean Tap Water in Every County Public School"
    assert patched_data["funding_goal"] == 3000.0
    assert patched_data["draft_step"] == 5

    # 4. POST /drafts/{id}/submit -> transitions to submitted
    submit_resp = client.post(f"/api/v1/drafts/{draft_id}/submit", headers=headers)
    assert submit_resp.status_code == 200
    submit_data = submit_resp.json()
    assert submit_data["status"] == "ok"
    assert submit_data["campaign_status"] == "submitted"

    # 5. PATCH /drafts/{non-existent-id} -> returns 404
    non_existent_patch = client.patch("/api/v1/drafts/cmp-nonexistent-12345", json={
        "title": "Should Fail",
    }, headers=headers)
    assert non_existent_patch.status_code == 404
    assert "not found" in non_existent_patch.json()["detail"].lower()

    # 6. POST /drafts/{non-existent-id}/submit -> returns 404
    non_existent_submit = client.post("/api/v1/drafts/cmp-nonexistent-12345/submit", headers=headers)
    assert non_existent_submit.status_code == 404
    assert "not found" in non_existent_submit.json()["detail"].lower()
