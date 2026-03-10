import asyncio
import json
import logging
import re

from fastapi import APIRouter
from app.models.requests import UrlAnalysisRequest
from app.models.responses import UrlAnalysisResponse
from app.services.model_provider import ModelProvider

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
    """Analyze URL for product information using Strands Agent."""
    try:
        # Lazy import — top-level fails without AWS creds
        from strands import Agent

        model_provider = ModelProvider()
        model = model_provider.get_default_model()

        agent = Agent(
            model=model,
            system_prompt=(
                "당신은 웹 URL에서 상품 정보를 추출하는 전문가입니다. "
                "주어진 URL의 상품 정보를 분석하여 JSON 형식으로만 반환하세요."
            ),
        )

        prompt = (
            f"다음 URL의 상품 정보를 분석해주세요: {request.url}\n\n"
            "다음 JSON 형식으로 반환하세요:\n"
            "{\n"
            '    "productName": "상품명",\n'
            '    "price": "가격",\n'
            '    "discount": "할인율",\n'
            '    "category": "카테고리",\n'
            '    "features": ["특징1", "특징2"]\n'
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
