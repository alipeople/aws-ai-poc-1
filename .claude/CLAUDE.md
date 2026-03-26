# 센드온 AI 스튜디오 POC — 프로젝트 지침

## 프로젝트 개요

AWS Bedrock LLM 기반 AI 마케팅 메시지 발송 POC.
**WHAT(메시지 작성) → WHO(발송 대상) → WHEN(발송 시간)** 3단계 흐름.

- **FE**: Next.js 16, React 19, TypeScript — port 50000
- **BE**: FastAPI (Python 3.12), Strands Agents SDK — port 50001
- **AI**: AWS Bedrock (ap-northeast-2 리전), StrEnum 기반 모델 ID 관리
- **API 문서**: http://localhost:50001/docs (Swagger UI)

## 실행 방법

```bash
pnpm dev          # 로컬 개발 (FE:50000 + BE:50001)
pnpm demo         # 데모 (FE + BE + Cloudflare Tunnel)
```

## 디렉터리 구조

```
be/                         # FastAPI 백엔드
  app/
    config.py               # 환경 설정 (ModelId enum 참조)
    models/
      requests.py           # 요청 모델 + 모든 StrEnum 정의 (단일 소스)
      responses.py          # 응답 모델
    prompts/                # LLM 프롬프트 템플릿
    routes/                 # API 라우트 (messages, analysis, models, health, mock)
    services/               # 비즈니스 로직 (agent, multi_agent, model_provider, web_page_fetcher)
fe/                         # Next.js 프론트엔드
  src/
    app/ai-studio/          # 페이지 (message/option, message/chat)
    components/ai-message/  # 옵션형/대화형 UI 컴포넌트
    services/api.ts         # API 클라이언트 (SSE + REST)
    types/api.ts            # TypeScript 타입 정의
    context/                # 전역 설정 (에이전트 모드, 모델, 테마)
    hooks/                  # useSSE 등 커스텀 훅
```

---

## 핵심 규칙

### 1. 단일 소스 원칙 (Single Source of Truth)

- **Enum/상수**: `be/app/models/requests.py`에서 정의. config, service, route에서 import하여 사용.
  - `ModelId`, `Channel`, `SourceType`, `AgentMode`, `ChatRole` — 모두 `StrEnum`
  - 새 모델/채널 추가 시 `requests.py` enum 수정 → `model_provider.py`에 표시 정보 추가
- **타입**: FE 타입(`fe/src/types/api.ts`)과 BE 모델(`be/app/models/`)은 반드시 동기화.
- **환경변수**: `.env`(개발), `.env.demo`(데모), `.env.example`(템플릿). 실제 키는 `.env`에만.

### 2. BE 변경 시 FE 영향 검증 (필수)

BE API 변경 시 반드시 다음을 확인:

1. **Pydantic 모델 변경** → `fe/src/types/api.ts` 타입 동기화 필요 여부 확인
2. **필드 타입 변경** (str → enum 등) → FE가 보내는 실제 값이 새 타입에 호환되는지 검증
3. **필드 추가/제거** → `fe/src/services/api.ts`의 `buildGenerateBody`, `buildChatBody` 업데이트
4. **OpenAPI 스키마 검증**: `python -c "from app.main import app"` 실행하여 import 오류 없는지 확인
5. **요청 시뮬레이션**: FE가 실제 보내는 JSON 구조로 Pydantic `model_validate()` 테스트

```python
# BE 변경 후 필수 검증 스크립트
from app.models.requests import MessageGenerateRequest
req = MessageGenerateRequest.model_validate({
    "channel": "sms", "tone": "friendly", "source": "테스트",
    "source_type": "direct", "agent_mode": "single",
    "spam_check_enabled": True,
    "model_id": "apac.anthropic.claude-sonnet-4-20250514-v1:0",
})
print("OK:", req.channel, req.model_id)
```

### 3. API 설계 원칙

- **Swagger 문서 우선**: 모든 엔드포인트에 `summary`, `description`, `tags` 필수. FE 개발자가 Swagger만 보고 연동 가능해야 함.
- **문자열 상수는 StrEnum**: FE가 유효한 값을 알아야 하는 고정 상수 필드는 반드시 `StrEnum`으로 정의. Swagger 드롭다운 제공.
- **자유 텍스트 + 프리셋**: 프리셋과 커스텀 입력을 모두 지원하는 필드(tone, purpose)는 `str`로 유지하되, description에 프리셋 목록 명시.
- **SSE 이벤트 규약**: `{type, data, agentName}` 구조 유지. type은 `progress | text | result | error`.
- **에러 응답**: FastAPI HTTPException으로 적절한 상태 코드(422, 429, 502) + 한국어 detail 메시지.
- **Alias 규칙**: BE 필드는 snake_case, FE alias는 camelCase. `model_config = {"populate_by_name": True}`로 양쪽 수용.

