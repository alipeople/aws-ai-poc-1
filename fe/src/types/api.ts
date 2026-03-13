// ===== Enums =====
export type AgentMode = 'single' | 'multi';

export type Channel = 'SMS' | 'LMS' | 'MMS' | '알림톡' | '브랜드' | 'RCS';
export type Purpose = '프로모션' | '안내' | '이벤트' | '리마인더' | '리뷰요청' | '인사';
export type Tone = '친근체' | '격식체' | '유머러스' | '긴급체' | '감성체';
export type SourceType = 'direct' | 'url' | 'past';

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
  target?: string;
  sendTime?: string;
  agentMode: AgentMode;
  spamCheckEnabled: boolean;
  modelId: string;
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
  modelId: string;
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
