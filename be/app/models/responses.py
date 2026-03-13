from pydantic import BaseModel, Field
from typing import Optional, List, Union, Any


class MessageVariant(BaseModel):
    label: str  # 'A', 'B', 'C'
    title: str
    text: str
    predicted_open_rate: float = Field(alias="predictedOpenRate")
    predicted_click_rate: float = Field(alias="predictedClickRate")
    char_count: int = Field(alias="charCount")

    model_config = {"populate_by_name": True}


class SpamCheck(BaseModel):
    label: str
    passed: bool
    detail: Optional[str] = None


class SpamScore(BaseModel):
    score: int
    checks: List[SpamCheck]


class PersonalizationVar(BaseModel):
    template: str
    description: str


class FatigueAnalysis(BaseModel):
    high_fatigue_count: int = Field(alias="highFatigueCount")
    recommendation: str

    model_config = {"populate_by_name": True}


class MessageGenerateResponse(BaseModel):
    variants: List[MessageVariant]
    spam_score: SpamScore = Field(alias="spamScore")
    personalization_vars: List[PersonalizationVar] = Field(alias="personalizationVars")
    fatigue_analysis: FatigueAnalysis = Field(alias="fatigueAnalysis")

    model_config = {"populate_by_name": True}


class StreamEvent(BaseModel):
    type: str  # 'text' | 'thinking' | 'progress' | 'result' | 'error'
    data: Any
    agent_name: Optional[str] = Field(default=None, alias="agentName")

    model_config = {"populate_by_name": True}


class UrlAnalysisResponse(BaseModel):
    product_name: str = Field(alias="productName")
    price: Optional[str] = None
    discount: Optional[str] = None
    category: Optional[str] = None
    features: List[str] = []

    model_config = {"populate_by_name": True}


class HealthResponse(BaseModel):
    status: str
    available_models: List[str] = Field(alias="availableModels")

    model_config = {"populate_by_name": True}
