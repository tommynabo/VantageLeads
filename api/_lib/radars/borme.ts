import { RawSignal, RadarModule } from '../types';

/**
 * BORME Radar — Parses BOE.es for business dissolution/liquidation notices.
 * 
 * In production, this would fetch the daily BORME XML feed from:
 * https://www.boe.es/datosabiertos/vocabularios/doc/nomenclatura-actos-registrales/
 * 
 * Currently uses Gemini-powered simulation for realistic data generation
 * since the BOE XML feed requires complex parsing and changes format frequently.
 */

const BORME_TRIGGERS = [
    'Disolución',
    'Concurso de Acreedores',
    'Liquidación',
    'Cese de Actividad',
    'Quiebra Voluntaria',
    'Extinción de Sociedad',
];

const SAMPLE_BORME_DATA: RawSignal[] = [
    {
        source: 'borme',
        name: 'Miguel Ángel Serrano',
        roleCompany: 'Administrador Único, Serrano Logística S.L.',
        location: 'Madrid',
        trigger: 'Disolución',
        excerpt: 'Publicada disolución voluntaria de Serrano Logística S.L. en el BORME. La empresa facturaba 8M€ anuales en transporte frigorífico.',
        fullSource: 'BORME núm. 45/2025 — Actos inscritos: SERRANO LOGÍSTICA S.L. (CIF: B-12345678). Domicilio social: Calle Alcalá 200, Madrid. Objeto social: Transporte de mercancías refrigeradas. DISOLUCIÓN VOLUNTARIA acordada en Junta General Extraordinaria de fecha 15/02/2025. Nombramiento de liquidador: D. Miguel Ángel Serrano García, DNI 50.XXX.XXX-Y. La sociedad pasa a denominarse "Serrano Logística S.L. en liquidación".',
        sourceUrl: 'https://www.boe.es/borme/dias/2025/02/20/',
        scrapedAt: new Date().toISOString(),
    },
    {
        source: 'borme',
        name: 'Familia Gutiérrez-Blanco',
        roleCompany: 'Socios, Manufacturas Gutiérrez S.A.',
        location: 'Bilbao',
        trigger: 'Concurso de Acreedores',
        excerpt: 'Manufacturas Gutiérrez S.A. ha entrado en concurso de acreedores voluntario. Historial de 50 años en el sector metalúrgico.',
        fullSource: 'BORME núm. 47/2025 — MANUFACTURAS GUTIÉRREZ S.A. (CIF: A-48XXXXXX). Domicilio: Polígono Industrial Arasur, Bilbao. DECLARACIÓN DE CONCURSO VOLUNTARIO. Auto del Juzgado de lo Mercantil nº2 de Bilbao de fecha 18/02/2025. Administrador concursal designado: Deloitte Reestructuración S.L. La empresa cuenta con 120 empleados y una deuda declarada de 12M€. Activos principales: nave industrial de 15.000m² y maquinaria especializada.',
        sourceUrl: 'https://www.boe.es/borme/dias/2025/02/22/',
        scrapedAt: new Date().toISOString(),
    },
    {
        source: 'borme',
        name: 'Rosa María Castillo',
        roleCompany: 'Fundadora y CEO, Castillo Alimentación S.L.',
        location: 'Sevilla',
        trigger: 'Liquidación',
        excerpt: 'Castillo Alimentación S.L. inicia proceso de liquidación tras 35 años en el sector agroalimentario andaluz.',
        fullSource: 'BORME núm. 50/2025 — CASTILLO ALIMENTACIÓN S.L. (CIF: B-41XXXXXX). Domicilio: Parque Empresarial Torneo, Sevilla. LIQUIDACIÓN. Inscripción de escritura de disolución y apertura del periodo de liquidación. Liquidadora: Dña. Rosa María Castillo López. La sociedad, fundada en 1990, era referente en distribución de productos gourmet andaluces con presencia en 8 comunidades autónomas. Facturación último ejercicio: 4.2M€.',
        sourceUrl: 'https://www.boe.es/borme/dias/2025/02/25/',
        scrapedAt: new Date().toISOString(),
    },
];

export const bormeRadar: RadarModule = {
    async scan(keywords?: string[]): Promise<RawSignal[]> {
        // In production: fetch from BOE.es XML API
        // const response = await fetch('https://www.boe.es/datosabiertos/api/borme/...');
        // For now, return curated realistic data

        let results = [...SAMPLE_BORME_DATA];

        // Filter by keywords if provided
        if (keywords && keywords.length > 0) {
            const kws = keywords.map(k => k.toLowerCase());
            results = results.filter(signal =>
                kws.some(kw =>
                    signal.trigger.toLowerCase().includes(kw) ||
                    signal.fullSource.toLowerCase().includes(kw) ||
                    signal.excerpt.toLowerCase().includes(kw)
                )
            );
        }

        // Update scrapedAt to now
        return results.map(r => ({ ...r, scrapedAt: new Date().toISOString() }));
    }
};
