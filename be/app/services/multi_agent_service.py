"""
Multi-Agent Service for message generation and chat.
Graph-based workflow: Generator → Reviewer → Spam Checker via Strands SDK GraphBuilder.
Uses AWS Strands Agents SDK with lazy imports to avoid ImportError without credentials.
"""
import json
import logging
from dataclasses import dataclass
from typing import AsyncIterator, Optional, List

from app.services.model_provider import ModelProvider
from app.services.agent_service import SingleAgentService
from app.prompts.message_generator import (
    GENERATOR_SYSTEM_PROMPT,
    build_option_prompt,
    build_chat_system_prompt,
)
from app.prompts.message_reviewer import REVIEWER_SYSTEM_PROMPT, CHAT_REVIEWER_SYSTEM_PROMPT
from app.prompts.spam_checker import SPAM_CHECKER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class AgentNodeSpec:
    """Specification for an agent node in the multi-agent graph.

    Attributes:
        node_id: Unique identifier used as the graph node name and SSE agentName.
        system_prompt: System prompt that defines the agent's behavior.
    """

    node_id: str
    system_prompt: str


class MultiAgentService:
    """
    Handles multi-agent message generation and chat via Strands Agents SDK.

    Graph-based workflow using GraphBuilder:
    - Node "generator": Produces initial marketing messages
    - Node "reviewer": Reviews and enhances the generated messages
    - Node "spam_checker": Analyzes messages for KISA spam classification
    - Edges: generator → reviewer → spam_checker (linear chain)

    The Graph automatically passes each node's output to the next node.
    A single _build_and_stream_graph() adapter translates Graph streaming
    events into the existing SSE event format {type, data, agentName}.
    """

    def __init__(self) -> None:
        self._model_provider = ModelProvider()

    async def _build_and_stream_graph(
        self,
        task: str,
        agents: list[AgentNodeSpec],
        resolved_model_id: str,
        node_progress: dict[str, str],
        result_nodes: list[str] | None = None,
    ) -> AsyncIterator[dict]:
        """Build an N-node linear graph and translate streaming events to SSE format.

        Creates a linear chain of agents using GraphBuilder (agents[0] → agents[1] → ...),
        then streams execution events, converting them to the SSE event contract:
          - multiagent_node_start  → {type: "progress", agentName: node_id}
          - multiagent_node_stream → {type: "text", agentName: node_id}
          - After completion       → {type: "result", agentName: node_id} for each result_node

        Args:
            task: The user prompt to execute.
            agents: Ordered list of agent specs defining the linear chain.
            resolved_model_id: Bedrock model ID to use for all agents.
            node_progress: Mapping of node_id → progress message string.
            result_nodes: Node IDs to extract JSON results from. If None, no results extracted.

        Yields:
            SSE event dicts with keys: type, data, agentName.
        """
        # Lazy imports to avoid ImportError without AWS credentials
        from strands import Agent
        from strands.multiagent import GraphBuilder

        # Create agents and build graph
        builder = GraphBuilder()
        for spec in agents:
            agent = Agent(
                model=self._model_provider.get_model(resolved_model_id),
                system_prompt=spec.system_prompt,
            )
            builder.add_node(agent, node_id=spec.node_id)

        # Create linear chain edges: agents[0] → agents[1] → agents[2] → ...
        for i in range(len(agents) - 1):
            builder.add_edge(agents[i].node_id, agents[i + 1].node_id)

        builder.set_entry_point(agents[0].node_id)
        graph = builder.build()

        # Stream graph execution, translating events to SSE format
        accumulated: dict[str, str] = {}

        async for event in graph.stream_async(task):
            etype = event.get("type")
            node_id = event.get("node_id", "")

            if etype == "multiagent_node_start":
                accumulated[node_id] = ""
                msg = node_progress.get(node_id)
                if msg:
                    yield {"type": "progress", "data": msg, "agentName": node_id}

            elif etype == "multiagent_node_stream":
                nested = event.get("event", {})
                if "data" in nested:
                    chunk = nested["data"]
                    accumulated[node_id] = accumulated.get(node_id, "") + chunk
                    yield {"type": "text", "data": chunk, "agentName": node_id}

        # Graph completed — extract JSON results from specified nodes
        if result_nodes:
            for node_id in result_nodes:
                node_text = accumulated.get(node_id, "")
                parsed = SingleAgentService._extract_json_result(node_text)
                yield {
                    "type": "result",
                    "data": json.dumps(parsed, ensure_ascii=False),
                    "agentName": node_id,
                }

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
        spam_check_enabled: bool = True,
        variant_count: int = 3,
    ) -> AsyncIterator[dict]:
        """
        Stream multi-agent message generation events.

        Builds a Generator→Reviewer→Spam Checker graph and streams execution events.
        Generator creates initial messages; Reviewer reviews and improves them;
        Spam Checker analyzes for KISA compliance.

        Yields dicts with keys: type, data, agentName.
        Event types: "progress" → "text" → "result" | "error".
        """
        resolved_model_id = model_id or self._model_provider.get_default_model().model_id

        yield {
            "type": "progress",
            "data": "메시지 초안을 작성하고 있어요...",
            "agentName": "generator",
        }

        try:
            prompt = build_option_prompt(
                channel=channel,
                purpose=purpose,
                tone=tone,
                source=source,
                season=season,
                target=target,
                send_time=send_time,
                variant_count=variant_count,
            )

            agents = [
                AgentNodeSpec("generator", GENERATOR_SYSTEM_PROMPT),
                AgentNodeSpec("reviewer", REVIEWER_SYSTEM_PROMPT),
            ]
            node_progress = {
                "generator": "메시지 초안을 작성하고 있어요...",
                "reviewer": "작성된 메시지를 검토하고 있어요...",
            }
            result_nodes = ["reviewer"]

            if spam_check_enabled:
                agents.append(AgentNodeSpec("spam_checker", SPAM_CHECKER_SYSTEM_PROMPT))
                node_progress["spam_checker"] = "스팸 규정을 확인하고 있어요..."
                result_nodes.append("spam_checker")

            async for event in self._build_and_stream_graph(
                task=prompt,
                agents=agents,
                resolved_model_id=resolved_model_id,
                node_progress=node_progress,
                result_nodes=result_nodes,
            ):
                yield event

        except Exception as e:
            logger.exception("Error in multi-agent graph execution")
            yield {"type": "error", "data": str(e), "agentName": "generator"}

    async def chat_message_stream(
        self,
        message: str,
        conversation_history: Optional[List[dict]] = None,
        model_id: Optional[str] = None,
        spam_check_enabled: bool = True,
    ) -> AsyncIterator[dict]:
        """
        Stream multi-agent chat responses.

        Builds a Generator→Reviewer→Spam Checker graph and streams execution events.
        Generator produces initial response; Reviewer reviews and enhances it;
        Spam Checker analyzes for KISA compliance.

        Yields dicts with keys: type, data, agentName.
        Event types: "progress" → "text" → "result" | "error".
        """
        resolved_model_id = model_id or self._model_provider.get_default_model().model_id

        yield {
            "type": "progress",
            "data": "응답을 준비하고 있어요...",
            "agentName": "generator",
        }

        try:
            system_prompt = build_chat_system_prompt()

            prompt = message
            if conversation_history:
                history_context = ""
                for msg in conversation_history:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    history_context += f"[{role}]: {content}\n"
                prompt = (
                    f"이전 대화 기록:\n{history_context}\n"
                    f"현재 사용자 메시지: {message}"
                )

            agents = [
                AgentNodeSpec("generator", system_prompt),
                AgentNodeSpec("reviewer", CHAT_REVIEWER_SYSTEM_PROMPT),
            ]
            node_progress = {
                "reviewer": "응답을 검토하고 있어요...",
            }
            result_nodes: list[str] = []

            if spam_check_enabled:
                agents.append(AgentNodeSpec("spam_checker", SPAM_CHECKER_SYSTEM_PROMPT))
                node_progress["spam_checker"] = "스팸 규정을 확인하고 있어요..."
                result_nodes.append("spam_checker")

            async for event in self._build_and_stream_graph(
                task=prompt,
                agents=agents,
                resolved_model_id=resolved_model_id,
                node_progress=node_progress,
                result_nodes=result_nodes if result_nodes else None,
            ):
                yield event

        except Exception as e:
            logger.exception("Error in multi-agent chat graph execution")
            yield {"type": "error", "data": str(e), "agentName": "generator"}
