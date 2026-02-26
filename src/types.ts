export type Temperature = 'Alto' | 'Medio' | 'Bajo';
export type RadarSource = 'borme' | 'traspasos' | 'inmobiliario' | 'linkedin';
export type SignalStatus = 'new' | 'reviewed' | 'contacted' | 'archived';

export interface Signal {
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

export interface ScanResponse {
  success: boolean;
  signalsFound: number;
  signalsProcessed: number;
  signals: Signal[];
}
