import json
import logging

from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from app.models.requests import MessageGenerateRequest, ChatRequest
from app.services.agent_service import SingleAgentService
from app.services.multi_agent_service import MultiAgentService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/api/messages/generate")
async def generate_messages(request: MessageGenerateRequest, req: Request):
    """Generate AI marketing messages via SSE stream or JSON fallback."""

    async def event_generator():
        try:
            service = (
                SingleAgentService()
                if request.agent_mode == "single"
                else MultiAgentService()
            )
            async for event in service.generate_messages_stream(
                channel=request.channel,
                purpose=request.purpose,
                tone=request.tone,
                source=request.source,
                season=request.season or "",
                target=request.target or "",
                send_time=request.send_time or "",
                model_id=request.model_id,
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


@router.post("/api/messages/chat")
async def chat_message(request: ChatRequest, req: Request):
    """Chat with AI assistant via SSE stream or JSON fallback."""

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
