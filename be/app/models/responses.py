from pydantic import BaseModel, Field
from typing import Optional, List, Union, Any


class MessageVariant(BaseModel):
    """생성된 메시지 변형 (A/B/C)."""

    label: str = Field(description="변형 라벨", examples=["A", "B", "C"])
    title: str = Field(description="변형 스타일명", examples=["간결형", "감성형", "긴급형"])
    text: str = Field(description="메시지 본문")
    predicted_open_rate: float = Field(alias="predictedOpenRate", description="예상 오픈율 (%)", examples=[45.2])
    predicted_click_rate: float = Field(alias="predictedClickRate", description="예상 클릭률 (%)", examples=[12.8])
    char_count: int = Field(alias="charCount", description="메시지 글자수", examples=[87])

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
    """URL 분석 결과 — 구조화된 상품 정보."""

    product_name: str = Field(alias="productName", description="상품명", examples=["유세린 하이알루론 수분크림"])
    price: Optional[str] = Field(default=None, description="가격", examples=["32,000원"])
    discount: Optional[str] = Field(default=None, description="할인율", examples=["20%"])
    category: Optional[str] = Field(default=None, description="카테고리", examples=["스킨케어 > 크림"])
    features: List[str] = Field(default=[], description="주요 특징", examples=[["히알루론산 함유", "48시간 보습"]])

    model_config = {"populate_by_name": True}


class HealthResponse(BaseModel):
    status: str
    available_models: List[str] = Field(alias="availableModels")

    model_config = {"populate_by_name": True}
