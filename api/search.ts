import type { VercelRequest, VercelResponse } from '@vercel/node';
import { searchSignals } from './_lib/store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query } = req.body || {};
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const results = await searchSignals(query);
        return res.status(200).json({ results, total: results.length });
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ error: 'Error searching signals' });
    }
}
