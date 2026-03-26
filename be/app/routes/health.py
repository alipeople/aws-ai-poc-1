from fastapi import APIRouter
from app.services.model_provider import ModelProvider

router = APIRouter(tags=["모델 & 헬스"])
_model_provider = ModelProvider()


@router.get(
    "/api/health",
    summary="서버 상태 확인",
    description="서버 동작 여부 및 사용 가능한 LLM 모델 목록을 반환합니다.",
)
async def health_check():
    return {
        "status": "ok",
        "available_models": _model_provider.list_models(),
    }
