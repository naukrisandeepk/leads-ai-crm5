export enum LeadCategory {
  HOT = 'Hot Lead',
  WARM = 'Warm Lead',
  NO_LEAD = 'No Lead / Noise',
}

export enum BuyingIntent {
  EXPLICIT = 'Explicit',
  IMPLICIT = 'Implicit',
  FUTURE = 'Future',
  NONE = 'None',
}

export enum Urgency {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum BuyingStage {
  AWARENESS = 'Awareness',
  CONSIDERATION = 'Consideration',
  DECISION = 'Decision',
  UNKNOWN = 'Unknown',
}

export enum CRMStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  FOLLOW_UP = 'Follow-Up',
  QUALIFIED = 'Qualified',
  CONVERTED = 'Converted',
  LOST = 'Lost',
}

export enum MessageSource {
  INSTAGRAM_DM = 'Instagram DM',
  INSTAGRAM_COMMENT = 'Instagram Comment',
  FACEBOOK_MSG = 'Facebook Messenger',
  LINKEDIN_MSG = 'LinkedIn Message',
  YOUTUBE_COMMENT = 'YouTube Comment',
}

export interface AnalysisResult {
  category: LeadCategory;
  intent: BuyingIntent;
  urgency: Urgency;
  stage: BuyingStage;
  product_detected: string;
  recommended_action: string;
  score: number;
  summary_notes: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  type: 'note' | 'status_change' | 'system';
  content: string;
  author?: string;
}

export interface Lead {
  id: string;
  username: string; // Generic username
  platform: MessageSource;
  display_name?: string;
  profile_url?: string;
  message_text: string;
  timestamp: string; // ISO string
  analysis: AnalysisResult;
  crm_status: CRMStatus;
  tags: string[];
  history: HistoryItem[];
}

export interface PlatformConfig {
  enabled: boolean;
  appId: string;
  appSecret: string;
  accessToken: string;
  webhookToken?: string;
  pageId?: string; // Or Channel ID for YT
}

export interface AppSettings {
  instagram: PlatformConfig;
  facebook: PlatformConfig;
  linkedin: PlatformConfig;
  youtube: PlatformConfig;
}