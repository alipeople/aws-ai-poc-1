"""
Model provider abstraction for Strands Agents SDK.
Handles Bedrock model instantiation and available model catalog.
"""
from dataclasses import dataclass
from typing import List
from app.config import settings
from app.models.requests import ModelId


@dataclass
class ModelInfo:
    """Model metadata for FE display."""
    id: ModelId
    name: str
    provider: str
    description: str


# Available Bedrock models catalog
# NOTE: ap-northeast-2 리전에서는 us.* 프로필 사용 불가.
#       apac.* (APAC 리전) 또는 global.* (전 세계) 프로필을 사용해야 합니다.
AVAILABLE_MODELS: List[ModelInfo] = [
    ModelInfo(
        id=ModelId.CLAUDE_OPUS_4_6,
        name="Claude Opus 4.6",
        provider="Anthropic",
        description="최고 성능 플래그십 모델",
    ),
    ModelInfo(
        id=ModelId.CLAUDE_SONNET_4,
        name="Claude Sonnet 4",
        provider="Anthropic",
        description="고성능 균형 모델 (추천)",
    ),
    ModelInfo(
        id=ModelId.CLAUDE_HAIKU_4_5,
        name="Claude Haiku 4.5",
        provider="Anthropic",
        description="빠르고 경제적인 모델",
    ),
    ModelInfo(
        id=ModelId.NOVA_PRO,
        name="Amazon Nova Pro",
        provider="Amazon",
        description="AWS 네이티브 고성능 모델",
    ),
    ModelInfo(
        id=ModelId.NOVA_LITE,
        name="Amazon Nova Lite",
        provider="Amazon",
        description="AWS 네이티브 경량 모델",
    ),
]


class ModelProvider:
    """
    Abstraction layer for Bedrock model instantiation via Strands.
    
    Follows SRP: only responsible for model catalog and Bedrock model creation.
    """

    def list_models(self) -> List[dict]:
        """Return available models as JSON-serializable dicts."""
        return [
            {
                "id": m.id,
                "name": m.name,
                "provider": m.provider,
                "description": m.description,
            }
            for m in AVAILABLE_MODELS
        ]

    def get_model(self, model_id: str):
        """
        Create and return a Strands BedrockModel instance.
        
        Uses boto3.Session with AWS_PROFILE when configured,
        otherwise falls back to region_name (default credential chain).
        
        Args:
            model_id: Bedrock model ID (cross-region inference format)
        
        Returns:
            BedrockModel instance for use with Strands Agent
        """
        import boto3
        from strands.models.bedrock import BedrockModel

        if settings.aws_profile:
            session = boto3.Session(
                profile_name=settings.aws_profile,
                region_name=settings.aws_region,
            )
            return BedrockModel(
                model_id=model_id,
                boto_session=session,
            )

        return BedrockModel(
            model_id=model_id,
            region_name=settings.aws_region,
        )

    def get_default_model(self):
        """Return model instance for the configured default model."""
        return self.get_model(settings.default_model_id)

    def is_valid_model_id(self, model_id: str) -> bool:
        """Validate that a model ID is in the supported catalog."""
        valid_ids = [m.id for m in AVAILABLE_MODELS]
        return model_id in valid_ids
