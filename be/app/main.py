from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import health, models, messages, analysis, mock_data

app = FastAPI(
    title="센드온 AI 스튜디오 API",
    description="AI 메시지 생성 백엔드",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # NEVER use ["*"] with credentials
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route registrations
app.include_router(health.router)
app.include_router(models.router)
app.include_router(messages.router)
app.include_router(analysis.router)
app.include_router(mock_data.router)