### 4. SOLID 원칙 적용

- **S (단일 책임)**: 각 서비스는 하나의 역할만 담당.
  - `ModelProvider` — 모델 카탈로그 + Bedrock 인스턴스 생성
  - `SingleAgentService` — 단일 에이전트 스트리밍
  - `MultiAgentService` — Graph 기반 멀티 에이전트
  - `WebPageFetcher` — 웹 페이지 fetch + 텍스트 추출
- **O (개방-폐쇄)**: 새 모델 추가 시 `ModelId` enum + `AVAILABLE_MODELS` 추가만으로 확장. 기존 코드 수정 불필요.
- **L (리스코프 치환)**: `SingleAgentService`와 `MultiAgentService`는 동일한 `generate_messages_stream` / `chat_message_stream` 인터페이스.
- **I (인터페이스 분리)**: 라우트는 서비스만 의존. 서비스는 프롬프트와 모델 프로바이더만 의존.
- **D (의존성 역전)**: 서비스가 직접 Bedrock 클라이언트를 생성하지 않고 `ModelProvider`를 통해 추상화.

### 5. DRY 원칙

- **프롬프트 재사용**: `prompts/` 디렉터리에 시스템 프롬프트와 빌더 함수 분리. 싱글/멀티 에이전트 모두 동일 프롬프트 사용.
- **JSON 파싱**: `_extract_json_result()` 정적 메서드를 SingleAgentService에 구현, MultiAgentService에서 재사용.
- **SSE 이벤트 생성**: `_build_and_stream_graph()`로 Graph 빌딩 + 스트리밍 로직 공통화.
- **Enum 중복 금지**: 모델 ID, 채널 등 상수를 여러 파일에 하드코딩하지 않음. `requests.py`의 enum이 유일한 소스.

### 6. 테스트 지침

- **BE 변경 후**: Pydantic 모델 파싱 테스트 (위 검증 스크립트)
- **프롬프트 변경 후**: 실제 LLM 호출 없이 프롬프트 빌더 함수 출력 확인
- **FE 변경 후**: 브라우저에서 옵션형/대화형 메시지 생성 E2E 확인
- **API 스키마 변경 후**: OpenAPI 스키마 생성 테스트 (`get_openapi(...)`)

### 7. 코드 변경 시 체크리스트

- [ ] BE 모델 변경 → FE 타입(`types/api.ts`) 동기화
- [ ] FE API 호출 변경 → BE 라우트/모델과 일치 확인
- [ ] enum 추가/변경 → Swagger에서 드롭다운 정상 표시 확인
- [ ] 환경변수 변경 → `.env.example` 업데이트
- [ ] SSE 이벤트 구조 변경 → FE `useSSE` 훅 핸들러 업데이트
- [ ] 프롬프트 변경 → LLM 응답 JSON 구조가 FE 파싱과 호환되는지 확인

---

## 기술 세부사항

### SSE 스트리밍 흐름

```
FE (useSSE hook) → POST /api/messages/generate (Accept: text/event-stream)
  → BE (messages.py) → SingleAgentService / MultiAgentService
    → Strands Agent.stream_async() → LLM (Bedrock)
      → SSE events: progress → text (chunks) → result (JSON) → [spam_checker result]
```

### 멀티 에이전트 Graph

```
Generator → Reviewer → Spam Checker (optional)
  (GraphBuilder로 선형 체인 구성, 각 노드의 출력이 다음 노드 입력)
```

### URL 분석 파이프라인

```
httpx (fast) → curl_cffi (TLS 우회) → Naver 전용 추출기 → BotBlockedError/RateLimitError
  → LLM이 추출된 텍스트에서 상품 정보 구조화
```

### FE API 클라이언트 주의사항

- `API_BASE`: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50001'` — `||` 사용 (빈 문자열 fallback 포함)
- SSE: `useSSE` 훅으로 `fetch` + `ReadableStream` 처리
- 에러: FastAPI `detail` 메시지를 추출하여 사용자에게 표시

---

## 금지사항

- 모델 ID, 채널 등 상수를 여러 파일에 중복 하드코딩하지 않는다
- `.env` 파일을 커밋하지 않는다 (`.env.example`만 커밋)
- BE API 변경 후 FE 영향 검증 없이 완료 처리하지 않는다
- SSE 이벤트 구조(`{type, data, agentName}`)를 임의로 변경하지 않는다
- Pydantic alias와 FE 키 이름이 불일치하도록 두지 않는다
- `??` 연산자로 환경변수를 fallback하지 않는다 (빈 문자열 미처리 — `||` 사용)
