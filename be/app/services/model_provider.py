"""
Model provider abstraction for Strands Agents SDK.
Handles Bedrock model instantiation and available model catalog.
"""
from dataclasses import dataclass
from typing import List
from app.config import settings


@dataclass
class ModelInfo:
    """Model metadata for FE display."""
    id: str
    name: str
    provider: str
    description: str


# Available Bedrock models catalog
AVAILABLE_MODELS: List[ModelInfo] = [
    ModelInfo(
        id="us.anthropic.claude-sonnet-4-20250514-v1:0",
        name="Claude Sonnet 4",
        provider="Anthropic",
        description="고성능 균형 모델 (추천)",
    ),
    ModelInfo(
        id="us.anthropic.claude-haiku-4-20250514-v1:0",
        name="Claude Haiku 4",
        provider="Anthropic",
        description="빠르고 경제적인 모델",
    ),
    ModelInfo(
        id="us.amazon.nova-pro-v1:0",
        name="Amazon Nova Pro",
        provider="Amazon",
        description="AWS 네이티브 고성능 모델",
    ),
    ModelInfo(
        id="us.amazon.nova-lite-v1:0",
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
        
        Args:
            model_id: Bedrock model ID (cross-region inference format)
        
        Returns:
            BedrockModel instance for use with Strands Agent
        """
        from strands.models.bedrock import BedrockModel
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
