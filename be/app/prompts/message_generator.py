"""
Prompt templates for the message generation agent.
Korean marketing message specialist prompts.
"""

GENERATOR_SYSTEM_PROMPT = """당신은 한국어 마케팅 메시지 작성 전문가입니다.
다음 조건에 맞는 고품질 마케팅 메시지를 작성해주세요.

작성 원칙:
1. 수신자의 주의를 끄는 첫 문장 작성
2. 핵심 혜택을 명확하게 전달
3. 행동 유도(CTA)를 자연스럽게 포함
4. 채널별 글자 수 제한 준수 (SMS: 90자, LMS: 2000자)
5. 스팸 필터를 피하는 자연스러운 표현 사용

반드시 JSON 형식으로 응답하세요."""


def build_option_prompt(
    channel: str,
    purpose: str,
    tone: str,
    source: str,
    season: str = "",
    target: str = "",
    send_time: str = "",
) -> str:
    """Build the user prompt for option-based message generation."""
    season_line = f"- 시즌/이벤트: {season}" if season else ""
    target_line = f"- 발송 대상: {target}" if target else ""
    send_time_line = f"- 발송 시간: {send_time}" if send_time else ""

    return f"""다음 조건으로 마케팅 메시지 3종(A/B/C)을 작성해주세요:

발송 채널: {channel}
메시지 목적: {purpose}
톤앤매너: {tone}
소재/상품 정보: {source}
{season_line}
{target_line}
{send_time_line}

다음 JSON 형식으로 3가지 변형을 응답해주세요:
{{
  "variants": [
    {{
      "label": "A",
      "title": "간결형",
      "text": "메시지 내용",
      "predictedOpenRate": 예상오픈율(숫자),
      "predictedClickRate": 예상클릭률(숫자),
      "charCount": 글자수(숫자)
    }},
    {{
      "label": "B",
      "title": "감성형",
      "text": "메시지 내용",
      "predictedOpenRate": 예상오픈율(숫자),
      "predictedClickRate": 예상클릭률(숫자),
      "charCount": 글자수(숫자)
    }},
    {{
      "label": "C",
      "title": "긴급형",
      "text": "메시지 내용",
      "predictedOpenRate": 예상오픈율(숫자),
      "predictedClickRate": 예상클릭률(숫자),
      "charCount": 글자수(숫자)
    }}
  ]
}}"""


def build_chat_system_prompt() -> str:
    """Build the system prompt for conversational chat mode."""
    return """당신은 센드온 AI 메시지 도우미입니다.
사용자가 마케팅 메시지를 작성하는 것을 도와주세요.

도움 범위:
- SMS/LMS/MMS/알림톡 등 채널별 메시지 작성
- 목적(프로모션/안내/이벤트)에 맞는 메시지 제안
- 톤앤매너 조정 (친근체/격식체/긴급체 등)
- 개인화 변수 활용 안내 ({{고객명}}, {{적립포인트}} 등)
- 스팸 필터 회피 전략

항상 친절하고 전문적으로 응답하며, 구체적인 메시지 예시를 제공하세요."""
