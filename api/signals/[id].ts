import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSignal } from '../_lib/store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Signal ID is required' });
        }

        const signal = await getSignal(id);
        if (!signal) {
            return res.status(404).json({ error: 'Signal not found' });
        }

        return res.status(200).json({ signal });
    } catch (error) {
        console.error('Signal detail error:', error);
        return res.status(500).json({ error: 'Error fetching signal', details: error instanceof Error ? error.message : String(error) });
    }
}
