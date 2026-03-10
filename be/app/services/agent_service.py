"""
Single Agent Service for message generation and chat.
Uses AWS Strands Agents SDK with lazy imports to avoid ImportError without credentials.
"""
import json
import re
import logging
from typing import AsyncIterator, Optional, List

from app.services.model_provider import ModelProvider
from app.prompts.message_generator import (
    GENERATOR_SYSTEM_PROMPT,
    build_option_prompt,
    build_chat_system_prompt,
)

logger = logging.getLogger(__name__)


class SingleAgentService:
    """
    Handles single-agent message generation and chat via Strands Agents SDK.

    Responsibilities:
    - Stream marketing message generation with progress events
    - Stream conversational chat responses
    - Parse structured JSON results from agent output
    """

    def __init__(self) -> None:
        self._model_provider = ModelProvider()

    async def generate_messages_stream(
        self,
        channel: str,
        purpose: str,
        tone: str,
        source: str,
        season: str = "",
        target: str = "",
        send_time: str = "",
        model_id: Optional[str] = None,
    ) -> AsyncIterator[dict]:
        """
        Stream marketing message generation events.

        Yields dicts with keys: type, data, agentName.
        Event types: "progress" → "text" → "result" | "error".
        """
        agent_name = "generator"

        yield {
            "type": "progress",
            "data": "메시지를 생성하고 있습니다...",
            "agentName": agent_name,
        }

        try:
            # Lazy import to avoid ImportError without AWS credentials
            from strands import Agent

            model = self._model_provider.get_model(
                model_id or self._model_provider.get_default_model().model_id
            )
            agent = Agent(
                model=model,
                system_prompt=GENERATOR_SYSTEM_PROMPT,
            )

            prompt = build_option_prompt(
                channel=channel,
                purpose=purpose,
                tone=tone,
                source=source,
                season=season,
                target=target,
                send_time=send_time,
            )

            yield {
                "type": "progress",
                "data": "AI 에이전트가 메시지를 작성 중입니다...",
                "agentName": agent_name,
            }

            accumulated_text = ""
            async for event in agent.stream_async(prompt):
                if "data" in event:
                    chunk = event["data"]
                    accumulated_text += chunk
                    yield {
                        "type": "text",
                        "data": chunk,
                        "agentName": agent_name,
                    }

            # Parse final JSON result from accumulated text
            parsed = self._extract_json_result(accumulated_text)
            yield {
                "type": "result",
                "data": json.dumps(parsed, ensure_ascii=False),
                "agentName": agent_name,
            }

        except Exception as e:
            logger.exception("Error in generate_messages_stream")
            yield {
                "type": "error",
                "data": str(e),
                "agentName": agent_name,
            }

    async def chat_message_stream(
        self,
        message: str,
        conversation_history: Optional[List[dict]] = None,
        model_id: Optional[str] = None,
    ) -> AsyncIterator[dict]:
        """
        Stream chat responses for conversational message assistance.

        Yields dicts with keys: type, data, agentName.
        Event types: "text" | "error".
        """
        agent_name = "assistant"

        try:
            # Lazy import to avoid ImportError without AWS credentials
            from strands import Agent

            model = self._model_provider.get_model(
                model_id or self._model_provider.get_default_model().model_id
            )

            system_prompt = build_chat_system_prompt()

            # Build messages with conversation history context
            history_context = ""
            if conversation_history:
                for msg in conversation_history:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    history_context += f"[{role}]: {content}\n"

            agent = Agent(
                model=model,
                system_prompt=system_prompt,
            )

            prompt = message
            if history_context:
                prompt = (
                    f"이전 대화 기록:\n{history_context}\n"
                    f"현재 사용자 메시지: {message}"
                )

            async for event in agent.stream_async(prompt):
                if "data" in event:
                    yield {
                        "type": "text",
                        "data": event["data"],
                        "agentName": agent_name,
                    }

        except Exception as e:
            logger.exception("Error in chat_message_stream")
            yield {
                "type": "error",
                "data": str(e),
                "agentName": agent_name,
            }

    @staticmethod
    def _extract_json_result(text: str) -> dict:
        """
        Extract and parse the JSON object from streamed agent text.

        Tries multiple strategies:
        1. Find JSON block in markdown code fences
        2. Find raw JSON object in text
        3. Return raw text wrapped in a dict on failure
        """
        # Strategy 1: markdown code fence
        fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if fence_match:
            try:
                return json.loads(fence_match.group(1))
            except json.JSONDecodeError:
                pass

        # Strategy 2: find outermost { ... } block
        brace_match = re.search(r"\{.*\}", text, re.DOTALL)
        if brace_match:
            try:
                return json.loads(brace_match.group(0))
            except json.JSONDecodeError:
                pass

        # Fallback: wrap raw text
        return {"raw_text": text}
