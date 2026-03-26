from fastapi import APIRouter
from app.services.model_provider import ModelProvider

router = APIRouter(tags=["모델 & 헬스"])
_model_provider = ModelProvider()


@router.get(
    "/api/models",
    summary="사용 가능한 LLM 모델 목록",
    description=(
        "프론트엔드 모델 선택 드롭다운에 표시할 모델 목록을 반환합니다.\n\n"
        "모델 ID는 메시지 생성/챗 요청의 `modelId` 필드에 사용됩니다."
    ),
)
async def list_models():
    return {"models": _model_provider.list_models()}
