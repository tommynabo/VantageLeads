import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSettings, updateSettings } from './_lib/store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // GET: return current settings
    if (req.method === 'GET') {
        try {
            const settings = await getSettings();
            return res.status(200).json(settings);
        } catch (error) {
            console.error('Settings GET error:', error);
            return res.status(500).json({ error: 'Error fetching settings' });
        }
    }

    // POST: update settings
    if (req.method === 'POST') {
        try {
            const newSettings = req.body;
            if (!newSettings || typeof newSettings !== 'object') {
                return res.status(400).json({ error: 'Settings object is required' });
            }

            const updated = await updateSettings(newSettings);
            return res.status(200).json({ success: true, settings: updated });
        } catch (error) {
            console.error('Settings POST error:', error);
            return res.status(500).json({ error: 'Error updating settings' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
