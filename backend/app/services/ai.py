import re
import json
import base64
import time
import httpx
from typing import Dict, Any, List
from fastapi import HTTPException, status
from app.config import settings
from app.schemas import AIDraftResponse, AISuggestResponse

CATEGORIES = [
    "environment", "health", "science", "education", "public_policy",
    "economic_policy", "community", "arts_culture", "business", "other"
]

def extract_explicit_urls(text: str) -> List[str]:
    raw_urls = re.findall(r"https?://[^\s,;'\"<>]+|www\.[^\s,;'\"<>]+", text or "")
    cleaned: List[str] = []
    for u in raw_urls:
        u_clean = u.rstrip(".,;!?:)")
        if not u_clean.startswith("http"):
            u_clean = "https://" + u_clean
        if u_clean not in cleaned:
            cleaned.append(u_clean)
    return cleaned

def fallback_draft(text: str) -> AIDraftResponse:
    clean = re.sub(r"[^\w\s-]", " ", text).strip()
    words = [w for w in clean.split() if len(w) > 3]
    first = words[0].capitalize() if words else "Public"
    second = words[1].capitalize() if len(words) > 1 else "Action"

    # Category matching heuristic
    text_lower = text.lower()
    cat = "community"
    if any(k in text_lower for k in ["water", "tree", "heat", "climate", "solar", "waste", "river"]):
        cat = "environment"
    elif any(k in text_lower for k in ["health", "clinic", "air", "hospital", "patient", "disease", "drug"]):
        cat = "health"
    elif any(k in text_lower for k in ["school", "library", "student", "teacher", "education"]):
        cat = "education"
    elif any(k in text_lower for k in ["research", "science", "antibiotic", "data", "lab", "study"]):
        cat = "science"
    elif any(k in text_lower for k in ["ballot", "airport", "council", "ordinance", "zoning", "policy"]):
        cat = "public_policy"
    elif any(k in text_lower for k in ["farm", "repair", "tax", "wage", "tenant", "worker", "economy"]):
        cat = "economic_policy"
    elif any(k in text_lower for k in ["theatre", "art", "music", "culture", "museum"]):
        cat = "arts_culture"
    elif any(k in text_lower for k in ["coop", "business", "store", "commerce", "energy"]):
        cat = "business"

    title = f"{first} {second}: What Needs to Change"[:60]
    summary = (text[:150] + ("..." if len(text) > 150 else "")).strip()

    return AIDraftResponse(
        title=title,
        category=cat,
        summary=summary,
        tagline=f"Amplifying real evidence to reach decision makers on {cat.replace('_', ' ')}.",
        target_audience="Local residents, municipal voters, and community stakeholders aged 25-64.",
        ad_headline=f"{first} {second}. The documented facts."[:60],
        ad_description=f"Evidence shows that public action is overdue. See the traceable citations and learn what needs to happen.",
        suggested_sources=extract_explicit_urls(text),
        suggested_channels=["Meta", "Instagram", "Reddit"],
        demo_mode=True
    )

def fallback_suggest(topic: str) -> AISuggestResponse:
    t = topic.strip().capitalize()
    return AISuggestResponse(
        suggested_titles=[
            f"Fixing {t} for the Whole Community"[:60],
            f"What the Data Says About {t}"[:60],
            f"Independent Action on {t} Today"[:60],
        ],
        suggested_categories=[
            "community", "public_policy", "environment"
        ],
        suggested_summaries=[
            f"A focused campaign to publish the evidence on {topic} and reach audiences who can take action.",
            f"Most residents never hear about {topic} in their daily news. We are pooling funds to run targeted ads.",
            f"The documentation exists, but decision makers haven't acted. Targeted amplification bridges that gap."
        ],
        demo_mode=True
    )

import logging

logger = logging.getLogger("campaign.ai")

