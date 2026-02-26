import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSignal, updateSignal } from './_lib/store';
import { regenerateMessage } from './_lib/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { signalId, angle } = req.body || {};
        if (!signalId) {
            return res.status(400).json({ error: 'signalId is required' });
        }

        const signal = await getSignal(signalId);
        if (!signal) {
            return res.status(404).json({ error: 'Signal not found' });
        }

        const newMessage = await regenerateMessage(signal, angle);
        const updated = await updateSignal(signalId, { draftMessage: newMessage });

        return res.status(200).json({
            success: true,
            draftMessage: newMessage,
            signal: updated,
        });
    } catch (error) {
        console.error('Regenerate error:', error);
        return res.status(500).json({ error: 'Error regenerating message' });
    }
}
