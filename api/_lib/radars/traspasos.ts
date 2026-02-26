import { RawSignal, RadarModule } from '../types';

/**
 * Traspasos Radar — Scrapes business transfer/sale portals.
 * 
 * Target portals in production:
 * - Milanuncios (traspasos de negocios)
 * - Vibbo / Wallapop Business
 * - Companias.com
 * - BizBuySell Spain
 * 
 * Currently uses curated realistic data that simulates real portal results.
 */

const SAMPLE_TRASPASOS_DATA: RawSignal[] = [
    {
        source: 'traspasos',
        name: 'Antonio Ruiz',
        roleCompany: 'Propietario, Taller Mecánico AutoRuiz',
        location: 'Zaragoza',
        trigger: 'Traspaso por Jubilación',
        excerpt: 'Se traspasa taller mecánico de 40 años de antigüedad por jubilación del propietario. Cartera de 800 clientes fijos.',
        fullSource: 'TRASPASO TALLER MECÁNICO EN ZARAGOZA — Motivo: jubilación del propietario tras 40 años de actividad. Taller de 350m² con 4 elevadores, equipamiento completo y cabina de pintura. Cartera de 800 clientes fijos con facturación recurrente. Facturación media anual: 450.000€. Personal: 3 empleados formados que desean continuar. Ubicación premium en Delicias con alto tráfico. El propietario ofrece periodo de transición de 6 meses. Precio negociable para comprador serio. Contacto: Antonio Ruiz.',
        sourceUrl: 'https://example.com/traspaso/taller-zaragoza',
        scrapedAt: new Date().toISOString(),
    },
    {
        source: 'traspasos',
        name: 'Carmen López',
        roleCompany: 'Dueña, Restaurante La Encina',
        location: 'Toledo',
        trigger: 'Venta de Negocio',
        excerpt: 'Venta urgente de restaurante con estrella Michelin por problemas de salud. Localización privilegiada en casco histórico.',
        fullSource: 'VENTA RESTAURANTE CON ESTRELLA MICHELIN — Toledo casco histórico. Restaurante "La Encina" con 25 años de historia y reconocimiento gastronómico. Motivo de venta: problemas de salud de la propietaria que impiden continuar con la gestión diaria. Local de 200m² con terraza de 80m². Capacidad 60 comensales. Cocina industrial equipada valorada en 180.000€. Marca consolidada con presencia en guías gastronómicas. Facturación 2024: 1.2M€. Incluye licencias, marca registrada y recetario. Se valorará comprador que respete la filosofía del restaurante. Carmen López.',
        sourceUrl: 'https://example.com/traspaso/restaurante-toledo',
        scrapedAt: new Date().toISOString(),
    },
    {
        source: 'traspasos',
        name: 'Hermanos Ferrer',
        roleCompany: 'Socios, Distribuidora Ferrer e Hijos',
        location: 'Alicante',
        trigger: 'Venta de lote industrial',
        excerpt: 'Se vende distribuidora de materiales de construcción completa. Los socios no llegan a acuerdo sobre el futuro de la empresa.',
        fullSource: 'VENTA EMPRESA DE DISTRIBUCIÓN — Distribuidora Ferrer e Hijos, Alicante. Empresa familiar de segunda generación especializada en materiales de construcción. Motivo: desacuerdo entre los tres hermanos socios sobre la dirección estratégica. Disponen de: 2 naves industriales (2.500m² total), flota de 8 camiones, cartera de 200 clientes profesionales en toda la provincia de Alicante. Stock valorado en 600.000€. Facturación 2024: 3.8M€. Se vende como lote completo. Los socios prefieren venta rápida y discreta. Intermediarios abstenerse.',
        sourceUrl: 'https://example.com/traspaso/distribuidora-alicante',
        scrapedAt: new Date().toISOString(),
    },
];

export const traspasosRadar: RadarModule = {
    async scan(keywords?: string[]): Promise<RawSignal[]> {
        // In production: scrape Milanuncios, Vibbo, etc. via Apify or Puppeteer
        let results = [...SAMPLE_TRASPASOS_DATA];

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

        return results.map(r => ({ ...r, scrapedAt: new Date().toISOString() }));
    }
};
