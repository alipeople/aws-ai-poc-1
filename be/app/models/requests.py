from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import StrEnum


class AgentMode(StrEnum):
    """에이전트 실행 모드."""

    SINGLE = "single"
    MULTI = "multi"


class Channel(StrEnum):
    """발송 채널."""

    SMS = "sms"
    LMS = "lms"
    MMS = "mms"
    ALIMTALK = "alimtalk"
    BRAND = "brand"
    RCS = "rcs"


class SourceType(StrEnum):
    """소재 입력 방식."""

    DIRECT = "direct"
    URL = "url"
    PAST = "past"


class ChatRole(StrEnum):
    """대화 메시지 역할."""

    USER = "user"
    ASSISTANT = "assistant"


class ModelId(StrEnum):
    """사용 가능한 Bedrock LLM 모델 ID (ap-northeast-2 리전)."""

    CLAUDE_OPUS_4_6 = "global.anthropic.claude-opus-4-6-v1"
    CLAUDE_SONNET_4 = "apac.anthropic.claude-sonnet-4-20250514-v1:0"
    CLAUDE_HAIKU_4_5 = "global.anthropic.claude-haiku-4-5-20251001-v1:0"
    NOVA_PRO = "apac.amazon.nova-pro-v1:0"
    NOVA_LITE = "apac.amazon.nova-lite-v1:0"


# ── 톤/목적 프리셋 (enum이 아닌 자유 텍스트 — 직접 입력 지원) ─────────

TONE_PRESETS = [
    "friendly", "formal", "humor", "emotional", "urgent",
    "kind", "caring", "professional", "witty", "warm", "concise",
]
"""톤앤매너 프리셋 ID 목록. 이 외에도 자유 텍스트 입력 가능."""

PURPOSE_PRESETS = [
    "promotion", "notice", "event", "reminder", "review", "greeting",
]
"""메시지 목적 프리셋 ID 목록. 이 외에도 자유 텍스트 입력 가능."""


class MessageGenerateRequest(BaseModel):
    """옵션형 메시지 생성 요청."""

    channel: Optional[Channel] = Field(
        default=None,
        description="발송 채널. null/빈값이면 AI가 소재 기반으로 자동 추천",
    )
    purpose: str = Field(
        default="",
        description=(
            "메시지 목적. 빈 문자열이면 AI가 자동 판단. "
            "프리셋: promotion(프로모션/할인), notice(안내/공지), event(이벤트 초대), "
            "reminder(리마인더), review(리뷰 요청), greeting(인사/감사). "
            "직접 입력도 가능 (예: '신제품 런칭')"
        ),
        examples=["promotion", "notice", "event", "신제품 런칭", ""],
    )
    tone: str = Field(
        description=(
            "톤앤매너. "
            "프리셋: friendly(친근체), formal(격식체), humor(캐주얼), emotional(감성체), "
            "urgent(긴급), kind(친절한), caring(세심한), professional(전문적), "
            "witty(위트있는), warm(따뜻한), concise(간결한). "
            "직접 입력도 가능 (예: 'MZ세대 말투')"
        ),
        examples=["friendly", "formal", "MZ세대 말투"],
    )
    tone_analysis: bool = Field(default=False, alias="toneAnalysis", description="과거 메시지 기반 톤 분석 활성화 여부")
    source: str = Field(description="소재/상품 정보 텍스트", examples=["봄맞이 특가! 전 상품 최대 50% 할인"])
    source_type: SourceType = Field(default=SourceType.DIRECT, alias="sourceType", description="소재 입력 방식")
    season: Optional[str] = Field(default=None, description="시즌/이벤트 키워드", examples=["봄맞이", "블랙프라이데이"])
    variant_count: int = Field(default=3, ge=1, le=4, alias="variantCount", description="생성할 메시지 변형 수 (1~4)")
    target: Optional[str] = Field(default=None, description="발송 대상")
    send_time: Optional[str] = Field(default=None, alias="sendTime", description="발송 시간")
    agent_mode: AgentMode = Field(default=AgentMode.SINGLE, alias="agentMode", description="에이전트 모드")
    spam_check_enabled: bool = Field(default=True, alias="spamCheckEnabled", description="KISA 스팸 분석 활성화 여부")
    model_id: ModelId = Field(alias="modelId", description="Bedrock LLM 모델 ID")

    model_config = {"populate_by_name": True}

    @field_validator("channel", mode="before")
    @classmethod
    def empty_channel_to_none(cls, v):
        """FE가 보내는 빈 문자열을 None으로 변환 (AI 자동 추천 트리거)."""
        if v == "":
            return None
        return v


class ChatMessage(BaseModel):
    """대화 히스토리 메시지."""

    role: ChatRole = Field(description="메시지 역할")
    content: str = Field(description="메시지 내용")


class ChatRequest(BaseModel):
    """대화형 AI 챗 요청."""

    message: str = Field(description="사용자 메시지", examples=["봄맞이 할인 이벤트 SMS 메시지 만들어줘"])
    conversation_history: List[ChatMessage] = Field(
        default_factory=list, alias="conversationHistory", description="이전 대화 히스토리 (문맥 유지용)"
    )
    agent_mode: AgentMode = Field(default=AgentMode.SINGLE, alias="agentMode", description="에이전트 모드")
    spam_check_enabled: bool = Field(default=True, alias="spamCheckEnabled", description="스팸 분석 활성화")
    model_id: ModelId = Field(alias="modelId", description="Bedrock LLM 모델 ID")

    model_config = {"populate_by_name": True}


class UrlAnalysisRequest(BaseModel):
    """URL 상품 분석 요청."""

    url: str = Field(description="분석할 상품 페이지 URL", examples=["https://brand.naver.com/eucerin/products/11355567271"])
