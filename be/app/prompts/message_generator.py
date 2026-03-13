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
6. 소재/상품 정보에 URL 링크가 포함된 경우, 해당 링크를 결과 메시지 텍스트에 반드시 포함하세요. 링크는 원본 그대로 유지하되, 메시지 흐름에 자연스럽게 배치하세요.

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

    purpose_line = (
        f"메시지 목적: {purpose}"
        if purpose
        else "메시지 목적: 아래 소재/상품 정보를 분석하여 가장 적합한 메시지 목적(프로모션/할인, 안내/공지, 이벤트 초대, 리마인더, 리뷰 요청, 인사/감사 중)을 자동으로 판단하여 작성하세요."
    )

    channel_line = (
        f"발송 채널: {channel}"
        if channel
        else """\
발송 채널: 아래 소재/상품 정보를 분석하여 가장 적합한 발송 채널을 자동으로 판단하세요.
채널 판단 기준:
- SMS: 90자 이내 단문 메시지, 프로모션/할인 등 간결한 정보 전달에 적합
- LMS: 2000자 이내, 상세 안내/공지/이벤트 소개 등 긴 내용 전달에 적합
- MMS: 이미지 첨부가 필요한 상품 소개, 시각적 마케팅에 적합
- 알림톡: 주문/배송/예약 안내 등 트랜잭션 알림에 적합
- RCS: 리치 미디어(카루셀, 버튼)가 필요한 대화형 마케팅에 적합
판단한 채널과 추천 사유를 detectedChannel, channelReason 필드에 포함하세요."""
    )

    return f"""다음 조건으로 마케팅 메시지 3종(A/B/C)을 작성해주세요:

{channel_line}
{purpose_line}
톤앤매너: {tone}
소재/상품 정보: {source}
{season_line}

다음 JSON 형식으로 3가지 변형을 응답해주세요:
{{
  "detectedPurpose": "판단한 메시지 목적 (프로모션/할인, 안내/공지, 이벤트 초대, 리마인더, 리뷰 요청, 인사/감사 중 하나)",
  "detectedChannel": "판단한 최적 발송 채널 (SMS, LMS, MMS, 알림톡, RCS 중 하나. 채널이 명시된 경우 이 필드 생략)",
  "channelReason": "채널 추천 사유 (채널이 명시된 경우 이 필드 생략)",
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
