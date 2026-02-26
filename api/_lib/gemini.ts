import OpenAI from 'openai';
import { RawSignal, ProcessedSignal, Temperature } from './types';

function getClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    return new OpenAI({ apiKey });
}

// ===== Filter: Is this noise or real intent? =====
export async function filterSignal(raw: RawSignal): Promise<boolean> {
    const client = getClient();

    const prompt = `Eres un analista de inteligencia comercial especializado en detectar señales de intención de compra/venta/transición empresarial.

Analiza el siguiente texto y determina si contiene una SEÑAL REAL de transición empresarial (alguien que realmente está pasando por una disolución, venta, jubilación, relevo generacional, conflicto societario, etc.) o si es simplemente RUIDO (alguien hablando del tema de forma teórica, compartiendo artículos, opinando sin estar involucrado directamente).

TEXTO: "${raw.fullSource}"
NOMBRE: ${raw.name}
EMPRESA: ${raw.roleCompany}
TRIGGER DETECTADO: ${raw.trigger}

Responde SOLO con un JSON válido:
{"isReal": true/false, "confidence": 0.0-1.0, "reason": "explicación breve"}`;

    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 200,
        });

        const text = response.choices[0]?.message?.content || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return true;

        const result = JSON.parse(jsonMatch[0]);
        return result.isReal === true && result.confidence >= 0.5;
    } catch (error) {
        console.error('Filter error:', error);
        return true; // On error, keep the signal
    }
}

// ===== Analyze: Extract intent, emotion, temperature =====
export async function analyzeSignal(raw: RawSignal): Promise<{
    intent: string;
    emotion: string;
    temperature: Temperature;
}> {
    const client = getClient();

    const prompt = `Eres un analista de inteligencia comercial de alto nivel. Tu cliente vende servicios de mediación, compra-venta de empresas y gestión de patrimonios.

Analiza la siguiente señal de un prospecto y extrae:
1. INTENCIÓN DE COMPRA: ¿Qué necesita exactamente esta persona? ¿Mediación? ¿Vender su empresa? ¿Gestión patrimonial? ¿Sucesión?
2. ESTADO EMOCIONAL: ¿Cómo se siente? ¿Desesperado, tranquilo, nostálgico, agobiado, decidido?
3. TEMPERATURA: Alto (necesidad urgente/clara), Medio (explorando opciones), Bajo (intención difusa)

TEXTO FUENTE: "${raw.fullSource}"
NOMBRE: ${raw.name}
EMPRESA: ${raw.roleCompany}
TRIGGER: ${raw.trigger}
UBICACIÓN: ${raw.location}

Responde SOLO con un JSON válido (en español):
{"intent": "descripción de la intención detectada", "emotion": "descripción del estado emocional", "temperature": "Alto|Medio|Bajo"}`;

    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4,
            max_tokens: 300,
        });

        const text = response.choices[0]?.message?.content || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return {
                intent: 'Intención por determinar — análisis pendiente.',
                emotion: 'No determinado.',
                temperature: 'Medio'
            };
        }

        const result = JSON.parse(jsonMatch[0]);
        const validTemps: Temperature[] = ['Alto', 'Medio', 'Bajo'];
        return {
            intent: result.intent || 'Intención por determinar.',
            emotion: result.emotion || 'No determinado.',
            temperature: validTemps.includes(result.temperature) ? result.temperature : 'Medio'
        };
    } catch (error) {
        console.error('Analysis error:', error);
        return {
            intent: 'Error al analizar la señal.',
            emotion: 'No determinado.',
            temperature: 'Medio'
        };
    }
}

