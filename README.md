# 센드온 AI 스튜디오 POC

HTML 프로토타입 기반의 AI 메시지 작성 POC. 옵션형(6단계 위자드)과 대화형(AI 챗) 두 가지 모드를 지원하며, AWS Bedrock LLM과 연동하여 실시간 스트리밍 응답을 제공합니다.

## 주요 기능

- **옵션형 (단계별)**: 채널 → 목적 → 톤앤매너 → 소재 → 시즌 → 발송 대상 6단계 설정 후 A/B/C 3종 메시지 자동 생성
- **대화형 (AI 챗)**: 자연어 대화로 메시지 작성 (SSE 실시간 스트리밍)
- **싱글/멀티 에이전트**: 단일 에이전트 vs 생성기→리뷰어 순차 워크플로우 비교
- **LLM 모델 전환**: Claude Sonnet 4, Claude Haiku, Amazon Nova Pro/Lite 선택
- **5개 디자인 테마**: Sendon(기본), Toss Bank, Retro 8-bit, Dark, Pastel

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Backend | Python + FastAPI + AWS Strands Agents SDK |
| 스트리밍 | SSE (fetch + ReadableStream) |
| 테마 시스템 | CSS Variables + `data-theme` 속성 |
| Lambda 배포 | Mangum (Lambda adapter) |
| 패키지 매니저 | pnpm |

## 프로젝트 구조

```
.
├── fe/                          # Frontend (Next.js)
│   ├── src/
│   │   ├── app/                 # App Router 페이지
│   │   │   └── ai-studio/       # AI 스튜디오 라우트
│   │   ├── components/          # React 컴포넌트
│   │   │   ├── ai-message/      # AI 메시지 (option, chat)
│   │   │   ├── layout/          # Sidebar, AppShell, FloatingSettings
│   │   │   ├── ui/              # 공통 UI (Chip, Card, Toggle, Badge)
│   │   │   └── common/          # PlaceholderPage 등
│   │   ├── context/             # SettingsContext (에이전트/모델/테마)
│   │   ├── hooks/               # useSSE, useSettings
│   │   ├── services/            # API 서비스 레이어
│   │   ├── styles/themes/       # 5개 테마 CSS 파일
│   │   └── types/               # TypeScript 인터페이스
│   └── package.json
├── be/                          # Backend (FastAPI)
│   ├── app/
│   │   ├── routes/              # health, models, messages, analysis, mock_data
│   │   ├── services/            # agent_service, multi_agent_service, mock_data_service
│   │   ├── prompts/             # LLM 프롬프트 (generator, reviewer)
│   │   ├── models/              # Pydantic 모델 (requests, responses)
│   │   ├── config.py            # 앱 설정 (CORS, AWS, 모델)
│   │   └── main.py              # FastAPI 앱 진입점
│   ├── lambda_handler.py        # AWS Lambda 핸들러 (Mangum)
│   └── requirements.txt
├── docs/                        # 요구사항, 아키텍처 문서
├── package.json                 # 루트 (FE+BE 동시 기동 스크립트)
└── .env.example                 # 환경변수 템플릿
```

## 시작하기

### 사전 요구사항

- **Node.js** 20+
- **pnpm** 10+
- **Python** 3.11+

### 1. 설치

```bash
# Frontend 의존성 설치
pnpm install           # 루트 (concurrently)
pnpm run install:fe    # fe/ 의존성

# Backend 가상환경 및 의존성 설치
cd be
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 환경변수 설정

```bash
# BE 환경변수 (AWS 크레덴셜 — LLM 실제 호출 시 필요)
cp .env.example be/.env
# be/.env 파일을 열고 AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY 입력

# FE 환경변수 (이미 설정됨)
# fe/.env.local → NEXT_PUBLIC_API_URL=http://localhost:8000
```

> AWS 크레덴셜 없이도 서버 기동은 됩니다. LLM 호출 시 에러 이벤트가 SSE로 전달되고, mock 데이터 엔드포인트는 정상 동작합니다.

### 3. 개발 서버 실행

```bash
# FE(3000) + BE(8000) 동시 기동 (hot-reload 자동 적용)
pnpm run dev
```

또는 개별 실행:

```bash
# Frontend만 (Next.js Fast Refresh — 코드 변경 시 즉시 반영)
pnpm run dev:fe

# Backend만 (uvicorn --reload — 코드 변경 시 자동 재시작)
pnpm run dev:be
```

### 4. 접속

- **Frontend**: http://localhost:3000 (포트 사용 중이면 3001로 자동 변경)
- **Backend API**: http://localhost:8000
- **API Health**: http://localhost:8000/api/health

## 주요 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/health` | 서버 상태 + 사용 가능 모델 목록 |
| GET | `/api/models` | LLM 모델 카탈로그 |
| POST | `/api/messages/generate` | 옵션형 메시지 생성 (SSE 스트리밍) |
| POST | `/api/messages/chat` | 대화형 채팅 (SSE 스트리밍) |
| POST | `/api/analyze-url` | URL 분석 (LLM 기반) |
| GET | `/api/mock/past-messages` | 과거 발송 이력 (mock) |
| POST | `/api/mock/spam-score` | 스팸 점수 분석 (mock) |
| POST | `/api/mock/fatigue-analysis` | 수신자 피로도 분석 (mock) |

## 개발용 설정 패널

우측 하단 ⚙️ 버튼으로 열리는 플로팅 패널에서:

- **에이전트 모드**: Single(직접 호출) / Multi(생성기→리뷰어) 전환
- **LLM 모델**: Bedrock 모델 선택 (Claude Sonnet, Haiku, Nova 등)
- **테마**: 5개 디자인 테마 실시간 전환

## Hot Reload

FE, BE 모두 코드 변경 시 자동 반영됩니다:

- **FE**: Next.js [Fast Refresh](https://nextjs.org/docs/architecture/fast-refresh) — 컴포넌트 수정 시 상태 유지하며 즉시 반영
- **BE**: uvicorn `--reload` 모드 — Python 파일 변경 시 서버 자동 재시작
