from fastapi import APIRouter
from app.services.model_provider import ModelProvider

router = APIRouter()
_model_provider = ModelProvider()


@router.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "available_models": _model_provider.list_models(),
    }
