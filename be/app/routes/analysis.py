import asyncio
import json
import logging
import re

from fastapi import APIRouter
from app.models.requests import UrlAnalysisRequest
from app.models.responses import UrlAnalysisResponse
from app.services.model_provider import ModelProvider
from app.services.web_page_fetcher import WebPageFetcher

logger = logging.getLogger(__name__)

router = APIRouter()

MOCK_RESPONSE = UrlAnalysisResponse(
    productName="봄맞이 특가 상품",
    price="29,900원",
    discount="30%",
    category="패션/의류",
    features=["고품질 소재", "봄 시즌 한정", "무료 배송"],
)


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
      1. Fetch web page content via httpx and extract text
      2. Send extracted text to LLM for structured JSON extraction

    Falls back to URL-only prompt if fetch fails, and to mock data
    if LLM call also fails.
    """
    try:
        # Stage 1: Fetch and extract web page content
        page_content: str | None = None
        try:
            fetcher = WebPageFetcher()
            page_content = await fetcher.fetch(request.url)
            logger.info("Fetched %d chars from %s", len(page_content), request.url)
        except Exception as fetch_err:
            logger.warning(
                "Failed to fetch URL %s, falling back to URL-only prompt: %s",
                request.url,
                fetch_err,
            )

        # Stage 2: LLM analysis
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
                "추측하지 말고, 제공된 데이터에 있는 정보만 사용하세요. "
                "JSON 형식으로만 응답하세요."
            ),
        )

        if page_content:
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
        else:
            prompt = (
                f"다음 URL의 상품 정보를 분석해주세요: {request.url}\n\n"
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

        return UrlAnalysisResponse(
            productName=parsed.get("productName", "분석된 상품"),
            price=parsed.get("price"),
            discount=parsed.get("discount"),
            category=parsed.get("category"),
            features=parsed.get("features", []),
        )

    except Exception as e:
        logger.warning("URL analysis failed, returning mock data: %s", e)
        return MOCK_RESPONSE
