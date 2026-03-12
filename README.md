# 센드온 AI 스튜디오 POC

HTML 프로토타입 기반의 AI 메시지 작성 POC. 옵션형(6단계 위자드)과 대화형(AI 챗) 두 가지 모드를 지원하며, AWS Bedrock LLM과 연동하여 실시간 스트리밍 응답을 제공합니다.

## 주요 기능

- **옵션형 (단계별)**: 채널 → 목적 → 톤앤매너 → 소재 → 시즌 → 발송 대상 6단계 설정 후 A/B/C 3종 메시지 자동 생성
- **대화형 (AI 챗)**: 자연어 대화로 메시지 작성 (SSE 실시간 스트리밍)
- **싱글/멀티 에이전트**: 단일 에이전트 vs 생성기→리뷰어 순차 워크플로우 비교
- **LLM 모델 전환**: Claude Sonnet 4, Claude Haiku, Amazon Nova Pro/Lite 선택
- **5개 디자인 테마**: Sendon(기본), Toss Bank, Retro 8-bit, Dark, Pastel

## 아키텍처

### 전체 시스템 구성

```
┌─────────────────────────────────────────────────────────────────────┐
│                        사용자 (브라우저)                             │
│                                                                     │
│   옵션형 위자드 (6단계)          대화형 AI 챗          URL 분석      │
│   채널→목적→톤→소재→시즌→대상   자연어 대화           상품 URL 입력  │
└───────────────┬─────────────────────┬──────────────────┬────────────┘
                │ SSE Stream          │ SSE Stream       │ REST
                ▼                     ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                            │
│                                                                     │
│   App Router ─── useSSE Hook ─── fetch + ReadableStream             │
│       │              │                    │                         │
│   SettingsContext    │              API Service Layer                │
│   (에이전트모드,     │              (api.ts)                        │
│    모델, 테마)       │                    │                         │
│                      │                    │                         │
│   5개 테마 (CSS Variables + data-theme)   │                         │
└──────────────────────┼────────────────────┼─────────────────────────┘
                       │                    │
                       │   HTTP (localhost:50001)                     
                       ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                                │
│                                                                     │
│   routes/                                                           │
│   ├── messages.py ──── SSE EventSourceResponse                      │
│   ├── analysis.py ──── URL 분석 (WebPageFetcher + LLM)              │
│   ├── health.py        models.py        mock_data.py                │
│   │                                                                 │
│   services/                                                         │
│   ├── SingleAgentService ─── 싱글 에이전트 모드                     │
│   ├── MultiAgentService ──── 멀티 에이전트 모드                     │
│   ├── WebPageFetcher ──────── httpx + HTML 파싱                     │
│   └── ModelProvider ───────── Bedrock 모델 관리                     │
│                                                                     │
│   prompts/                                                          │
│   ├── message_generator.py ── 메시지 생성 프롬프트                  │
│   └── message_reviewer.py ─── 메시지 검토 프롬프트                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │  AWS Strands Agents SDK
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AWS Bedrock                                      │
│                                                                     │
│   Claude Sonnet 4  │  Claude Haiku 4  │  Nova Pro  │  Nova Lite     │
│   (추천, 고성능)   │  (빠르고 경제적) │  (AWS 네이티브)             │
└─────────────────────────────────────────────────────────────────────┘
```

### 에이전트 동작 모드

사용자는 설정 패널에서 **싱글/멀티 에이전트 모드**를 전환할 수 있습니다.
두 모드 모두 옵션형(위자드)과 대화형(챗) 방식에서 동일하게 적용됩니다.

#### 싱글 에이전트 모드 (Single Agent)

하나의 에이전트가 메시지 생성을 직접 수행합니다.

```
                    사용자 입력
                        │
                        │  채널, 목적, 톤앤매너, 소재, 시즌, 대상
                        ▼
    ┌───────────────────────────────────────┐
    │        Generator Agent                │
    │        (메시지 생성 에이전트)           │
    │                                       │
    │  시스템 프롬프트:                      │
    │  ├─ 한국어 마케팅 메시지 작성 전문가   │
    │  ├─ 채널별 글자 수 제한 준수            │
    │  ├─ 스팸 필터 회피 표현                 │
    │  └─ JSON 형식 응답                     │
    │                                       │
    │  Bedrock LLM (Claude/Nova)             │
    └───────────────────┬───────────────────┘
                        │
                        │  SSE 스트리밍 (실시간 텍스트 전송)
                        ▼
              ┌─────────────────┐
              │  A/B/C 3종      │
              │  마케팅 메시지   │
              │  (JSON 결과)    │
              └─────────────────┘
```

#### 멀티 에이전트 모드 (Multi Agent — Sequential Pipeline)

두 에이전트가 순차적으로 협력하여 품질을 높입니다.
컨셉 다이어그램의 Graph 패턴을 **Generator → Reviewer** 파이프라인으로 구현합니다.

