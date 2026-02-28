import { VercelRequest, VercelResponse } from '@vercel/node';
import { resetDailyScrapes } from '../_lib/store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify CRON_SECRET to ensure only Vercel Cron or authorized agents can reset
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await resetDailyScrapes();
        return res.status(200).json({ success: true, message: 'Daily scrape counter reset to 0' });
    } catch (error) {
        console.error('Reset cron error:', error);
        return res.status(500).json({ error: 'Error resetting counter' });
    }
}
