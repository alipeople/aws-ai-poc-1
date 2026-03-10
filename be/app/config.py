from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # CORS
    cors_origins: List[str] = ["http://localhost:3000"]

    # AWS
    aws_region: str = "us-east-1"
    default_model_id: str = "us.anthropic.claude-sonnet-4-20250514-v1:0"

    # Available models (display list for FE)
    available_model_ids: List[str] = [
        "us.anthropic.claude-sonnet-4-20250514-v1:0",
        "us.anthropic.claude-haiku-4-20250514-v1:0",
        "us.amazon.nova-pro-v1:0",
        "us.amazon.nova-lite-v1:0",
    ]


settings = Settings()