async def generate_draft_with_gemini(text: str) -> AIDraftResponse:
    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not configured. Using deterministic demo-mode fallback.")
        return fallback_draft(text)

    prompt = f"""
You are an expert campaign messaging strategist for an advertising amplification platform.
The user wants to run a digital advertising campaign to spread a documented message.
Note: DO NOT generate a funding goal under any circumstances.
CRITICAL SOURCES RULE: Never invent or hallucinate sources or URLs. "suggested_sources" may contain ONLY valid URLs that the user explicitly typed or spoke in the text below. If no URLs were given by the user, return an empty array [] for "suggested_sources".

User provided text:
\"\"\"{text}\"\"\"

Generate a JSON object matching this schema exactly:
{{
  "title": "A concise headline, max 60 chars",
  "category": "one of: environment, health, science, education, public_policy, economic_policy, community, arts_culture, business, other",
  "summary": "1-2 sentences summarizing the core issue and why it matters",
  "tagline": "A punchy single line",
  "target_audience": "Who should see this ad",
  "ad_headline": "Ad headline, max 60 chars",
  "ad_description": "2-3 sentences of ad copy",
  "suggested_sources": [],
  "suggested_channels": ["Meta", "Instagram", "Reddit"]
}}
Return ONLY raw JSON. No markdown backticks.
"""
    model_name = settings.GEMINI_MODEL or "gemini-3.8-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
    headers = {
        "x-goog-api-key": settings.GEMINI_API_KEY,
        "Content-Type": "application/json",
    }
    for attempt in range(2):
        try:
            try:
                transport = httpx.AsyncHTTPTransport(local_address="0.0.0.0")
            except Exception:
                transport = None
            async with httpx.AsyncClient(transport=transport, timeout=30.0) as client:
                res = await client.post(url, headers=headers, json={"contents": [{"parts": [{"text": prompt}]}]})
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    if raw_text.startswith("```"):
                        raw_text = re.sub(r"^```[a-z]*\n", "", raw_text)
                        raw_text = re.sub(r"\n```$", "", raw_text)
                    parsed = json.loads(raw_text)
                    parsed["demo_mode"] = False
                    
                    # Strictly filter sources: only URLs explicitly mentioned in user text
                    explicit_urls = extract_explicit_urls(text)
                    raw_sources = parsed.get("suggested_sources", [])
                    filtered_sources = [s for s in raw_sources if any(eu in s or s in eu for eu in explicit_urls)]
                    for eu in explicit_urls:
                        if eu not in filtered_sources:
                            filtered_sources.append(eu)
                    parsed["suggested_sources"] = filtered_sources
                    
                    logger.info("Successfully generated campaign draft using Gemini model: %s", model_name)
                    return AIDraftResponse(**parsed)
                else:
                    logger.warning("Gemini API call returned status %s", res.status_code)
        except Exception as err:
            logger.warning("Gemini API attempt %d failed: %s", attempt + 1, type(err).__name__)
            continue

    logger.info("Gemini generation failed or timed out. Falling back to demo-mode draft.")
    return fallback_draft(text)

async def transcribe_audio_with_gemini(audio_bytes: bytes, mime_type: str = "audio/mp4") -> str:
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Transcription service unavailable"
        )

    if len(audio_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Audio file exceeds maximum allowed size of 10MB"
        )

    # Normalize to standard Gemini audio MIME types
    if mime_type in ["audio/m4a", "audio/x-m4a", "video/mp4"]:
        mime_type = "audio/mp4"
    elif mime_type in ["audio/x-wav", "audio/wave"]:
        mime_type = "audio/wav"

    b64_data = base64.b64encode(audio_bytes).decode("utf-8")
    primary_model = settings.GEMINI_MODEL or "gemini-3.8-flash"
    fallback_model = "gemini-3.6-flash"

    # Try primary model, retry once with fallback model on timeout or 5xx
    models_to_try = [primary_model]
    if fallback_model != primary_model:
        models_to_try.append(fallback_model)

    headers = {
        "x-goog-api-key": settings.GEMINI_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        transport = httpx.AsyncHTTPTransport(local_address="0.0.0.0")
    except Exception:
        transport = None

    for attempt, model_name in enumerate(models_to_try):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        start_time = time.perf_counter()

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_data
                            }
                        },
                        {
                            "text": "Transcribe this audio verbatim. Return only the text."
                        }
                    ]
                }
            ],
            "generationConfig": {
                "thinkingConfig": {
                    "thinkingBudget": 0
                }
            }
        }

        try:
            async with httpx.AsyncClient(transport=transport, timeout=20.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                elapsed = time.perf_counter() - start_time

                if res.status_code == 200:
                    logger.info("model=%s status=%s latency=%.2fs", model_name, res.status_code, elapsed)
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if not candidates or "content" not in candidates[0]:
                        raise HTTPException(
                            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="No speech could be recognized in the audio"
                        )
                    transcript = candidates[0]["content"]["parts"][0]["text"].strip()
                    return transcript
                else:
                    logger.warning("model=%s status=%s latency=%.2fs", model_name, res.status_code, elapsed)
                    if attempt < len(models_to_try) - 1:
                        continue
        except HTTPException:
            raise
        except (httpx.TimeoutException, httpx.RequestError) as err:
            elapsed = time.perf_counter() - start_time
            logger.warning("model=%s status=timeout/network latency=%.2fs", model_name, elapsed)
            if attempt < len(models_to_try) - 1:
                continue
        except Exception:
            elapsed = time.perf_counter() - start_time
            logger.warning("model=%s status=error latency=%.2fs", model_name, elapsed)
            if attempt < len(models_to_try) - 1:
                continue

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Transcription service unavailable"
    )

