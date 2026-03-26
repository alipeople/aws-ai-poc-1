import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import health, models, messages, analysis, mock_data

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s %(name)s: %(message)s",
)

app = FastAPI(
    title="센드온 AI 스튜디오 API",
    description=(
        "AWS Bedrock LLM 기반 AI 마케팅 메시지 생성 백엔드.\n\n"
        "## 주요 기능\n"
        "- **메시지 생성**: 옵션형(5단계 위자드) / 대화형(AI 챗) — SSE 실시간 스트리밍\n"
        "- **URL 분석**: 상품 페이지 URL → 구조화된 상품 정보 추출\n"
        "- **스팸 분석**: KISA 기준 스팸 분류 · 광고표기 준수 검사\n"
        "- **에이전트 모드**: Single(단일) / Multi(생성→리뷰→스팸체크 Graph)\n\n"
        "## SSE 스트리밍 이벤트 형식\n"
        "메시지 생성/챗 API는 `text/event-stream`으로 응답하며, 각 이벤트는 다음 JSON 구조입니다:\n"
        "```json\n"
        '{"type": "progress|text|result|error", "data": "...", "agentName": "generator|reviewer|spam_checker"}\n'
        "```\n"
        "- `progress`: 진행 상태 메시지 (로딩 UI용)\n"
        "- `text`: LLM 스트리밍 텍스트 청크\n"
        "- `result`: 최종 JSON 결과 (파싱하여 사용)\n"
        "- `error`: 오류 메시지\n"
    ),
    version="0.1.0",
    openapi_tags=[
        {
            "name": "메시지 생성",
            "description": "AI 마케팅 메시지 생성 및 대화형 챗. SSE 스트리밍으로 실시간 응답.",
        },
        {
            "name": "URL 분석",
            "description": "상품 페이지 URL을 분석하여 상품명·가격·할인율·카테고리·특징을 추출.",
        },
        {
            "name": "모델 & 헬스",
            "description": "사용 가능한 LLM 모델 목록 조회 및 서버 상태 확인.",
        },
        {
            "name": "Mock 데이터",
            "description": "개발용 목업 API. 과거 메시지, 개인화 변수, 시즌 추천, 스팸 스코어 등.",
        },
    ],
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
