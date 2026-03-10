"""
Multi-Agent Service for message generation and chat.
Sequential workflow: Generator Agent → Reviewer Agent.
Uses AWS Strands Agents SDK with lazy imports to avoid ImportError without credentials.
"""
import json
import logging
from typing import AsyncIterator, Optional, List

from app.services.model_provider import ModelProvider
from app.services.agent_service import SingleAgentService
from app.prompts.message_generator import (
    GENERATOR_SYSTEM_PROMPT,
    build_option_prompt,
    build_chat_system_prompt,
)
from app.prompts.message_reviewer import (
    REVIEWER_SYSTEM_PROMPT,
    build_review_prompt,
    build_chat_review_prompt,
)

logger = logging.getLogger(__name__)


class MultiAgentService:
    """
    Handles multi-agent message generation and chat via Strands Agents SDK.

    Sequential workflow:
    - Phase 1 (Generator): Produces initial marketing messages
    - Phase 2 (Reviewer): Reviews and enhances the generated messages

    Responsibilities:
    - Stream Phase 1 events with agentName="generator"
    - Stream Phase 2 events with agentName="reviewer"
    - Yield progress events between phases
    """

    def __init__(self) -> None:
        self._model_provider = ModelProvider()
        self._single_agent = SingleAgentService()

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
        Stream multi-agent message generation events.

        Phase 1: Generator agent creates initial messages.
        Phase 2: Reviewer agent reviews and improves them.

        Yields dicts with keys: type, data, agentName.
        Event types: "progress" → "text" → "result" | "error".
        """
        resolved_model_id = model_id or self._model_provider.get_default_model().model_id

        # ── Phase 1: Generator ──────────────────────────────────────────────
        yield {
            "type": "progress",
            "data": "메시지를 생성하고 있습니다...",
            "agentName": "generator",
        }

        generated_text = ""
        try:
            # Lazy import to avoid ImportError without AWS credentials
            from strands import Agent

            model = self._model_provider.get_model(resolved_model_id)
            generator_agent = Agent(
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
                "agentName": "generator",
            }

            async for event in generator_agent.stream_async(prompt):
                if "data" in event:
                    chunk = event["data"]
                    generated_text += chunk
                    yield {
                        "type": "text",
                        "data": chunk,
                        "agentName": "generator",
                    }

        except Exception as e:
            logger.exception("Error in generator phase")
            yield {
                "type": "error",
                "data": str(e),
                "agentName": "generator",
            }
            return

        # ── Phase 2: Reviewer ───────────────────────────────────────────────
        yield {
            "type": "progress",
            "data": "메시지를 검토하고 있습니다...",
            "agentName": "reviewer",
        }

        try:
            from strands import Agent

            model = self._model_provider.get_model(resolved_model_id)
            reviewer_agent = Agent(
                model=model,
                system_prompt=REVIEWER_SYSTEM_PROMPT,
            )

            review_prompt = build_review_prompt(generated_text)
            reviewed_text = ""

            async for event in reviewer_agent.stream_async(review_prompt):
                if "data" in event:
                    chunk = event["data"]
                    reviewed_text += chunk
                    yield {
                        "type": "text",
                        "data": chunk,
                        "agentName": "reviewer",
                    }

            # Parse and emit final result from reviewer output
            parsed = SingleAgentService._extract_json_result(reviewed_text)
            yield {
                "type": "result",
                "data": json.dumps(parsed, ensure_ascii=False),
                "agentName": "reviewer",
            }

        except Exception as e:
            logger.exception("Error in reviewer phase")
            yield {
                "type": "error",
                "data": str(e),
                "agentName": "reviewer",
            }

    async def chat_message_stream(
        self,
        message: str,
        conversation_history: Optional[List[dict]] = None,
        model_id: Optional[str] = None,
    ) -> AsyncIterator[dict]:
        """
        Stream multi-agent chat responses.

        Phase 1: Generator agent produces initial response.
        Phase 2: Reviewer agent reviews and enhances it.

        Yields dicts with keys: type, data, agentName.
        Event types: "text" | "error".
        """
        resolved_model_id = model_id or self._model_provider.get_default_model().model_id

        # ── Phase 1: Generator ──────────────────────────────────────────────
        yield {
            "type": "progress",
            "data": "응답을 생성하고 있습니다...",
            "agentName": "generator",
        }

        generated_text = ""
        try:
            from strands import Agent

            model = self._model_provider.get_model(resolved_model_id)

            system_prompt = build_chat_system_prompt()
            history_context = ""
            if conversation_history:
                for msg in conversation_history:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    history_context += f"[{role}]: {content}\n"

            generator_agent = Agent(model=model, system_prompt=system_prompt)

            prompt = message
            if history_context:
                prompt = (
                    f"이전 대화 기록:\n{history_context}\n"
                    f"현재 사용자 메시지: {message}"
                )

            async for event in generator_agent.stream_async(prompt):
                if "data" in event:
                    chunk = event["data"]
                    generated_text += chunk
                    yield {
                        "type": "text",
                        "data": chunk,
                        "agentName": "generator",
                    }

        except Exception as e:
            logger.exception("Error in chat generator phase")
            yield {
                "type": "error",
                "data": str(e),
                "agentName": "generator",
            }
            return

        # ── Phase 2: Reviewer ───────────────────────────────────────────────
        yield {
            "type": "progress",
            "data": "응답을 검토하고 있습니다...",
            "agentName": "reviewer",
        }

        try:
            from strands import Agent

            model = self._model_provider.get_model(resolved_model_id)
            reviewer_agent = Agent(
                model=model,
                system_prompt=REVIEWER_SYSTEM_PROMPT,
            )

            review_prompt = build_chat_review_prompt(generated_text, message)

            async for event in reviewer_agent.stream_async(review_prompt):
                if "data" in event:
                    yield {
                        "type": "text",
                        "data": event["data"],
                        "agentName": "reviewer",
                    }

        except Exception as e:
            logger.exception("Error in chat reviewer phase")
            yield {
                "type": "error",
                "data": str(e),
                "agentName": "reviewer",
            }
