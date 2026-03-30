// ── CARGAR_DATOS.JS ── DashboardBecas ─────────────────────────────────────────
// Carga data_a.json y data_b.json (JSON Lines) en paralelo, los fusiona
// por índice de fila y dispara el evento global 'datosListos'.
// (data_dashboard.json fue dividido para cumplir el límite de 100 MB de GitHub)

async function cargarDatos() {
    document.querySelectorAll('.chart-container').forEach(el => el.classList.add('loading'));

    try {
        const [respA, respB] = await Promise.all([
            fetch('./data_a.json'),
            fetch('./data_b.json'),
        ]);
        if (!respA.ok) throw new Error(`HTTP ${respA.status}: data_a.json`);
        if (!respB.ok) throw new Error(`HTTP ${respB.status}: data_b.json`);

        const [textA, textB] = await Promise.all([respA.text(), respB.text()]);

        // JSON Lines: una línea = un registro
        // NaN no es JSON válido (Python/pandas lo escribe literal); se reemplaza por null
        const parseLines = text => text
            .trim()
            .split('\n')
            .filter(l => l.trim().length > 0)
            .map(l => JSON.parse(l.replace(/:\s*NaN\b/g, ': null')));

        const dataA = parseLines(textA);
        const dataB = parseLines(textB);

        // Fusionar ambos archivos registro a registro
        const data = dataA.map((a, i) => ({ ...a, ...dataB[i] }));

        // Asegurar tipos numéricos
        data.forEach(d => {
            d.IMPORTE            = Number(d.IMPORTE)            || 0;
            d.EDAD               = Number(d.EDAD)               || 0;
            d.EDAD_TUTOR         = Number(d.EDAD_TUTOR)         || 0;
            d.GRADO              = Number(d.GRADO)              || 0;
            d.NUM_BECAS          = Number(d.NUM_BECAS)          || 1;
            d.AÑO                = String(d.AÑO                 || '');
            d.SECCION_ELECTORAL  = d.SECCION_ELECTORAL  != null ? Number(d.SECCION_ELECTORAL)  : null;
            d.DISTRITO_FEDERAL   = d.DISTRITO_FEDERAL   != null ? Number(d.DISTRITO_FEDERAL)   : null;
            d.DISTRITO_LOCAL     = d.DISTRITO_LOCAL     != null ? Number(d.DISTRITO_LOCAL)      : null;
            d.LATITUD            = d.LATITUD     != null ? Number(d.LATITUD)     : null;
            d.LONGITUD           = d.LONGITUD    != null ? Number(d.LONGITUD)    : null;
            d.LAT_ESCUELA        = d.LAT_ESCUELA != null ? Number(d.LAT_ESCUELA) : null;
            d.LONG_ESCUELA       = d.LONG_ESCUELA!= null ? Number(d.LONG_ESCUELA): null;

            // Asegurar que los campos de agregación sean arrays
            if (!Array.isArray(d.AÑOS))     d.AÑOS     = d.AÑO     ? [Number(d.AÑO)]  : [];
            if (!Array.isArray(d.PERIODOS)) d.PERIODOS = [];
            if (!Array.isArray(d.BECAS))    d.BECAS    = [];

            // Periodo representativo (beca más reciente) para compatibilidad con gráficas
            const etapaCode =
                d.ETAPA === '1RA ETAPA'      ? 'E1' :
                d.ETAPA === '2DA ETAPA'      ? 'E2' : 'EX';
            d.PERIODO = d.AÑO + '-' + etapaCode;

            // Si PERIODOS vino vacío, inferirlo del PERIODO representativo
            if (d.PERIODOS.length === 0 && d.PERIODO) d.PERIODOS = [d.PERIODO];

            // Grupo de edad del becario
            const bins   = [0,  6,  9, 12, 15, 18, 25, Infinity];
            const labels = ['<6','6-8','9-11','12-14','15-17','18-24','25+'];
            d.GRUPO_EDAD = labels[labels.length - 1];
            for (let i = 0; i < bins.length - 1; i++) {
                if (d.EDAD >= bins[i] && d.EDAD < bins[i + 1]) {
                    d.GRUPO_EDAD = labels[i];
                    break;
                }
            }
        });

        window.dashDataFull = data;
        window.dashData     = data;
        document.dispatchEvent(new Event('datosListos'));

    } catch (err) {
        console.error('[Dashboard] Error al cargar data_dashboard.json:', err);
        const banner = document.getElementById('error-msg');
        if (banner) banner.style.display = 'block';
        document.querySelectorAll('.chart-container').forEach(el => el.classList.remove('loading'));
    }
}
