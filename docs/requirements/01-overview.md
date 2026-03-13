# 센드온 AI 스튜디오 POC — 프로젝트 개요

## 목적

HTML 프로토타입(`sendon-ai-merged1.html`)을 기반으로 AI 메시지 작성 기능을
실제 LLM과 연동된 풀스택 애플리케이션으로 구현합니다.

## 주요 기능

1. **AI 메시지 — 옵션형**: 6단계 마법사로 메시지 설정 → A/B/C 3종 생성
2. **AI 메시지 — 대화형**: LLM과 실시간 채팅으로 메시지 작성
3. **싱글/멀티 에이전트 모드**: 에이전트 수 및 파이프라인 전환 가능
4. **LLM 모델 선택**: Claude Sonnet, Haiku, Amazon Nova 등 전환
5. **5개 테마**: Sendon, Toss, Retro 8bit, Dark, Pastel

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | Next.js 14+, TypeScript, CSS Variables |
| 백엔드 | Python, FastAPI, AWS Strands Agents |
| AI | Amazon Bedrock (Claude Sonnet/Haiku, Nova) |
| 배포 | AWS Lambda (Mangum) + 로컬 개발 |

## 범위

이 POC는 센드온 플랫폼의 AI 메시지 작성 기능을 검증하기 위한 프로토타입입니다.
프로덕션 배포가 아닌 기능 검증과 사용자 경험 확인이 주 목적입니다.
