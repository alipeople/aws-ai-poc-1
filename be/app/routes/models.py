from fastapi import APIRouter
from app.services.model_provider import ModelProvider

router = APIRouter()
_model_provider = ModelProvider()


@router.get("/api/models")
async def list_models():
    return {"models": _model_provider.list_models()}