```
                    사용자 입력
                        │
                        │  "우리 행사를 알리는 메시지 써줘"
                        │  { channel, purpose, tone, source, season, target }
                        ▼
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│             멀티 에이전트 파이프라인 (Sequential)                    │
│                                                                     │
│   ┌───────────────────────────────────────┐                         │
│   │  Phase 1: Generator Agent             │                         │
│   │  (초안 작성 에이전트)                  │                         │
│   │                                       │                         │
│   │  역할:                                │                         │
│   │  ├─ 마케팅 메시지 초안 생성            │                         │
│   │  ├─ A/B/C 3종 변형 작성               │                         │
│   │  ├─ 채널 규격에 맞는 글자 수 준수      │                         │
│   │  └─ CTA(행동유도) 포함                │                         │
│   │                                       │   SSE: agentName=       │
│   │  프롬프트: build_option_prompt()       │   "generator"           │
│   │  모델: Bedrock (Claude/Nova)           │                         │
│   └───────────────────┬───────────────────┘                         │
│                       │                                             │
│                       │  생성된 메시지 텍스트 (중간 결과)            │
│                       ▼                                             │
│   ┌───────────────────────────────────────┐                         │
│   │  Phase 2: Reviewer Agent              │                         │
│   │  (품질 검토 에이전트)                  │                         │
│   │                                       │                         │
│   │  역할:                                │                         │
│   │  ├─ 문법 및 맞춤법 검토               │                         │
│   │  ├─ 마케팅 효과성 평가                │                         │
│   │  ├─ 스팸 위험 요소 탐지               │                         │
│   │  └─ 개선된 최종 버전 작성             │                         │
│   │                                       │   SSE: agentName=       │
│   │  프롬프트: build_review_prompt()       │   "reviewer"            │
│   │  모델: Bedrock (Claude/Nova)           │                         │
│   └───────────────────┬───────────────────┘                         │
│                       │                                             │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
                        │
                        │  SSE 스트리밍 (실시간 텍스트 전송)
                        ▼
              ┌─────────────────┐
              │  검토 완료된    │
              │  A/B/C 3종      │
              │  마케팅 메시지   │
              │  (JSON 결과)    │
              └─────────────────┘
```

#### URL 분석 파이프라인

상품 URL을 입력하면 웹 페이지에서 상품 정보를 자동 추출합니다.

```
            상품 URL 입력
            (예: https://www.yes24.com/Product/...)
                    │
                    ▼
    ┌───────────────────────────────────┐
    │  Stage 1: WebPageFetcher          │
    │  (웹 페이지 수집)                 │
    │                                   │
    │  httpx (비동기 HTTP 클라이언트)    │
    │  ├─ 브라우저 헤더로 요청           │
    │  ├─ 리다이렉트 자동 추적           │
    │  └─ 15초 타임아웃                  │
    │                                   │
    │  HTML Parser (Python stdlib)       │
    │  ├─ <title> 추출                  │
    │  ├─ OG 태그 (og:title, og:price)  │
    │  ├─ JSON-LD 구조화 데이터          │
    │  ├─ <meta> description, keywords   │
    │  └─ 본문 텍스트 (8000자 제한)      │
    └──────────────────┬────────────────┘
                       │
                       │  추출된 텍스트 데이터
                       │  (페이지 수집 실패 시 URL 문자열로 폴백)
                       ▼
    ┌───────────────────────────────────┐
    │  Stage 2: Analysis Agent          │
    │  (상품 정보 구조화 에이전트)       │
    │                                   │
    │  시스템 프롬프트:                  │
    │  ├─ 텍스트 기반 상품 정보 추출     │
    │  ├─ 추측 금지, 데이터 기반만       │
    │  └─ JSON 형식 응답                 │
    │                                   │
    │  Bedrock LLM (Claude/Nova)         │
    └──────────────────┬────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  구조화된       │
              │  상품 정보      │
              │                 │
              │  ├─ 상품명     │
              │  ├─ 가격       │
              │  ├─ 할인율     │
              │  ├─ 카테고리   │
              │  └─ 특징       │
              └─────────────────┘
```

### SSE 스트리밍 프로토콜

모든 AI 응답은 **Server-Sent Events (SSE)**로 실시간 스트리밍됩니다.

```
Frontend (useSSE Hook)                Backend (FastAPI)
       │                                    │
       │── POST /api/messages/generate ────▶│
       │   { channel, purpose, tone, ... }  │
       │                                    │
       │◀── event: {type:"progress"} ────────│  "메시지를 생성하고 있습니다..."
       │◀── event: {type:"text"} ────────────│  실시간 텍스트 청크 (반복)
       │◀── event: {type:"text"} ────────────│  ...
       │                                    │
       │    [멀티 에이전트 모드일 때]         │
       │◀── event: {type:"progress"} ────────│  "메시지를 검토하고 있습니다..."
       │◀── event: {type:"text"} ────────────│  리뷰어 텍스트 청크 (반복)
       │                                    │
       │◀── event: {type:"result"} ──────────│  최종 JSON 결과
       │                                    │
```

| 이벤트 타입 | 설명 | agentName |
|------------|------|-----------|
| `progress` | 진행 상태 알림 | `generator` / `reviewer` |
| `text` | 실시간 텍스트 청크 | `generator` / `reviewer` / `assistant` |
| `result` | 최종 구조화된 JSON 결과 | `generator` / `reviewer` |
| `error` | 에러 발생 알림 | `generator` / `reviewer` / `assistant` |

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
# FE(50000) + BE(50001) 동시 기동 (hot-reload 자동 적용)
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

- **Frontend**: http://localhost:50000
- **Backend API**: http://localhost:50001
- **API Health**: http://localhost:50001/api/health

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
