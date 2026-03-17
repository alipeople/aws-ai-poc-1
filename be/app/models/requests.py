from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class AgentMode(str, Enum):
    SINGLE = "single"
    MULTI = "multi"


class Channel(str, Enum):
    SMS = "SMS"
    LMS = "LMS"
    MMS = "MMS"
    ALIMTALK = "알림톡"
    BRAND = "브랜드"
    RCS = "RCS"


class MessageGenerateRequest(BaseModel):
    channel: str
    purpose: str = ""
    tone: str
    tone_analysis: bool = Field(default=False, alias="toneAnalysis")
    source: str
    source_type: str = Field(alias="sourceType")
    season: Optional[str] = None
    variant_count: int = Field(default=3, ge=1, le=4, alias="variantCount")
    target: Optional[str] = None
    send_time: Optional[str] = Field(default=None, alias="sendTime")
    agent_mode: AgentMode = Field(default=AgentMode.SINGLE, alias="agentMode")
    spam_check_enabled: bool = Field(default=True, alias="spamCheckEnabled")
    model_id: str = Field(alias="modelId")

    model_config = {"populate_by_name": True}


class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = Field(
        default_factory=list, alias="conversationHistory"
    )
    agent_mode: AgentMode = Field(default=AgentMode.SINGLE, alias="agentMode")
    spam_check_enabled: bool = Field(default=True, alias="spamCheckEnabled")
    model_id: str = Field(alias="modelId")

    model_config = {"populate_by_name": True}


class UrlAnalysisRequest(BaseModel):
    url: str
