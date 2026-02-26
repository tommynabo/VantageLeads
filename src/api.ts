import type { Signal, DashboardStats, RadarSettings, ScanResponse, RadarSource } from './types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.details || err.error || `HTTP ${res.status}`);
    }

    return res.json();
}

// ===== Signals =====

export async function fetchSignals(filters?: {
    source?: RadarSource;
    temperature?: string;
    status?: string;
}): Promise<{ signals: Signal[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.source) params.set('source', filters.source);
    if (filters?.temperature) params.set('temperature', filters.temperature);
    if (filters?.status) params.set('status', filters.status);
    const qs = params.toString();
    return request(`/signals${qs ? `?${qs}` : ''}`);
}

export async function fetchSignal(id: string): Promise<{ signal: Signal }> {
    return request(`/signals/${id}`);
}

// ===== Scan =====

export async function triggerScan(
    radars?: RadarSource[],
    keywords?: string[],
    targetCount?: number,
    signal?: AbortSignal
): Promise<ScanResponse> {
    return request('/scan', {
        method: 'POST',
        body: JSON.stringify({ radars, keywords, targetCount }),
        signal,
    });
}

// ===== Search =====

export async function searchSignals(query: string): Promise<{ results: Signal[]; total: number }> {
    return request('/search', {
        method: 'POST',
        body: JSON.stringify({ query }),
    });
}

// ===== Regenerate Message =====

export async function regenerateMessage(signalId: string, angle?: string): Promise<{
    success: boolean;
    draftMessage: string;
    signal: Signal;
}> {
    return request('/regenerate', {
        method: 'POST',
        body: JSON.stringify({ signalId, angle }),
    });
}

// ===== Re-analyze Signal =====

export async function reanalyzeSignal(signalId: string): Promise<{ success: boolean; signal: Signal }> {
    return request('/analyze', {
        method: 'POST',
        body: JSON.stringify({ signalId }),
    });
}

// ===== Archive =====

export async function archiveSignal(signalId: string): Promise<{ success: boolean; signal: Signal }> {
    return request('/archive', {
        method: 'POST',
        body: JSON.stringify({ signalId }),
    });
}

export async function fetchArchivedSignals(): Promise<{ signals: Signal[]; total: number }> {
    return request('/archive');
}

// ===== Stats =====

export async function fetchStats(): Promise<DashboardStats> {
    return request('/stats');
}

// ===== Settings =====

export async function fetchSettings(): Promise<RadarSettings> {
    return request('/settings');
}

export async function updateSettings(settings: Partial<RadarSettings>): Promise<{
    success: boolean;
    settings: RadarSettings;
}> {
    return request('/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
    });
}
