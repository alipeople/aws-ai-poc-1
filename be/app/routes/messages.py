from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.requests import MessageGenerateRequest, ChatRequest
import json

router = APIRouter()


async def _placeholder_stream(message: str):
    """Placeholder SSE stream for stub endpoints."""
    events = [
        {"type": "progress", "data": "서비스 준비 중입니다..."},
        {"type": "result", "data": message},
    ]
    for event in events:
        yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


@router.post("/api/messages/generate")
async def generate_messages(request: MessageGenerateRequest):
    """Generate AI marketing messages (SSE stream). Implemented in Task 19."""
    return StreamingResponse(
        _placeholder_stream("메시지 생성 기능은 Task 19에서 구현됩니다."),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/api/messages/chat")
async def chat_message(request: ChatRequest):
    """Chat with AI assistant (SSE stream). Implemented in Task 20."""
    return StreamingResponse(
        _placeholder_stream("채팅 기능은 Task 20에서 구현됩니다."),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
