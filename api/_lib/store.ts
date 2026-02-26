import { getDb, initializeDatabase } from './db.js';
import { ProcessedSignal, DashboardStats, RadarSettings, SignalStatus } from './types.js';

// ===== DB Initialization Guard =====
let dbInitialized = false;

export async function ensureDb(): Promise<void> {
    if (!dbInitialized) {
        await initializeDatabase();
        dbInitialized = true;
    }
}

// ===== CRUD Operations =====

export async function getSignals(filters?: {
    source?: string;
    temperature?: string;
    status?: SignalStatus;
}): Promise<ProcessedSignal[]> {
    await ensureDb();
    const sql = getDb();

    let rows;
    if (filters?.source && filters?.temperature && filters?.status) {
        rows = await sql`SELECT * FROM signals WHERE status != 'archived' AND source = ${filters.source} AND temperature = ${filters.temperature} AND status = ${filters.status} ORDER BY created_at DESC`;
    } else if (filters?.source && filters?.temperature) {
        rows = await sql`SELECT * FROM signals WHERE status != 'archived' AND source = ${filters.source} AND temperature = ${filters.temperature} ORDER BY created_at DESC`;
    } else if (filters?.source && filters?.status) {
        rows = await sql`SELECT * FROM signals WHERE status != 'archived' AND source = ${filters.source} AND status = ${filters.status} ORDER BY created_at DESC`;
    } else if (filters?.temperature && filters?.status) {
        rows = await sql`SELECT * FROM signals WHERE status != 'archived' AND temperature = ${filters.temperature} AND status = ${filters.status} ORDER BY created_at DESC`;
    } else if (filters?.source) {
        rows = await sql`SELECT * FROM signals WHERE status != 'archived' AND source = ${filters.source} ORDER BY created_at DESC`;
    } else if (filters?.temperature) {
        rows = await sql`SELECT * FROM signals WHERE status != 'archived' AND temperature = ${filters.temperature} ORDER BY created_at DESC`;
    } else if (filters?.status) {
        rows = await sql`SELECT * FROM signals WHERE status != 'archived' AND status = ${filters.status} ORDER BY created_at DESC`;
    } else {
        rows = await sql`SELECT * FROM signals WHERE status != 'archived' ORDER BY created_at DESC`;
    }

    return rows.map(rowToSignal);
}

export async function getArchivedSignals(): Promise<ProcessedSignal[]> {
    await ensureDb();
    const sql = getDb();
    const rows = await sql`
    SELECT * FROM signals WHERE status = 'archived' ORDER BY archived_at DESC
  `;
    return rows.map(rowToSignal);
}

export async function getSignal(id: string): Promise<ProcessedSignal | undefined> {
    await ensureDb();
    const sql = getDb();
    const rows = await sql`SELECT * FROM signals WHERE id = ${id}`;
    if (rows.length === 0) return undefined;
    return rowToSignal(rows[0]);
}

export async function addSignals(signals: ProcessedSignal[]): Promise<void> {
    await ensureDb();
    const sql = getDb();

    for (const s of signals) {
        await sql`
      INSERT INTO signals (id, source, name, role_company, location, trigger_type, temperature, excerpt, full_source, source_url, ai_intent, ai_emotion, draft_message, date_label, status, created_at)
      VALUES (${s.id}, ${s.source}, ${s.name}, ${s.roleCompany}, ${s.location}, ${s.trigger}, ${s.temperature}, ${s.excerpt}, ${s.fullSource}, ${s.sourceUrl || null}, ${s.aiAnalysis.intent}, ${s.aiAnalysis.emotion}, ${s.draftMessage}, ${s.date}, ${s.status}, ${s.createdAt})
      ON CONFLICT (id) DO NOTHING
    `;
    }
}

export async function updateSignal(id: string, updates: Partial<ProcessedSignal>): Promise<ProcessedSignal | undefined> {
    await ensureDb();
    const sql = getDb();

    // Build dynamic update
    if (updates.draftMessage !== undefined) {
        await sql`UPDATE signals SET draft_message = ${updates.draftMessage} WHERE id = ${id}`;
    }
    if (updates.aiAnalysis) {
        await sql`UPDATE signals SET ai_intent = ${updates.aiAnalysis.intent}, ai_emotion = ${updates.aiAnalysis.emotion} WHERE id = ${id}`;
    }
    if (updates.temperature) {
        await sql`UPDATE signals SET temperature = ${updates.temperature} WHERE id = ${id}`;
    }
    if (updates.status) {
        await sql`UPDATE signals SET status = ${updates.status} WHERE id = ${id}`;
    }
    if (updates.archivedAt) {
        await sql`UPDATE signals SET archived_at = ${updates.archivedAt} WHERE id = ${id}`;
    }

    return getSignal(id);
}

