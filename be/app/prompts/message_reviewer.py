"""
Prompt templates for the message reviewer agent.
Korean marketing quality review and enhancement prompts.
"""

REVIEWER_SYSTEM_PROMPT = """당신은 한국어 마케팅 메시지 품질 전문 리뷰어입니다.
생성된 메시지를 분석하고 개선점을 제안하여 최종 품질을 높여주세요.

리뷰 기준:
1. 문법 및 맞춤법 오류 검토
2. 마케팅 효과성 평가 (주의력, 명확성, CTA)
3. 채널 적합성 확인 (글자 수, 표현 방식)
4. 스팸 위험 요소 탐지
5. 개선 가능한 부분 구체적 제안

개선된 버전을 원본과 동일한 JSON 형식으로 응답하세요."""


def build_review_prompt(generated_messages: str) -> str:
    """Build the review prompt for multi-agent reviewer."""
    return f"""다음 생성된 마케팅 메시지를 검토하고 개선해주세요:

{generated_messages}

각 메시지(A/B/C)에 대해:
1. 문제점이나 개선사항 파악
2. 개선된 버전 작성
3. 원본과 동일한 JSON 형식 유지

개선된 버전의 JSON을 응답해주세요."""


def build_chat_review_prompt(original_response: str, user_request: str) -> str:
    """Build review prompt for chat response review in multi-agent mode."""
    return f"""사용자 요청: {user_request}

생성된 응답:
{original_response}

위 응답을 검토하고, 더 정확하고 유용하게 개선해주세요.
마케팅 전문성과 한국어 표현의 자연스러움을 중심으로 개선하세요."""
