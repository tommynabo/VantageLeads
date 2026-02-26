import type { VercelRequest, VercelResponse } from '@vercel/node';
import { archiveSignal, getArchivedSignals } from './_lib/store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // GET: list archived signals
    if (req.method === 'GET') {
        try {
            const archived = await getArchivedSignals();
            return res.status(200).json({ signals: archived, total: archived.length });
        } catch (error) {
            console.error('Archive list error:', error);
            return res.status(500).json({ error: 'Error fetching archive' });
        }
    }

    // POST: archive a signal
    if (req.method === 'POST') {
        try {
            const { signalId } = req.body || {};
            if (!signalId) {
                return res.status(400).json({ error: 'signalId is required' });
            }

            const archived = await archiveSignal(signalId);
            if (!archived) {
                return res.status(404).json({ error: 'Signal not found' });
            }

            return res.status(200).json({ success: true, signal: archived });
        } catch (error) {
            console.error('Archive error:', error);
            return res.status(500).json({ error: 'Error archiving signal' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
