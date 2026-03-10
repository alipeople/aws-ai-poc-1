from fastapi import APIRouter
from app.models.requests import UrlAnalysisRequest
from app.models.responses import UrlAnalysisResponse

router = APIRouter()


@router.post("/api/analyze-url", response_model=UrlAnalysisResponse)
async def analyze_url(request: UrlAnalysisRequest):
    """Analyze URL for product information. Implemented in Task 21."""
    # Placeholder response
    return UrlAnalysisResponse(
        productName="상품 분석 기능 준비 중",
        features=["Task 21에서 실제 LLM 분석 구현 예정"],
    )