export async function archiveSignal(id: string): Promise<ProcessedSignal | undefined> {
    await ensureDb();
    const sql = getDb();
    const now = new Date().toISOString();
    await sql`
    UPDATE signals SET status = 'archived', archived_at = ${now} WHERE id = ${id}
  `;
    return getSignal(id);
}

export async function searchSignals(query: string): Promise<ProcessedSignal[]> {
    await ensureDb();
    const sql = getDb();
    const pattern = `%${query}%`;

    const rows = await sql`
    SELECT * FROM signals
    WHERE name ILIKE ${pattern}
       OR role_company ILIKE ${pattern}
       OR trigger_type ILIKE ${pattern}
       OR location ILIKE ${pattern}
       OR excerpt ILIKE ${pattern}
       OR full_source ILIKE ${pattern}
       OR ai_intent ILIKE ${pattern}
       OR source ILIKE ${pattern}
    ORDER BY created_at DESC
  `;

    // Track search in history
    await sql`
    INSERT INTO search_history (query, results_count) VALUES (${query}, ${rows.length})
  `;

    return rows.map(rowToSignal);
}

// ===== Stats =====

export async function getStats(): Promise<DashboardStats> {
    await ensureDb();
    const sql = getDb();

    const activeRows = await sql`SELECT * FROM signals WHERE status != 'archived'`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = activeRows.map(rowToSignal);
    const newToday = active.filter(s => new Date(s.createdAt) >= today).length;

    // Get recent searches
    const searchRows = await sql`
    SELECT query, results_count, created_at FROM search_history ORDER BY created_at DESC LIMIT 5
  `;

    return {
        totalLeads: active.length,
        highTicket: active.filter(s => s.temperature === 'Alto').length,
        newToday,
        bySource: {
            borme: active.filter(s => s.source === 'borme').length,
            traspasos: active.filter(s => s.source === 'traspasos').length,
            inmobiliario: active.filter(s => s.source === 'inmobiliario').length,
            linkedin: active.filter(s => s.source === 'linkedin').length,
        },
        byTemperature: {
            Alto: active.filter(s => s.temperature === 'Alto').length,
            Medio: active.filter(s => s.temperature === 'Medio').length,
            Bajo: active.filter(s => s.temperature === 'Bajo').length,
        },
        recentSearches: searchRows.map(r => ({
            query: r.query as string,
            date: (r.created_at as Date).toISOString(),
            results: r.results_count as number,
        })),
    };
}

// ===== Settings =====

export async function getSettings(): Promise<RadarSettings> {
    await ensureDb();
    const sql = getDb();

    const rows = await sql`SELECT value FROM settings WHERE key = 'radar_config'`;
    if (rows.length === 0) {
        return getDefaultSettings();
    }
    return rows[0].value as unknown as RadarSettings;
}

export async function updateSettings(newSettings: Partial<RadarSettings>): Promise<RadarSettings> {
    await ensureDb();
    const sql = getDb();

    const current = await getSettings();
    const merged = { ...current, ...newSettings };

    await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('radar_config', ${JSON.stringify(merged)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(merged)}::jsonb, updated_at = NOW()
  `;

    return merged;
}

// ===== Helpers =====

function getDefaultSettings(): RadarSettings {
    return {
        borme: { enabled: true, keywords: ['disolución', 'concurso de acreedores', 'liquidación', 'cese de actividad', 'quiebra'] },
        traspasos: { enabled: true, keywords: ['traspaso por jubilación', 'venta de negocio', 'cierre por jubilación', 'venta de lote industrial', 'traspaso urgente'] },
        inmobiliario: { enabled: true, keywords: ['nave industrial en venta', 'polígono industrial', 'venta urgente nave', 'liquidación industrial', 'subasta nave'] },
        linkedin: { enabled: true, keywords: ['relevo generacional', 'cierre de etapa', 'conflicto societario', 'venta empresa', 'jubilación empresario', 'sucesión empresarial'] },
    };
}

function rowToSignal(row: Record<string, unknown>): ProcessedSignal {
    return {
        id: row.id as string,
        source: row.source as any,
        name: row.name as string,
        roleCompany: row.role_company as string,
        location: row.location as string,
        trigger: row.trigger_type as string,
        temperature: row.temperature as any,
        excerpt: row.excerpt as string,
        fullSource: row.full_source as string,
        sourceUrl: row.source_url as string | undefined,
        aiAnalysis: {
            intent: row.ai_intent as string,
            emotion: row.ai_emotion as string,
        },
        draftMessage: row.draft_message as string,
        date: row.date_label as string,
        status: row.status as any,
        createdAt: (row.created_at as Date)?.toISOString?.() || row.created_at as string,
        archivedAt: row.archived_at ? (row.archived_at as Date)?.toISOString?.() || row.archived_at as string : undefined,
    };
}
