import { RawSignal, RadarModule } from '../types.js';

/**
 * LinkedIn Intent Radar — Scans LinkedIn posts for intent keywords.
 * 
 * This radar looks for POSTS (not profiles), searching for "pain keywords"
 * that indicate someone is going through a business transition:
 * - "relevo generacional"
 * - "cierre de etapa"
 * - "conflicto societario"
 * - "venta de empresa"
 * - "jubilación empresario"
 * 
 * In production, this would use:
 * - LinkedIn API (with proper OAuth)
 * - Apify LinkedIn scraper actors
 * - PhantomBuster LinkedIn post scraper
 * 
 * Currently uses curated realistic data simulating LinkedIn post content.
 */

const SAMPLE_LINKEDIN_DATA: RawSignal[] = [
    {
        source: 'linkedin',
        name: 'Carlos Mendoza',
        roleCompany: 'CEO & Fundador, Industrias Mendoza S.A.',
        location: 'Barcelona',
        trigger: 'Relevo Generacional',
        excerpt: 'Después de 30 años al pie del cañón, empiezo a pensar en dar un paso al lado y disfrutar de la familia...',
        fullSource: 'Hoy celebramos el 30 aniversario de Industrias Mendoza. Ha sido un viaje increíble desde aquel pequeño taller en Poblenou hasta lo que somos hoy. Sin embargo, después de 30 años al pie del cañón, empiezo a pensar en dar un paso al lado y disfrutar de la familia. El futuro de la empresa es brillante, pero requiere nueva energía. ¿Alguien más se ha encontrado en esta encrucijada? #emprendimiento #relevogeneracional #30años',
        sourceUrl: 'https://linkedin.com/posts/carlosmendoza-30aniversario',
        scrapedAt: new Date().toISOString(),
    },
    {
        source: 'linkedin',
        name: 'Patricia Navarro',
        roleCompany: 'Directora General, Grupo Hotelero Costa Brava',
        location: 'Girona',
        trigger: 'Cierre de Etapa',
        excerpt: 'Cierro una etapa de 20 años al frente de nuestros hoteles. Es momento de buscar quien lleve el legado al siguiente nivel.',
        fullSource: 'Querida red, hoy quiero compartir algo personal. Tras 20 años liderando el Grupo Hotelero Costa Brava, he decidido que este será mi último verano al frente. No es una decisión fácil — cada hotel, cada equipo, cada cliente tiene un pedacito de mi corazón. Pero sé que para crecer, a veces hay que saber dar un paso atrás. Estamos buscando un perfil que comparta nuestra visión de hospitalidad sostenible y que pueda llevar estos 4 hoteles boutique al siguiente nivel. Si conocéis a alguien o queréis hablar, mi buzón está abierto. #hospitalidad #cierredeetapa #nuevocomienzo',
        sourceUrl: 'https://linkedin.com/posts/patricianavarro-cierredeetapa',
        scrapedAt: new Date().toISOString(),
    },
    {
        source: 'linkedin',
        name: 'Javier y Eduardo Roca',
        roleCompany: 'Socios Fundadores, Laboratorios Roca Hermanos',
        location: 'Valencia',
        trigger: 'Conflicto Societario',
        excerpt: 'Cuando dos hermanos tienen visiones opuestas sobre el futuro de la empresa familiar que crearon juntos...',
        fullSource: 'Reflexión que quizás le sirva a alguien: cuando dos hermanos tienen visiones opuestas sobre el futuro de la empresa familiar que crearon juntos, ¿qué opciones quedan? Llevamos 6 meses en un punto muerto con mi hermano Eduardo. Yo quiero internacionalizar, él quiere consolidar. Ninguno de los dos está equivocado, simplemente tenemos caminos diferentes. ¿Alguien ha pasado por un proceso de separación societaria entre hermanos? ¿Mediación? ¿División? Necesito perspectivas reales, no teoría de libro. Gracias de antemano. #empresafamiliar #conflictosocietario #hermanos #ayuda',
        sourceUrl: 'https://linkedin.com/posts/javierroca-conflicto',
        scrapedAt: new Date().toISOString(),
    },
    {
        source: 'linkedin',
        name: 'Elena Navarro',
        roleCompany: 'Propietaria, Grupo Hotelero Navarro',
        location: 'Málaga',
        trigger: 'Jubilación',
        excerpt: 'Con la temporada de verano llegando a su fin, reflexiono sobre mis 40 años en el sector. Es hora de pensar en el próximo capítulo.',
        fullSource: 'Con la temporada de verano llegando a su fin, reflexiono sobre mis 40 años en el sector hotelero. Hemos construido algo hermoso en la Costa del Sol, pero la gestión diaria exige un ritmo que ya no deseo mantener. Es hora de pensar en el próximo capítulo y buscar quién pueda llevar nuestros hoteles al siguiente nivel. Si alguien tiene experiencia en procesos de traspaso hotelero, me encantaría escucharos. #hotelería #jubilación #costadelsol #traspaso',
        sourceUrl: 'https://linkedin.com/posts/elenanavarro-jubilacion',
        scrapedAt: new Date().toISOString(),
    },
    {
        source: 'linkedin',
        name: 'Roberto Iglesias',
        roleCompany: 'Fundador, TechForge Solutions S.L.',
        location: 'Madrid',
        trigger: 'Venta de Empresa',
        excerpt: 'Tras recibir varias ofertas de adquisición, estamos valorando dar el paso. 15 años construyendo algo que ahora otros quieren comprar.',
        fullSource: 'Momento de sinceridad con mi red: TechForge ha recibido varias ofertas de adquisición en los últimos meses. Después de 15 años construyendo esta empresa desde cero — desde un garaje en Tres Cantos hasta 85 empleados y clientes en 6 países — estamos valorando seriamente dar el paso. No es por necesidad económica, es por visión estratégica. Un grupo más grande podría llevar nuestra tecnología de IA aplicada a la industria mucho más lejos de lo que nosotros podemos solos. Pero el proceso es abrumador: due diligence, valoraciones, earn-outs... Si algún fundador ha pasado por un M&A, me vendría genial tomar un café y que me cuente los errores que no debería cometer. #startup #M&A #fundadores #venta',
        sourceUrl: 'https://linkedin.com/posts/robertoiglesias-venta',
        scrapedAt: new Date().toISOString(),
    },
];

export const linkedinRadar: RadarModule = {
    async scan(keywords?: string[]): Promise<RawSignal[]> {
        // In production: use LinkedIn API or Apify LinkedIn scraper
        const results = [...SAMPLE_LINKEDIN_DATA];

        // For simulation purposes, we always return the curated data
        return results.map(r => ({ ...r, scrapedAt: new Date().toISOString() }));
    }
};
