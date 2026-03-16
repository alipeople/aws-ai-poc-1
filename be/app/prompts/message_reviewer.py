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
6. 광고표기 준수 검증:
   - 메시지 내용을 직접 분석하여 광고성/정보성 여부를 독립적으로 판단하세요
   - 광고성인데 '(광고)' 표기가 메시지 맨 앞에 누락된 경우 → 개선 버전에 반드시 포함
   - 광고성인데 '무료거부 080XXXXXXXX' 수신거부 번호가 맨 끝에 누락된 경우 → 개선 버전에 반드시 포함
   - 정보성인데 광고표기('(광고)', 수신거부 번호)가 포함된 경우 → 개선 버전에서 제거

리뷰 절차:
- 이전 에이전트가 생성한 메시지를 입력으로 받습니다
- 각 메시지 변형(A/B/C)에 대해 개별적으로 검토하세요
- 각 변형마다: 1) 문제점 파악 → 2) 개선된 버전 작성
- 대화형 응답의 경우 마케팅 전문성과 한국어 표현의 자연스러움을 중심으로 개선하세요

개선된 버전을 원본과 동일한 JSON 형식으로 응답하세요."""


def build_review_prompt(generated_messages: str) -> str:
    """Build the review prompt for multi-agent reviewer.

    .. deprecated::
        Graph 패턴에서는 사용되지 않습니다. Graph가 자동으로
        이전 노드의 출력을 다음 노드에 전달합니다.
        REVIEWER_SYSTEM_PROMPT에 리뷰 절차가 포함되어 있습니다.
    """
    return f"""다음 생성된 마케팅 메시지를 검토하고 개선해주세요:

{generated_messages}

각 메시지(A/B/C)에 대해:
1. 문제점이나 개선사항 파악
2. 개선된 버전 작성
3. 원본과 동일한 JSON 형식 유지

개선된 버전의 JSON을 응답해주세요."""


def build_chat_review_prompt(original_response: str, user_request: str) -> str:
    """Build review prompt for chat response review in multi-agent mode.

    .. deprecated::
        Graph 패턴에서는 사용되지 않습니다. Graph가 자동으로
        이전 노드의 출력을 다음 노드에 전달합니다.
    """
    return f"""사용자 요청: {user_request}

생성된 응답:
{original_response}

위 응답을 검토하고, 더 정확하고 유용하게 개선해주세요.
마케팅 전문성과 한국어 표현의 자연스러움을 중심으로 개선하세요."""
