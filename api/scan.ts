import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bormeRadar } from './_lib/radars/borme.js';
import { traspasosRadar } from './_lib/radars/traspasos.js';
import { inmobiliarioRadar } from './_lib/radars/inmobiliario.js';
import { linkedinRadar } from './_lib/radars/linkedin.js';
import { processRawSignal } from './_lib/gemini.js';
import { addSignals, getSettings, incrementDailyScrapes } from './_lib/store.js';
import type { RadarSource, ScanRequest, ScanResponse, RawSignal } from './_lib/types.js';

const RADARS = {
    borme: bormeRadar,
    traspasos: traspasosRadar,
    inmobiliario: inmobiliarioRadar,
    linkedin: linkedinRadar,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body: ScanRequest = req.body || {};
        const settings = await getSettings();

        // Determine which radars to scan
        const radarsToScan: RadarSource[] = body.radars && body.radars.length > 0
            ? body.radars.filter(r => settings[r]?.enabled !== false)
            : (Object.keys(RADARS) as RadarSource[]).filter(r => settings[r]?.enabled !== false);

        let remainingTargetCount = body.targetCount;

        // Collect raw signals from all selected radars
        const allRawSignals: RawSignal[] = [];
        for (const radarName of radarsToScan) {
            if (remainingTargetCount !== undefined && remainingTargetCount <= 0) {
                break;
            }

            const radar = RADARS[radarName];
            const keywords = body.keywords || settings[radarName]?.keywords || [];
            try {
                const raw = await radar.scan(keywords, remainingTargetCount);
                allRawSignals.push(...raw);

                if (remainingTargetCount !== undefined) {
                    remainingTargetCount -= raw.length;
                }
            } catch (err) {
                console.error(`Radar ${radarName} error:`, err);
            }
        }

        // Process through AI cognitive layer
        const processedSignals = [];
        for (const raw of allRawSignals) {
            const id = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            try {
                const processed = await processRawSignal(raw, id);
                if (processed) {
                    processedSignals.push(processed);
                }
            } catch (err) {
                console.error('Processing error:', err);
            }
        }

        // Store the processed signals and record usage
        if (processedSignals.length > 0) {
            await addSignals(processedSignals);
            await incrementDailyScrapes(processedSignals.length);
        }

        const response: ScanResponse = {
            success: true,
            signalsFound: allRawSignals.length,
            signalsProcessed: processedSignals.length,
            signals: processedSignals,
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error('Scan error:', error);
        return res.status(500).json({
            error: 'Error during scan',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