// ===== Generate Draft Message =====
export async function generateDraftMessage(signal: {
    name: string;
    roleCompany: string;
    trigger: string;
    location: string;
    fullSource: string;
    aiAnalysis: { intent: string; emotion: string };
}): Promise<string> {
    const client = getClient();

    const systemPrompt = `Eres un experto en copywriting para LinkedIn especializado en mensajes de primer contacto B2B de alto valor. Tu cliente ofrece servicios de mediación, compra-venta de empresas y gestión de patrimonios.

REGLAS ESTRICTAS:
- NO vendas nada en el primer mensaje
- Haz referencia EXACTA a la situación del prospecto (lo que ha publicado o lo que sabes de su situación)
- Sé empático, humano y genuino
- Máximo 4-5 frases
- Usa la situación como "rompehielos" natural
- El objetivo es abrir una conversación, NO cerrar una venta
- Tutea o usa usted según el contexto (empresarios senior = usted)`;

    const userPrompt = `DATOS DEL PROSPECTO:
- Nombre: ${signal.name}
- Cargo/Empresa: ${signal.roleCompany}
- Trigger: ${signal.trigger}
- Ubicación: ${signal.location}
- Lo que ha dicho/publicado: "${signal.fullSource}"
- Intención detectada: ${signal.aiAnalysis.intent}
- Estado emocional: ${signal.aiAnalysis.emotion}

Escribe SOLO el mensaje de LinkedIn (sin comillas, sin explicaciones, sin "Asunto:"). Empieza directamente con el saludo.`;

    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 400,
        });

        return response.choices[0]?.message?.content?.trim() || 'Error al generar el mensaje. Inténtalo de nuevo.';
    } catch (error) {
        console.error('Draft message error:', error);
        return 'Error al generar el mensaje. Verifica tu API key de OpenAI.';
    }
}

// ===== Regenerate with different angle =====
export async function regenerateMessage(signal: {
    name: string;
    roleCompany: string;
    trigger: string;
    location: string;
    fullSource: string;
    aiAnalysis: { intent: string; emotion: string };
    draftMessage: string;
}, angle?: string): Promise<string> {
    const client = getClient();

    const systemPrompt = `Eres un experto en copywriting para LinkedIn. Necesitas crear un mensaje COMPLETAMENTE NUEVO y DIFERENTE al anterior. Cambia el ángulo, el gancho, y la estructura.

REGLAS:
- NO vendas nada
- Referencia la situación EXACTA del prospecto
- Sé empático, humano y genuino
- Máximo 4-5 frases
- Nuevo ángulo/gancho diferente al anterior`;

    const userPrompt = `MENSAJE ANTERIOR (NO repetir este enfoque):
"${signal.draftMessage}"

${angle ? `ÁNGULO SOLICITADO: ${angle}` : 'Usa un ángulo completamente diferente: si el anterior era emotivo, sé más directo. Si era directo, sé más empático. Cambia la estructura y el gancho.'}

DATOS:
- Nombre: ${signal.name}
- Cargo/Empresa: ${signal.roleCompany}
- Trigger: ${signal.trigger}
- Situación: "${signal.fullSource}"
- Intención: ${signal.aiAnalysis.intent}
- Emoción: ${signal.aiAnalysis.emotion}

Escribe SOLO el nuevo mensaje. Sin comillas ni explicaciones.`;

    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.9,
            max_tokens: 400,
        });

        return response.choices[0]?.message?.content?.trim() || 'Error al regenerar el mensaje.';
    } catch (error) {
        console.error('Regenerate error:', error);
        return 'Error al regenerar el mensaje. Verifica tu API key de OpenAI.';
    }
}

// ===== Process a raw signal through the full pipeline =====
export async function processRawSignal(raw: RawSignal, id: string): Promise<ProcessedSignal | null> {
    // Step 1: Filter (is this real intent?)
    const isReal = await filterSignal(raw);
    if (!isReal) return null;

    // Step 2: Analyze (intent, emotion, temperature)
    const analysis = await analyzeSignal(raw);

    // Step 3: Generate draft message
    const partialSignal = {
        name: raw.name,
        roleCompany: raw.roleCompany,
        trigger: raw.trigger,
        location: raw.location,
        fullSource: raw.fullSource,
        aiAnalysis: { intent: analysis.intent, emotion: analysis.emotion },
    };
    const draftMessage = await generateDraftMessage(partialSignal);

    // Build processed signal
    const now = new Date();
    const processed: ProcessedSignal = {
        id,
        source: raw.source,
        name: raw.name,
        roleCompany: raw.roleCompany,
        location: raw.location,
        trigger: raw.trigger,
        temperature: analysis.temperature,
        excerpt: raw.excerpt,
        fullSource: raw.fullSource,
        sourceUrl: raw.sourceUrl,
        aiAnalysis: {
            intent: analysis.intent,
            emotion: analysis.emotion,
        },
        draftMessage,
        date: formatRelativeDate(now),
        status: 'new',
        createdAt: now.toISOString(),
    };

    return processed;
}

function formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES');
}
