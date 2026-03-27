import json
import logging

from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from app.models.requests import MessageGenerateRequest, ChatRequest
from app.services.agent_service import SingleAgentService
from app.services.multi_agent_service import MultiAgentService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["메시지 생성"])


@router.post(
    "/api/messages/generate",
    summary="옵션형 메시지 생성 (SSE)",
    description=(
        "5단계 위자드 옵션(채널·목적·톤·소재·시즌)을 기반으로 A/B/C 마케팅 메시지를 생성합니다.\n\n"
        "**요청 헤더**: `Accept: text/event-stream` → SSE 스트리밍, 그 외 → JSON 배열 응답\n\n"
        "## SSE 이벤트 흐름\n\n"
        "각 이벤트는 `data:` 필드에 JSON 문자열로 전달됩니다:\n"
        "```\n"
        'data: {"type":"progress","data":"소재를 분석하고 있어요...","agentName":"generator"}\n'
        'data: {"type":"text","data":"봄맞이 특가!","agentName":"generator"}\n'
        'data: {"type":"result","data":"{...JSON...}","agentName":"generator"}\n'
        "```\n\n"
        "| type | 설명 | data 내용 |\n"
        "|------|------|-----------|\n"
        "| `progress` | 진행 상태 (로딩 UI용) | 상태 메시지 문자열 |\n"
        "| `text` | LLM 텍스트 청크 (타이핑 효과) | 텍스트 조각 |\n"
        "| `result` | 최종 결과 JSON | JSON 문자열 (파싱 필요) |\n"
        "| `error` | 오류 발생 | 에러 메시지 |\n\n"
        "## 에이전트 모드\n\n"
        "- `single`: Generator → (Spam Checker)\n"
        "- `multi`: Generator → Reviewer → (Spam Checker) Graph 워크플로우\n\n"
        "## result 이벤트 JSON 구조\n\n"
        "**agentName=generator 또는 reviewer** (메시지 생성 결과):\n"
        "```json\n"
        "{\n"
        '  "performanceTip": "식품 업종은 시간대 언급 시 클릭률이 23% 높아집니다",\n'
        '  "detectedPurpose": "프로모션/할인",\n'
        '  "detectedChannel": "LMS",\n'
        '  "channelReason": "상세 설명이 필요한 프로모션이므로 LMS가 적합합니다",\n'
        '  "variants": [\n'
        '    {"label":"A","title":"간결형","text":"메시지 본문...","predictedOpenRate":42,"predictedClickRate":12,"charCount":85},\n'
        '    {"label":"B","title":"감성형","text":"메시지 본문...","predictedOpenRate":38,"predictedClickRate":15,"charCount":120}\n'
        "  ]\n"
        "}\n"
        "```\n\n"
        "**agentName=spam_checker** (스팸 분석 결과):\n"
        "```json\n"
        "{\n"
        '  "results": [\n'
        '    {"label":"A","classification":"HAM","risk_level":"safe","risk_factors":[],"ad_compliance":{"has_ad_label":true,"has_opt_out_number":true},"suggestions":[]}\n'
        "  ]\n"
        "}\n"
        "```\n\n"
        "## 프론트엔드 연동 예제 (JavaScript)\n\n"
        "```javascript\n"
        "async function generateMessages(body) {\n"
        "  const response = await fetch('/api/messages/generate', {\n"
        "    method: 'POST',\n"
        "    headers: {\n"
        "      'Content-Type': 'application/json',\n"
        "      'Accept': 'text/event-stream',  // SSE 요청\n"
        "    },\n"
        "    body: JSON.stringify(body),\n"
        "  });\n"
        "\n"
        "  const reader = response.body.getReader();\n"
        "  const decoder = new TextDecoder();\n"
        "  let buffer = '';\n"
        "\n"
        "  while (true) {\n"
        "    const { done, value } = await reader.read();\n"
        "    if (done) break;\n"
        "\n"
        "    buffer += decoder.decode(value, { stream: true });\n"
        "    const lines = buffer.split('\\n');\n"
        "    buffer = lines.pop(); // 마지막 미완성 라인 보관\n"
        "\n"
        "    for (const line of lines) {\n"
        "      if (!line.startsWith('data: ')) continue;\n"
        "      const event = JSON.parse(line.slice(6));\n"
        "\n"
        "      switch (event.type) {\n"
        "        case 'progress':\n"
        "          console.log('진행:', event.data);\n"
        "          break;\n"
        "        case 'text':\n"
        "          console.log('텍스트:', event.data);\n"
        "          break;\n"
        "        case 'result':\n"
        "          const result = JSON.parse(event.data);\n"
        "          if (event.agentName === 'spam_checker') {\n"
        "            console.log('스팸 분석:', result);\n"
        "          } else {\n"
        "            console.log('생성 결과:', result.variants);\n"
        "          }\n"
        "          break;\n"
        "        case 'error':\n"
        "          console.error('오류:', event.data);\n"
        "          break;\n"
        "      }\n"
        "    }\n"
        "  }\n"
        "}\n"
        "\n"
        "// 사용 예시\n"
        "generateMessages({\n"
        "  channel: 'sms',\n"
        "  tone: 'friendly',\n"
        "  source: '봄맞이 특가! 전 상품 최대 50% 할인',\n"
        "  source_type: 'direct',\n"
        "  agent_mode: 'single',\n"
        "  spam_check_enabled: true,\n"
        "  model_id: 'apac.anthropic.claude-sonnet-4-20250514-v1:0',\n"
        "});\n"
        "```\n\n"
        "## Non-streaming 대안\n\n"
        "`Accept` 헤더를 `text/event-stream`이 아닌 값으로 보내면 "
        "모든 이벤트를 모아 JSON 배열로 한번에 반환합니다:\n"
        "```json\n"
        '{"events": [{...}, {...}], "status": "complete"}\n'
        "```"
    ),
    response_description="SSE 스트림 또는 JSON 이벤트 배열",
)
async def generate_messages(request: MessageGenerateRequest, req: Request):
    logger.info(
        "[generate] model=%s agent=%s spam=%s channel=%s",
        request.model_id, request.agent_mode, request.spam_check_enabled, request.channel,
    )

    async def event_generator():
        try:
            service = (
                SingleAgentService()
                if request.agent_mode == "single"
                else MultiAgentService()
            )
            async for event in service.generate_messages_stream(
                channel=request.channel or "",
                purpose=request.purpose,
                tone=request.tone,
                source=request.source,
                season=request.season or "",
                target=request.target or "",
                send_time=request.send_time or "",
                model_id=request.model_id,
                spam_check_enabled=request.spam_check_enabled,
                variant_count=request.variant_count,
            ):
                yield {"data": json.dumps(event, ensure_ascii=False)}
        except Exception as e:
            logger.exception("Error in generate event stream")
            yield {
                "data": json.dumps(
                    {"type": "error", "data": str(e)}, ensure_ascii=False
                )
            }

    # Non-streaming fallback (e.g. Lambda invocations without SSE support)
    if req.headers.get("accept") != "text/event-stream":
        events = []
        async for sse_event in event_generator():
            events.append(json.loads(sse_event["data"]))
        return {"events": events, "status": "complete"}

    return EventSourceResponse(event_generator())


