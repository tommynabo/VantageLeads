// ===== Radar Sources =====
export type RadarSource = 'borme' | 'traspasos' | 'inmobiliario' | 'linkedin';

export type Temperature = 'Alto' | 'Medio' | 'Bajo';

export type SignalStatus = 'new' | 'reviewed' | 'contacted' | 'archived';

// ===== Raw Signal (pre-AI) =====
export interface RawSignal {
  source: RadarSource;
  name: string;
  roleCompany: string;
  location: string;
  trigger: string;
  excerpt: string;
  fullSource: string;
  sourceUrl?: string;
  scrapedAt: string;
}

// ===== Processed Signal (post-AI) =====
export interface ProcessedSignal {
  id: string;
  source: RadarSource;
  name: string;
  roleCompany: string;
  location: string;
  trigger: string;
  temperature: Temperature;
  excerpt: string;
  fullSource: string;
  sourceUrl?: string;
  aiAnalysis: {
    intent: string;
    emotion: string;
  };
  draftMessage: string;
  date: string;
  status: SignalStatus;
  createdAt: string;
  archivedAt?: string;
}

// ===== API Request/Response Types =====
export interface ScanRequest {
  radars?: RadarSource[];
  keywords?: string[];
}

export interface ScanResponse {
  success: boolean;
  signalsFound: number;
  signalsProcessed: number;
  signals: ProcessedSignal[];
}

export interface SearchRequest {
  query: string;
  source?: RadarSource;
  temperature?: Temperature;
  status?: SignalStatus;
}

export interface RegenerateRequest {
  signalId: string;
  angle?: string;
}

export interface ArchiveRequest {
  signalId: string;
}

export interface DashboardStats {
  totalLeads: number;
  highTicket: number;
  newToday: number;
  bySource: Record<RadarSource, number>;
  byTemperature: Record<Temperature, number>;
  recentSearches: { query: string; date: string; results: number }[];
}

export interface RadarSettings {
  borme: { enabled: boolean; keywords: string[] };
  traspasos: { enabled: boolean; keywords: string[] };
  inmobiliario: { enabled: boolean; keywords: string[] };
  linkedin: { enabled: boolean; keywords: string[] };
}

// ===== Radar Module Interface =====
export interface RadarModule {
  scan(keywords?: string[]): Promise<RawSignal[]>;
}
