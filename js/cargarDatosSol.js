// ── CARGAR_DATOS_SOL.JS ── DashboardBecas · Solicitantes ───────────────────────
// Carga data_sol_a.json y data_sol_b.json (JSON Lines) en paralelo, los fusiona
// por índice de fila y dispara el evento global 'datosListos'.
// (data_solicitantes.json fue dividido para cumplir el límite de 100 MB de GitHub)
// Incluye todos los estatus — no sólo CE-APROBADO — más los campos
// STATUS, ES_BENEFICIARIO y TOTAL_SOLICITUDES.

async function cargarDatosSol() {
    document.querySelectorAll('.chart-container').forEach(el => el.classList.add('loading'));

    try {
        const [respA, respB] = await Promise.all([
            fetch('./data_sol_a.json'),
            fetch('./data_sol_b.json'),
        ]);
        if (!respA.ok) throw new Error(`HTTP ${respA.status}: data_sol_a.json`);
        if (!respB.ok) throw new Error(`HTTP ${respB.status}: data_sol_b.json`);

        const [textA, textB] = await Promise.all([respA.text(), respB.text()]);

        // JSON Lines: una línea = un registro
        const parseLines = text => text
            .trim()
            .split('\n')
            .filter(l => l.trim().length > 0)
            .map(l => JSON.parse(l));

        const dataA = parseLines(textA);
        const dataB = parseLines(textB);

        // Fusionar ambos archivos registro a registro
        const data = dataA.map((a, i) => ({ ...a, ...dataB[i] }));

        // Asegurar tipos numéricos y booleanos
        data.forEach(d => {
            d.IMPORTE            = Number(d.IMPORTE)            || 0;
            d.EDAD               = Number(d.EDAD)               || 0;
            d.EDAD_TUTOR         = Number(d.EDAD_TUTOR)         || 0;
            d.GRADO              = Number(d.GRADO)              || 0;
            d.NUM_BECAS          = Number(d.NUM_BECAS)          || 0;
            d.TOTAL_SOLICITUDES  = Number(d.TOTAL_SOLICITUDES)  || 1;
            d.ES_BENEFICIARIO    = Boolean(d.ES_BENEFICIARIO);
            d.STATUS             = String(d.STATUS             || '');
            d.AÑO                = String(d.AÑO                || '');
            d.SECCION_ELECTORAL  = d.SECCION_ELECTORAL  != null ? Number(d.SECCION_ELECTORAL)  : null;
            d.DISTRITO_FEDERAL   = d.DISTRITO_FEDERAL   != null ? Number(d.DISTRITO_FEDERAL)   : null;
            d.DISTRITO_LOCAL     = d.DISTRITO_LOCAL     != null ? Number(d.DISTRITO_LOCAL)      : null;

            // Asegurar que los campos de agregación sean arrays
            if (!Array.isArray(d.AÑOS))     d.AÑOS     = d.AÑO     ? [Number(d.AÑO)]  : [];
            if (!Array.isArray(d.PERIODOS)) d.PERIODOS = [];
            if (!Array.isArray(d.BECAS))    d.BECAS    = [];

            // Periodo representativo para compatibilidad con gráficas
            const etapaCode =
                d.ETAPA === '1RA ETAPA'      ? 'E1' :
                d.ETAPA === '2DA ETAPA'      ? 'E2' : 'EX';
            d.PERIODO = d.AÑO + '-' + etapaCode;

            if (d.PERIODOS.length === 0 && d.PERIODO) d.PERIODOS = [d.PERIODO];

            // Grupo de edad del solicitante
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
        console.error('[Dashboard Solicitantes] Error al cargar datos:', err);
        const banner = document.getElementById('error-msg');
        if (banner) banner.style.display = 'block';
        document.querySelectorAll('.chart-container').forEach(el => el.classList.remove('loading'));
    }
}
