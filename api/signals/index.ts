import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSignals } from '../_lib/store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { source, temperature, status } = req.query;
        const signals = await getSignals({
            source: source as string | undefined,
            temperature: temperature as string | undefined,
            status: status as any,
        });
        return res.status(200).json({ signals, total: signals.length });
    } catch (error) {
        console.error('Signals error:', error);
        return res.status(500).json({ error: 'Error fetching signals' });
    }
}
