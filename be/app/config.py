from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


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
    default_model_id: str = "apac.anthropic.claude-sonnet-4-20250514-v1:0"

    # Available models (display list for FE)
    # ap-northeast-2: apac.* 또는 global.* 프로필만 사용 가능
    available_model_ids: List[str] = [
        "global.anthropic.claude-opus-4-6-v1",
        "apac.anthropic.claude-sonnet-4-20250514-v1:0",
        "global.anthropic.claude-haiku-4-5-20251001-v1:0",
        "apac.amazon.nova-pro-v1:0",
        "apac.amazon.nova-lite-v1:0",
    ]


settings = Settings()
