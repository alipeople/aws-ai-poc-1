# ADR-01: 기술 스택 선정

## 상태

승인됨

## 컨텍스트

HTML 프로토타입을 풀스택 애플리케이션으로 전환하면서 기술 스택을 결정해야 합니다.
AWS 생태계와의 통합, 실시간 스트리밍, 개발 생산성이 핵심 고려사항입니다.

## 결정

### 프론트엔드: Next.js 14+ (App Router) + TypeScript

- **App Router**: 서버 컴포넌트, 레이아웃 시스템, 파일 기반 라우팅 제공
- **TypeScript**: 타입 안전성으로 런타임 오류 사전 방지, API 계약 명확화
- **SSR 지원**: 초기 로딩 성능과 SEO 개선 가능 (향후 프로덕션 전환 시 유리)

### 백엔드: Python FastAPI

- **비동기 네이티브**: `async/await` 기반으로 SSE 스트리밍에 최적
- **Pydantic**: 요청/응답 데이터 검증을 모델 선언만으로 자동 처리
- **자동 OpenAPI**: Swagger UI를 자동 생성하여 API 문서화 비용 절감
- **Python 생태계**: AI/ML 라이브러리와의 자연스러운 통합

### AI 프레임워크: AWS Strands Agents

- **AWS 네이티브**: Amazon Bedrock과 직접 통합, 별도 어댑터 불필요
- **스트리밍 지원**: 에이전트 실행 결과를 스트리밍으로 반환 가능
- **도구 시스템**: 에이전트에 커스텀 도구를 부여하여 기능 확장 가능

### 배포: Mangum (Lambda 어댑터)

- **듀얼 실행**: 로컬에서는 Uvicorn, 프로덕션에서는 Lambda로 동일 코드 실행
- **서버리스**: 인프라 관리 부담 최소화, 사용량 기반 과금
- **ASGI 호환**: FastAPI의 ASGI 인터페이스를 Lambda 이벤트로 변환

### SSE 통신: fetch + ReadableStream

- **POST 지원**: `EventSource` API는 GET 전용이라 요청 본문 전달 불가
- **ReadableStream**: `fetch` API의 `response.body`로 스트리밍 데이터 수신
- **브라우저 호환**: 모던 브라우저에서 네이티브 지원, 별도 폴리필 불필요

## 결과

- 프론트엔드-백엔드 간 명확한 책임 분리
- AWS 서비스와의 자연스러운 통합
- 로컬 개발과 클라우드 배포 간 코드 변경 최소화
