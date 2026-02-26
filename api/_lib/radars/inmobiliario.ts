import { RawSignal, RadarModule } from '../types.js';

/**
 * Inmobiliario Radar — Tracks industrial property sales.
 * 
 * Rationale: When a company goes bankrupt or restructures, 
 * one of the first things they do is sell their industrial property 
 * (warehouses, factories). This is a leading indicator of transition.
 * 
 * Target portals in production:
 * - Idealista (naves industriales)
 * - Fotocasa (industrial)
 * - CaixaBank Inmobiliario
 * - Portales de subastas judiciales (subastas.boe.es)
 */

const SAMPLE_INMOBILIARIO_DATA: RawSignal[] = [
    {
        source: 'inmobiliario',
        name: 'Propietario No Identificado',
        roleCompany: 'Antigua Fábrica Textil S.A.',
        location: 'Sabadell, Barcelona',
        trigger: 'Venta Nave Industrial',
        excerpt: 'Nave industrial de 8.000m² en Sabadell a precio de liquidación. Antigua fábrica textil que cesó actividad en 2024.',
        fullSource: 'VENTA URGENTE NAVE INDUSTRIAL — Sabadell, Barcelona. Superficie: 8.000m² construidos sobre parcela de 12.000m². Antigua fábrica textil que cesó su actividad en diciembre 2024 tras 60 años de operación. Características: techos altos (12m), 3 puentes grúa, zona de oficinas de 400m², parking para 40 vehículos, muelles de carga. Suministros industriales instalados (electricidad trifásica 400kW). Precio: 2.800.000€ (valoración catastral: 4.100.000€ — se acepta 68% para venta rápida). Posibilidad de alquiler con opción a compra. Contacto inmobiliaria: ref. NAV-2025-0892.',
        sourceUrl: 'https://example.com/nave/sabadell-8000m2',
        scrapedAt: new Date().toISOString(),
    },
    {
        source: 'inmobiliario',
        name: 'Familia Ortega',
        roleCompany: 'Ortega Packaging S.L. (en liquidación)',
        location: 'Getafe, Madrid',
        trigger: 'Subasta Judicial',
        excerpt: 'Subasta judicial de complejo industrial de empresa de embalajes. Deuda bancaria provocó la ejecución hipotecaria.',
        fullSource: 'SUBASTA JUDICIAL — Portal de Subastas del BOE. Bien: Complejo industrial en Polígono Los Ángeles, Getafe. Propiedad de Ortega Packaging S.L. (en liquidación). Superficie: 4.500m² sobre parcela de 6.000m². Incluye nave de producción, almacén y oficinas. Maquinaria de embalaje industrial incluida en el lote. Valor de tasación: 3.200.000€. Puja mínima: 1.600.000€ (50%). Motivo: ejecución hipotecaria por deuda bancaria. La empresa familiar operó durante 30 años en el sector del packaging industrial. Plazo de pujas: 20 días desde publicación.',
        sourceUrl: 'https://subastas.boe.es/detalleSubasta.php?ref=2025-xxxx',
        scrapedAt: new Date().toISOString(),
    },
    {
        source: 'inmobiliario',
        name: 'Grupo Marín',
        roleCompany: 'Director General, Logística Marín S.A.',
        location: 'Valencia',
        trigger: 'Reestructuración / Venta de Activo',
        excerpt: 'Centro logístico de 20.000m² en Valencia puesto a la venta por reestructuración del grupo empresarial.',
        fullSource: 'VENTA CENTRO LOGÍSTICO PREMIUM — Puerto de Valencia, zona ZAL. Nave logística clase A de 20.000m² en propiedad de Logística Marín S.A. La venta forma parte de un plan de reestructuración del grupo empresarial para reducir deuda y concentrar operaciones. El grupo Marín, tercera generación familiar, opera en 4 provincias pero planea reducir a 2. Características: cross-docking, 30 muelles de carga, cámaras frigoríficas (2.000m²), sistema WMS automatizado. Contrato de alquiler garantizado (sale & leaseback) disponible. Precio orientativo: 15M€. Consultas confidenciales.',
        sourceUrl: 'https://example.com/nave/valencia-logistica-20000m2',
        scrapedAt: new Date().toISOString(),
    },
];

export const inmobiliarioRadar: RadarModule = {
    async scan(keywords?: string[], targetCount?: number): Promise<RawSignal[]> {
        // In production: scrape Idealista, BOE subastas, etc.
        let results = [...SAMPLE_INMOBILIARIO_DATA];
        if (targetCount !== undefined && targetCount > 0) {
            results = results.slice(0, targetCount);
        }

        // For simulation purposes, we always return the curated data
        return results.map(r => ({ ...r, scrapedAt: new Date().toISOString() }));
    }
};