@router.post(
    "/api/messages/chat",
    summary="대화형 AI 챗 (SSE)",
    description=(
        "자연어 대화로 마케팅 메시지 작성을 지원하는 AI 챗봇입니다.\n\n"
        "**요청 헤더**: `Accept: text/event-stream` → SSE 스트리밍, 그 외 → JSON 배열 응답\n\n"
        "## SSE 이벤트 흐름\n\n"
        "| type | 설명 | agentName |\n"
        "|------|------|----------|\n"
        "| `text` | LLM 응답 텍스트 청크 | `generator` / `reviewer` |\n"
        "| `progress` | 진행 상태 메시지 | 각 에이전트 |\n"
        "| `result` | 스팸 분석 결과 JSON (활성 시) | `spam_checker` |\n"
        "| `error` | 오류 메시지 | 해당 에이전트 |\n\n"
        "대화 히스토리(`conversation_history`)를 포함하면 이전 문맥을 유지합니다.\n\n"
        "## 프론트엔드 연동 예제 (JavaScript)\n\n"
        "```javascript\n"
        "async function chatWithAI(message, history = []) {\n"
        "  const response = await fetch('/api/messages/chat', {\n"
        "    method: 'POST',\n"
        "    headers: {\n"
        "      'Content-Type': 'application/json',\n"
        "      'Accept': 'text/event-stream',\n"
        "    },\n"
        "    body: JSON.stringify({\n"
        "      message,\n"
        "      conversation_history: history,\n"
        "      agent_mode: 'single',\n"
        "      spam_check_enabled: false,\n"
        "      model_id: 'apac.anthropic.claude-sonnet-4-20250514-v1:0',\n"
        "    }),\n"
        "  });\n"
        "\n"
        "  const reader = response.body.getReader();\n"
        "  const decoder = new TextDecoder();\n"
        "  let buffer = '';\n"
        "  let fullResponse = '';\n"
        "\n"
        "  while (true) {\n"
        "    const { done, value } = await reader.read();\n"
        "    if (done) break;\n"
        "\n"
        "    buffer += decoder.decode(value, { stream: true });\n"
        "    const lines = buffer.split('\\n');\n"
        "    buffer = lines.pop();\n"
        "\n"
        "    for (const line of lines) {\n"
        "      if (!line.startsWith('data: ')) continue;\n"
        "      const event = JSON.parse(line.slice(6));\n"
        "\n"
        "      if (event.type === 'text') {\n"
        "        fullResponse += event.data;  // 실시간 텍스트 누적\n"
        "        renderMarkdown(fullResponse); // 화면에 마크다운 렌더링\n"
        "      }\n"
        "    }\n"
        "  }\n"
        "\n"
        "  // 대화 히스토리에 추가\n"
        "  history.push({ role: 'user', content: message });\n"
        "  history.push({ role: 'assistant', content: fullResponse });\n"
        "}\n"
        "\n"
        "// 사용 예시\n"
        "chatWithAI('봄맞이 할인 이벤트 SMS 메시지 만들어줘');\n"
        "```\n\n"
        "## Non-streaming 대안\n\n"
        "`Accept` 헤더를 `text/event-stream`이 아닌 값으로 보내면 "
        "JSON 배열로 한번에 반환합니다:\n"
        "```json\n"
        '{"events": [{...}, {...}], "status": "complete"}\n'
        "```"
    ),
    response_description="SSE 스트림 또는 JSON 이벤트 배열",
)
async def chat_message(request: ChatRequest, req: Request):
    logger.info(
        "[chat] model=%s agent=%s spam=%s",
        request.model_id, request.agent_mode, request.spam_check_enabled,
    )

    async def event_generator():
        try:
            service = (
                SingleAgentService()
                if request.agent_mode == "single"
                else MultiAgentService()
            )
            # Convert ChatMessage pydantic models to plain dicts for service
            history = [
                {"role": msg.role, "content": msg.content}
                for msg in request.conversation_history
            ]
            async for event in service.chat_message_stream(
                message=request.message,
                conversation_history=history,
                model_id=request.model_id,
                spam_check_enabled=request.spam_check_enabled,
            ):
                yield {"data": json.dumps(event, ensure_ascii=False)}
        except Exception as e:
            logger.exception("Error in chat event stream")
            yield {
                "data": json.dumps(
                    {"type": "error", "data": str(e)}, ensure_ascii=False
                )
            }

    # Non-streaming fallback
    if req.headers.get("accept") != "text/event-stream":
        events = []
        async for sse_event in event_generator():
            events.append(json.loads(sse_event["data"]))
        return {"events": events, "status": "complete"}

    return EventSourceResponse(event_generator())
