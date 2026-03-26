from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

from app.models.requests import ModelId


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # CORS
    cors_origins: List[str] = ["http://localhost:50000"]

    # AWS
    aws_region: str = "ap-northeast-2"
    aws_profile: str = ""
    default_model_id: ModelId = ModelId.CLAUDE_SONNET_4

    # Available models (display list for FE)
    # ap-northeast-2: apac.* 또는 global.* 프로필만 사용 가능
    available_model_ids: List[ModelId] = list(ModelId)


settings = Settings()
