from fastapi import APIRouter
from pydantic import BaseModel
from app.services.mock_data_service import MockDataService

router = APIRouter(prefix="/api/mock", tags=["mock"])
_mock_service = MockDataService()


class SpamScoreRequest(BaseModel):
    message: str


class FatigueRequest(BaseModel):
    target: str = "all"


@router.get("/past-messages")
async def get_past_messages():
    """Get mock past message history."""
    return _mock_service.get_past_messages()


@router.get("/past-successful")
async def get_past_successful():
    """Get mock successful past messages."""
    return _mock_service.get_past_successful_messages()


@router.get("/personalization-vars")
async def get_personalization_vars():
    """Get available personalization variable templates."""
    return _mock_service.get_personalization_vars()


@router.get("/season-recommendations")
async def get_season_recommendations():
    """Get current season keyword recommendations."""
    return _mock_service.get_season_recommendations()


@router.post("/spam-score")
async def get_spam_score(request: SpamScoreRequest):
    """Analyze spam score for a message."""
    return _mock_service.get_spam_score(request.message)


@router.post("/fatigue-analysis")
async def get_fatigue_analysis(request: FatigueRequest):
    """Get message fatigue analysis."""
    return _mock_service.get_fatigue_analysis(request.target)
