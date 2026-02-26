import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStats } from './_lib/store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const stats = await getStats();
        return res.status(200).json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        return res.status(500).json({ error: 'Error fetching stats', details: error instanceof Error ? error.message : String(error) });
    }
}
