import io
import httpx
from unittest.mock import patch, AsyncMock
from app.config import settings

def test_auth_protection_on_uploads_and_ai(client, user_token):
    auth_headers = {"Authorization": f"Bearer {user_token}"}

    # 1. POST /uploads
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    # Unauthenticated -> 401
    res = client.post("/api/v1/uploads", files={"file": ("test.png", io.BytesIO(png_bytes), "image/png")})
    assert res.status_code == 401, f"Expected 401 for /uploads without token, got {res.status_code}"

    # Authenticated -> 200
    res = client.post(
        "/api/v1/uploads",
        headers=auth_headers,
        files={"file": ("test.png", io.BytesIO(png_bytes), "image/png")}
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "ok"
    assert "/uploads/" in data["url"]

    # 2. POST /ai/draft-from-text
    # Unauthenticated -> 401
    res = client.post("/api/v1/ai/draft-from-text", json={"text": "A community library proposal"})
    assert res.status_code == 401, f"Expected 401 for /ai/draft-from-text without token, got {res.status_code}"

    # Authenticated -> 200
    res = client.post(
        "/api/v1/ai/draft-from-text",
        headers=auth_headers,
        json={"text": "A community library proposal"}
    )
    assert res.status_code == 200, res.text
    assert "title" in res.json()

    # 3. POST /ai/voice-draft
    # Unauthenticated -> 401
    res = client.post("/api/v1/ai/voice-draft", json={"transcript": "Audio transcript of issue"})
    assert res.status_code == 401, f"Expected 401 for /ai/voice-draft without token, got {res.status_code}"

    # Authenticated -> 200
    res = client.post(
        "/api/v1/ai/voice-draft",
        headers=auth_headers,
        json={"transcript": "Audio transcript of issue"}
    )
    assert res.status_code == 200, res.text
    assert "title" in res.json()

    # 4. POST /ai/suggest
    # Unauthenticated -> 401
    res = client.post("/api/v1/ai/suggest", json={"topic_or_problem": "lead water pipes"})
    assert res.status_code == 401, f"Expected 401 for /ai/suggest without token, got {res.status_code}"

    # Authenticated -> 200
    res = client.post(
        "/api/v1/ai/suggest",
        headers=auth_headers,
        json={"topic_or_problem": "lead water pipes"}
    )
    assert res.status_code == 200, res.text
    assert "suggested_titles" in res.json()


def test_ai_transcribe_endpoint(client, user_token, monkeypatch):
    auth_headers = {"Authorization": f"Bearer {user_token}"}
    fake_audio = b"\x00" * 1024  # 1KB dummy audio

    # 1. No token -> 401
    res = client.post(
        "/api/v1/ai/transcribe",
        files={"file": ("recording.m4a", io.BytesIO(fake_audio), "audio/mp4")}
    )
    assert res.status_code == 401, f"Expected 401 without auth, got {res.status_code}"

    # 2. Bad file type -> 400
    res = client.post(
        "/api/v1/ai/transcribe",
        headers=auth_headers,
        files={"file": ("document.pdf", io.BytesIO(b"%PDF-1.4..."), "application/pdf")}
    )
    assert res.status_code == 400, f"Expected 400 for non-audio file, got {res.status_code}"
    assert "Unsupported audio format" in res.json()["detail"]

    # 3. Oversized file (>10MB) -> 413
    oversized = b"\x00" * (10 * 1024 * 1024 + 100)
    res = client.post(
        "/api/v1/ai/transcribe",
        headers=auth_headers,
        files={"file": ("large_audio.wav", io.BytesIO(oversized), "audio/wav")}
    )
    assert res.status_code == 413, f"Expected 413 for file > 10MB, got {res.status_code}"
    assert "exceeds maximum allowed size" in res.json()["detail"]

    # 4. No API key -> 503
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    res = client.post(
        "/api/v1/ai/transcribe",
        headers=auth_headers,
        files={"file": ("speech.m4a", io.BytesIO(fake_audio), "audio/mp4")}
    )
    assert res.status_code == 503, f"Expected 503 when GEMINI_API_KEY is unset, got {res.status_code}"
    assert "Transcription service unavailable" in res.json()["detail"]

    # 5. Mocked Gemini -> transcript returned (200 with {"transcript": "..."})
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "dummy_test_gemini_key")
    with patch("app.routers.ai.transcribe_audio_with_gemini", new_callable=AsyncMock) as mock_transcribe:
        mock_transcribe.return_value = "Thirty schools still draw drinking water through lead pipes."
        res = client.post(
            "/api/v1/ai/transcribe",
            headers=auth_headers,
            files={"file": ("real_speech.m4a", io.BytesIO(fake_audio), "audio/m4a")}
        )
        assert res.status_code == 200, res.text
        assert res.json() == {"transcript": "Thirty schools still draw drinking water through lead pipes."}
        mock_transcribe.assert_called_once()


def test_gemini_key_hygiene_and_leak_prevention(client, user_token, monkeypatch):
    auth_headers = {"Authorization": f"Bearer {user_token}"}
    fake_audio = b"\x00" * 1024
    test_key = "KEY123"
    monkeypatch.setattr(settings, "GEMINI_API_KEY", test_key)

    captured_requests = []

    # A) Test that actual outgoing request uses plain URL and x-goog-api-key header
    async def mock_post_success(self, url, *args, **kwargs):
        captured_requests.append({"url": str(url), "headers": kwargs.get("headers", {})})
        mock_response = httpx.Response(
            status_code=200,
            json={"candidates": [{"content": {"parts": [{"text": "Hygiene verified"}]}}]},
            request=httpx.Request("POST", url)
        )
        return mock_response

    with patch.object(httpx.AsyncClient, "post", new=mock_post_success):
        res = client.post(
            "/api/v1/ai/transcribe",
            headers=auth_headers,
            files={"file": ("speech.m4a", io.BytesIO(fake_audio), "audio/mp4")}
        )
        assert res.status_code == 200, res.text
        assert res.json() == {"transcript": "Hygiene verified"}
        assert len(captured_requests) == 1
        req_url = captured_requests[0]["url"]
        req_headers = captured_requests[0]["headers"]
        # Assert no key= in URL
        assert "key=" not in req_url, f"API key should not be in URL: {req_url}"
        assert test_key not in req_url, f"API key should not be in URL: {req_url}"
        # Assert key is sent in x-goog-api-key header
        assert req_headers.get("x-goog-api-key") == test_key

    # B) Force an upstream failure whose exception message contains "KEY123" and a URL with "key="
    async def mock_post_leak_failure(self, url, *args, **kwargs):
        raise httpx.ConnectError(
            f"Failed to connect to https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={test_key} with error code 500"
        )

    with patch.object(httpx.AsyncClient, "post", new=mock_post_leak_failure):
        res = client.post(
            "/api/v1/ai/transcribe",
            headers=auth_headers,
            files={"file": ("speech.m4a", io.BytesIO(fake_audio), "audio/mp4")}
        )
        assert res.status_code == 503
        body_text = res.text
        # CRITICAL ASSERTIONS:
        assert test_key not in body_text, f"Response body leaked API key: {body_text}"
        assert "key=" not in body_text, f"Response body leaked URL key param: {body_text}"
        assert res.json()["detail"] == "Transcription service unavailable"
