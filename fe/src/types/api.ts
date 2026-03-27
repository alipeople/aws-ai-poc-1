// ===== Enums =====
export type AgentMode = 'single' | 'multi';

/** 발송 채널 (BE Channel StrEnum과 동기화 — 소문자 ID) */
export type Channel = 'sms' | 'lms' | 'mms' | 'alimtalk' | 'brand' | 'rcs';
/** 메시지 목적 프리셋 ID. 직접 입력 시 자유 텍스트도 가능 */
export type Purpose = 'promotion' | 'notice' | 'event' | 'reminder' | 'review' | 'greeting' | string;
/** 톤앤매너 프리셋 ID. 직접 입력 시 자유 텍스트도 가능 */
export type Tone = 'friendly' | 'formal' | 'humor' | 'emotional' | 'urgent' | 'kind' | 'caring' | 'professional' | 'witty' | 'warm' | 'concise' | string;
export type SourceType = 'direct' | 'url' | 'past';
/** Bedrock LLM 모델 ID (BE ModelId StrEnum과 동기화) */
export type ModelId =
  | 'global.anthropic.claude-opus-4-6-v1'
  | 'apac.anthropic.claude-sonnet-4-20250514-v1:0'
  | 'global.anthropic.claude-haiku-4-5-20251001-v1:0'
  | 'apac.amazon.nova-pro-v1:0'
  | 'apac.amazon.nova-lite-v1:0';

export type Theme = 'sendon' | 'toss' | 'retro' | 'dark' | 'pastel';

// ===== Settings =====
export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
}

export interface SettingsState {
  agentMode: AgentMode;
  modelId: string;
  theme: Theme;
}

// ===== Message Generate =====
export interface MessageGenerateRequest {
  channel: Channel;
  purpose: Purpose;
  tone: Tone;
  toneAnalysis?: boolean;
  source: string;
  sourceType: SourceType;
  season?: string;
  variantCount?: number; // 1~4, default 3
  target?: string;
  sendTime?: string;
  agentMode: AgentMode;
  spamCheckEnabled: boolean;
  modelId: ModelId | string;
}

export interface MessageVariant {
  label: string; // 'A', 'B', 'C'
  title: string; // e.g. '간결형', '감성형', '긴급형'
  text: string;
  predictedOpenRate: number; // 0-100
  predictedClickRate: number; // 0-100
  charCount: number;
}

export interface SpamScore {
  score: number; // 0-100
  checks: SpamCheck[];
}

export interface SpamCheck {
  label: string;
  passed: boolean;
  detail?: string;
}

export interface PersonalizationVar {
  template: string; // e.g. '{{고객명}}'
  description: string;
}

export interface FatigueAnalysis {
  highFatigueCount: number;
  recommendation: string;
}

// ===== Spam Checker (KISA Analysis) =====
export type SpamClassification = 'HAM' | 'ILLEGAL_SPAM' | 'NORMAL_SPAM' | 'AD_VIOLATION';
export type SpamRiskLevel = 'safe' | 'warning' | 'danger';

export interface SpamRiskFactor {
  keyword: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
}

export interface SpamAdCompliance {
  has_ad_label: boolean;
  has_opt_out_number: boolean;
}

export interface SpamCheckerVariantResult {
  label: string;
  classification: SpamClassification;
  risk_level: SpamRiskLevel;
  risk_factors: SpamRiskFactor[];
  ad_compliance: SpamAdCompliance;
  suggestions: string[];
}

export interface SpamCheckerResult {
  results?: SpamCheckerVariantResult[];
  classification?: SpamClassification;
  risk_level?: SpamRiskLevel;
  risk_factors?: SpamRiskFactor[];
  ad_compliance?: SpamAdCompliance;
  suggestions?: string[];
  overall_classification?: SpamClassification;
  overall_risk_level?: SpamRiskLevel;
}

export interface MessageGenerateResponse {
  variants: MessageVariant[];
  spamScore: SpamScore;
  personalizationVars: PersonalizationVar[];
  fatigueAnalysis: FatigueAnalysis;
}

// ===== Chat =====
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
  agentMode: AgentMode;
  spamCheckEnabled: boolean;
  modelId: ModelId | string;
}

// ===== SSE Stream Events =====
export interface StreamEvent {
  type: 'text' | 'thinking' | 'tool_use' | 'progress' | 'result' | 'error';
  data: string | MessageGenerateResponse;
  agentName?: string; // 'generator' | 'reviewer' | 'spam_checker' | 'assistant'
}

// ===== URL Analysis =====
export interface UrlAnalysisRequest {
  url: string;
}

export interface UrlAnalysisResponse {
  productName: string;
  price?: string;
  discount?: string;
  category?: string;
  features: string[];
}

// ===== API Health =====
export interface HealthResponse {
  status: string;
  availableModels: string[];
}
