from fastapi.testclient import TestClient
from app.main import app

def test_phase5c_voice_draft_api_and_rules():
    client = TestClient(app)

    transcript = (
        "What is this about: Thirty public schools in this county still draw drinking water through lead service lines installed before 1970. Testing last spring found elevated lead in eleven of them.\n\n"
        "Who should see it: Parents, teachers, and school-board voters in the county, aged 28 to 55, plus municipal leaders.\n\n"
        "Why does it matter: The replacement programme is already funded at the state level, but districts have to apply before the deadline, and most lack grant staff to do it.\n\n"
        "What evidence supports it: Documented in county water testing reports from last spring and the official state lead service line replacement fund records."
    )

    res = client.post("/api/v1/ai/voice-draft", json={"transcript": transcript})
    assert res.status_code == 200, f"Voice draft endpoint failed: {res.text}"
    data = res.json()

    print("\n[AI Voice-Draft Response]")
    print(f"Title: {data.get('title')}")
    print(f"Category: {data.get('category')}")
    print(f"Summary: {data.get('summary')}")
    print(f"Ad Headline: {data.get('ad_headline')}")
    print(f"Ad Description: {data.get('ad_description')}")
    print(f"Suggested Sources: {data.get('suggested_sources')}")
    print(f"Suggested Channels: {data.get('suggested_channels')}")

    # Check rule 1: Title <= 60 chars
    title = data["title"]
    assert len(title) <= 60, f"Title exceeds 60 chars: {len(title)}"

    # Check rule 2: Category is valid
    valid_categories = [
        "environment", "health", "science", "education", "public_policy",
        "economic_policy", "community", "arts_culture", "business", "other"
    ]
    assert data["category"] in valid_categories, f"Invalid category: {data['category']}"

    # Check rule 3: Funding goal must NEVER be returned by AI
    assert "funding_goal" not in data, "Funding goal must never be produced by AI!"
    assert "goal" not in data, "Goal must never be produced by AI!"

    # Check rule 4: Required fields present
    assert len(data["summary"]) > 0
    assert len(data["ad_headline"]) <= 60
    assert len(data["ad_description"]) > 0
    assert isinstance(data["suggested_sources"], list)
