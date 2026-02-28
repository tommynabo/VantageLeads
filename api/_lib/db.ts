import { neon } from '@neondatabase/serverless';

function getDbUrl(): string | null {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    return null;
  }
  return url;
}

export function getDb() {
  const url = getDbUrl();
  if (!url) return null;
  return neon(url);
}

// ===== Schema Initialization =====
export async function initializeDatabase(): Promise<void> {
  const sql = getDb();

  // Signals table
  await sql`
    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      name TEXT NOT NULL,
      role_company TEXT NOT NULL,
      location TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      temperature TEXT NOT NULL DEFAULT 'Medio',
      excerpt TEXT NOT NULL,
      full_source TEXT NOT NULL,
      source_url TEXT,
      ai_intent TEXT,
      ai_emotion TEXT,
      draft_message TEXT,
      date_label TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      archived_at TIMESTAMPTZ
    )
  `;

  // Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Insert a default admin user if none exists
  await sql`
    INSERT INTO users (email, password)
    VALUES ('admin@vantageleads.com', 'admin123')
    ON CONFLICT (email) DO NOTHING
  `;

  // Search history table
  await sql`
    CREATE TABLE IF NOT EXISTS search_history (
      id SERIAL PRIMARY KEY,
      query TEXT NOT NULL,
      results_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Settings table
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Insert default settings if not exists
  await sql`
    INSERT INTO settings (key, value)
    VALUES ('radar_config', ${JSON.stringify({
    borme: {
      enabled: true,
      keywords: ['disolución', 'concurso de acreedores', 'liquidación', 'cese de actividad', 'quiebra']
    },
    traspasos: {
      enabled: true,
      keywords: ['traspaso por jubilación', 'venta de negocio', 'cierre por jubilación', 'venta de lote industrial', 'traspaso urgente']
    },
    inmobiliario: {
      enabled: true,
      keywords: ['nave industrial en venta', 'polígono industrial', 'venta urgente nave', 'liquidación industrial', 'subasta nave']
    },
    linkedin: {
      enabled: true,
      keywords: ['relevo generacional', 'cierre de etapa', 'conflicto societario', 'venta empresa', 'jubilación empresario', 'sucesión empresarial']
    }
  })}::jsonb)
    ON CONFLICT (key) DO NOTHING
  `;
}
