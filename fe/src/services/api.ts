/**
 * API service layer for 센드온 AI 스튜디오.
 * All endpoints use NEXT_PUBLIC_API_URL environment variable.
 */
import type {
  MessageGenerateRequest,
  ChatRequest,
  UrlAnalysisResponse,
  ModelOption,
  PersonalizationVar,
  SpamScore,
  FatigueAnalysis,
} from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Returns the full URL for the generate endpoint.
 * Caller uses useSSE hook to stream from this URL.
 */
function generateMessagesUrl(): string {
  return `${API_BASE}/api/messages/generate`;
}

/**
 * Returns the full URL for the chat endpoint.
 * Caller uses useSSE hook to stream from this URL.
 */
function chatMessageUrl(): string {
  return `${API_BASE}/api/messages/chat`;
}

/**
 * Analyze a product URL using LLM (non-streaming).
 */
async function analyzeUrl(url: string): Promise<UrlAnalysisResponse> {
  return fetchJSON<UrlAnalysisResponse>('/api/analyze-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

/**
 * Get available LLM models.
 */
async function getModels(): Promise<ModelOption[]> {
  return fetchJSON<ModelOption[]>('/api/models');
}

// ── Mock Data Endpoints ──────────────────────────────────────────────────────

async function getPastMessages() {
  return fetchJSON<Record<string, unknown>[]>('/api/mock/past-messages');
}

async function getPastSuccessful() {
  return fetchJSON<Record<string, unknown>[]>('/api/mock/past-successful');
}

async function getPersonalizationVars() {
  return fetchJSON<PersonalizationVar[]>('/api/mock/personalization-vars');
}

async function getSeasonRecommendations() {
  return fetchJSON<string[]>('/api/mock/season-recommendations');
}

async function getSpamScore(message: string) {
  return fetchJSON<SpamScore>('/api/mock/spam-score', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

async function getFatigueAnalysis(target: string) {
  return fetchJSON<unknown>('/api/mock/fatigue-analysis', {
    method: 'POST',
    body: JSON.stringify({ target }),
  });
}

// ── Exported API object ──────────────────────────────────────────────────────

export const api = {
  /** URL for SSE streaming — use with useSSE hook */
  generateMessagesUrl,
  /** URL for SSE streaming — use with useSSE hook */
  chatMessageUrl,
  /** Build request body for generate endpoint */
  buildGenerateBody: (request: MessageGenerateRequest) => ({
    channel: request.channel,
    purpose: request.purpose,
    tone: request.tone,
    source: request.source,
    source_type: request.sourceType,
    season: request.season,
    target: request.target,
    send_time: request.sendTime,
    agent_mode: request.agentMode,
    spam_check_enabled: request.spamCheckEnabled,
    model_id: request.modelId,
    tone_analysis: request.toneAnalysis,
  }),
  /** Build request body for chat endpoint */
  buildChatBody: (request: ChatRequest) => ({
    message: request.message,
    conversation_history: request.conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    agent_mode: request.agentMode,
    spam_check_enabled: request.spamCheckEnabled,
    model_id: request.modelId,
  }),
  analyzeUrl,
  getModels,
  mockData: {
    getPastMessages,
    getPastSuccessful,
    getPersonalizationVars,
    getSeasonRecommendations,
    getSpamScore,
    getFatigueAnalysis,
  },
};
