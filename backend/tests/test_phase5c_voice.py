from fastapi.testclient import TestClient
from app.main import app

def test_phase5c_voice_draft_api_and_rules():
    client = TestClient(app)

    # 1. Transcript without spoken URLs -> sources must be strictly empty (NEVER invent sources)
    transcript_no_urls = (
        "What is this about: Thirty public schools in this county still draw drinking water through lead service lines installed before 1970. Testing last spring found elevated lead in eleven of them.\n\n"
        "Who should see it: Parents, teachers, and school-board voters in the county, aged 28 to 55, plus municipal leaders.\n\n"
        "Why does it matter: The replacement programme is already funded at the state level, but districts have to apply before the deadline, and most lack grant staff to do it.\n\n"
        "What evidence supports it: Documented in county water testing reports from last spring and the official state lead service line replacement fund records."
    )

    res = client.post("/api/v1/ai/voice-draft", json={"transcript": transcript_no_urls})
    assert res.status_code == 200, f"Voice draft endpoint failed: {res.text}"
    data = res.json()

    # Rule 1: Title <= 60 chars
    title = data["title"]
    assert len(title) <= 60, f"Title exceeds 60 chars: {len(title)}"

    # Rule 2: Category is valid
    valid_categories = [
        "environment", "health", "science", "education", "public_policy",
        "economic_policy", "community", "arts_culture", "business", "other"
    ]
    assert data["category"] in valid_categories, f"Invalid category: {data['category']}"

    # Rule 3: Funding goal must NEVER be returned by AI
    assert "funding_goal" not in data, "Funding goal must never be produced by AI!"
    assert "goal" not in data, "Goal must never be produced by AI!"

    # Rule 4: Required fields present
    assert len(data["summary"]) > 0
    assert len(data["ad_headline"]) <= 60
    assert len(data["ad_description"]) > 0

    # Rule 5: NO INVENTED SOURCES - When no URLs are spoken, suggested_sources must be empty []
    assert data["suggested_sources"] == [], f"Sources were invented when none spoken: {data['suggested_sources']}"
    for src in data["suggested_sources"]:
        assert "example.org" not in src, f"Placeholder example.org source found: {src}"

    # 2. Transcript WITH a spoken/typed URL -> only that URL should be in suggested_sources
    transcript_with_url = (
        "What is this about: School lead testing.\n\n"
        "What evidence supports it: The report is published at https://data.county.gov/water-testing-2025 and nowhere else."
    )
    res_url = client.post("/api/v1/ai/voice-draft", json={"transcript": transcript_with_url})
    assert res_url.status_code == 200
    data_url = res_url.json()
    assert "https://data.county.gov/water-testing-2025" in data_url["suggested_sources"]
    assert len(data_url["suggested_sources"]) == 1

