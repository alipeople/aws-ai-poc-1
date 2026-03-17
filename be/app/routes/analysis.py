import asyncio
import json
import logging
import re

from fastapi import APIRouter, HTTPException
from app.models.requests import UrlAnalysisRequest
from app.models.responses import UrlAnalysisResponse
from app.services.model_provider import ModelProvider
from app.services.web_page_fetcher import WebPageFetcher, BotBlockedError, RateLimitError, FetchError

logger = logging.getLogger(__name__)

router = APIRouter()


def _extract_json(text: str) -> dict:
    """Extract first JSON object from LLM response text."""
    # Try markdown code fence first
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    # Try raw JSON object
    match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
    if match:
        return json.loads(match.group(0))
    raise ValueError("No JSON object found in response")


@router.post("/api/analyze-url", response_model=UrlAnalysisResponse)
async def analyze_url(request: UrlAnalysisRequest):
    """Analyze URL for product information using Strands Agent.

    Two-stage pipeline:
      1. Fetch web page content via WebPageFetcher (httpx → curl_cffi fallback)
      2. Send extracted text to LLM for structured JSON extraction

    Returns clear errors when fetch or LLM analysis fails.
    """
    # Stage 1: Fetch and extract web page content
    try:
        fetcher = WebPageFetcher()
        page_content = await fetcher.fetch(request.url)
        logger.info("Fetched %d chars from %s", len(page_content), request.url)
    except RateLimitError as e:
        logger.warning("Rate limited: %s", e)
        raise HTTPException(status_code=429, detail=str(e))
    except BotBlockedError as e:
        logger.warning("Bot blocked: %s", e)
        raise HTTPException(status_code=422, detail=str(e))
    except FetchError as e:
        logger.warning("Fetch failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"페이지를 가져올 수 없습니다: {e}",
        )
    except Exception as e:
        logger.warning("Unexpected fetch error for %s: %s", request.url, e)
        raise HTTPException(
            status_code=502,
            detail=f"페이지를 가져올 수 없습니다: {e}",
        )

    # Stage 2: LLM analysis
    try:
        from strands import Agent  # Lazy import — top-level fails without AWS creds

        model_provider = ModelProvider()
        model = model_provider.get_default_model()

        agent = Agent(
            model=model,
            system_prompt=(
                "당신은 웹 페이지에서 추출된 텍스트 데이터를 분석하여 "
                "상품 정보를 구조화하는 전문가입니다. "
                "제공된 텍스트에서 상품명, 가격, 할인율, 카테고리, "
                "주요 특징을 정확히 추출하세요. "
                "쇼핑몰 페이지인 경우 productName과 price는 반드시 추출하세요. "
                "페이지에서 확인 가능한 정확한 값을 사용하세요. "
                "추측하지 말고, 제공된 데이터에 있는 정보만 사용하세요. "
                "JSON 형식으로만 응답하세요."
            ),
        )

        prompt = (
            "다음은 웹 페이지에서 추출한 상품 정보입니다. "
            "이 정보를 분석하여 상품 정보를 구조화된 JSON으로 반환하세요.\n\n"
            f"{page_content}\n\n"
            "다음 JSON 형식으로 반환하세요:\n"
            "{\n"
            '    "productName": "상품명",\n'
            '    "price": "가격",\n'
            '    "discount": "할인율 (없으면 null)",\n'
            '    "category": "카테고리",\n'
            '    "features": ["특징1", "특징2", "특징3"]\n'
            "}"
        )

        result = await asyncio.to_thread(agent, prompt)
        response_text = str(result)
        parsed = _extract_json(response_text)

        product_name = parsed.get("productName", "")
        # Fallback: if productName is empty, try to extract from extracted text format
        if not product_name and page_content:
            title_match = re.search(r'제목:\s*(.+)', page_content)
            if title_match:
                product_name = title_match.group(1).strip()
        product_name = product_name or "분석된 상품"

        price = parsed.get("price")
        # Fallback: if price is missing, try og:price:amount from extracted text
        if not price and page_content:
            og_price_match = re.search(
                r'og:price:amount:\s*(.+)', page_content,
            )
            if og_price_match:
                price = og_price_match.group(1).strip()

        return UrlAnalysisResponse(
            productName=product_name,
            price=price,
            discount=parsed.get("discount"),
            category=parsed.get("category"),
            features=parsed.get("features", []),
        )

    except Exception as e:
        logger.exception("LLM analysis failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"AI 분석에 실패했습니다: {e}",
        )
