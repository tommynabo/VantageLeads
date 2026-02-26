import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSignal, updateSignal } from './_lib/store.js';
import { analyzeSignal, generateDraftMessage } from './_lib/gemini.js';
import type { RawSignal } from './_lib/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { signalId } = req.body || {};
        if (!signalId) {
            return res.status(400).json({ error: 'signalId is required' });
        }

        const signal = await getSignal(signalId);
        if (!signal) {
            return res.status(404).json({ error: 'Signal not found' });
        }

        // Re-analyze through AI
        const rawForAnalysis: RawSignal = {
            source: signal.source,
            name: signal.name,
            roleCompany: signal.roleCompany,
            location: signal.location,
            trigger: signal.trigger,
            excerpt: signal.excerpt,
            fullSource: signal.fullSource,
            scrapedAt: signal.createdAt,
        };

        const analysis = await analyzeSignal(rawForAnalysis);
        const newMessage = await generateDraftMessage({
            ...signal,
            aiAnalysis: { intent: analysis.intent, emotion: analysis.emotion },
        });

        const updated = await updateSignal(signalId, {
            aiAnalysis: { intent: analysis.intent, emotion: analysis.emotion },
            temperature: analysis.temperature,
            draftMessage: newMessage,
        });

        return res.status(200).json({ success: true, signal: updated });
    } catch (error) {
        console.error('Analyze error:', error);
        return res.status(500).json({ error: 'Error analyzing signal', details: error instanceof Error ? error.message : String(error) });
    }
}
