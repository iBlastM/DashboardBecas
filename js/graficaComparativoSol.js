// ── GRAFICA_COMPARATIVO_SOL.JS ── DashboardBecas · Solicitantes ───────────────
// Sección "Evolución Temporal de Solicitudes" — reemplaza la sección Comparativo
// del dashboard de Beneficiarios con análisis temporal enfocado en todos los
// solicitantes (aprobados + no aprobados):
//
//   1. Total Solicitantes por Año (barras apiladas Aprobados / No Aprobados)
//   2. Tasa de Aprobación por Año (línea con banda histórica)
//      → KPI 3 propuesta.md: 2023 mínimo histórico, tendencias por año
//   3. Distribución de Estatus por Año (barras apiladas — desglose completo)
//   4. Primer Intento vs Reincidentes por Año
//   5. Tasa de Aprobación por Nivel Educativo × Año (barras agrupadas)
//
// Nota: `AÑO` es el año de la solicitud más reciente por CURP_BECARIO.
// Para no-beneficiarios representa su última aplicación; para beneficiarios
// puede diferir del año en que obtuvieron su primera beca.

document.addEventListener('datosListos', () => {
    const data = window.dashData;

    const ANIOS_CANON = ['2021', '2022', '2023', '2024', '2025'];
    // Solo incluir años efectivamente presentes en los datos actuales
    const getAnio = d => String(d.AÑO || '');
    const aniosPresentes = ANIOS_CANON.filter(a => data.some(d => getAnio(d) === a));

    if (aniosPresentes.length === 0) return;

    // Pre-calcular stats por año
    const statsAnio = aniosPresentes.map(a => {
        const sub       = data.filter(d => getAnio(d) === a);
        const aprobados = sub.filter(d => d.ES_BENEFICIARIO).length;
        const tasa      = sub.length > 0 ? +((aprobados / sub.length) * 100).toFixed(1) : 0;
        return { anio: a, total: sub.length, aprobados, noAprobados: sub.length - aprobados, tasa };
    });

    const promHistorico = statsAnio.length > 0
        ? +(statsAnio.reduce((s, v) => s + v.tasa, 0) / statsAnio.length).toFixed(1)
        : 0;

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Total Solicitantes por Año (barras apiladas)
    // ═══════════════════════════════════════════════════════════════════════
    const el1 = document.getElementById('chart-sol-anio');
    if (el1) {
        el1.classList.remove('loading');
        const aprobados   = statsAnio.map(s => s.aprobados);
        const noAprobados = statsAnio.map(s => s.noAprobados);
        const totales     = statsAnio.map(s => s.total);
        const tasas       = statsAnio.map(s => s.tasa);

        Plotly.newPlot(el1, [
            {
                type: 'bar', name: 'Aprobados',
                x: aniosPresentes, y: aprobados,
                marker: { color: C.verde },
                hovertemplate: '<b>%{x}</b><br>Aprobados: %{y:,}<extra></extra>',
            },
            {
                type: 'bar', name: 'No Aprobados',
                x: aniosPresentes, y: noAprobados,
                marker: { color: '#EF4444' },
                hovertemplate: '<b>%{x}</b><br>No Aprobados: %{y:,}<extra></extra>',
            },
            // Tasa de aprobación flotante sobre cada columna
            {
                type: 'scatter', mode: 'text',
                x: aniosPresentes,
                y: totales.map(t => t * 1.05),
                text: tasas.map(t => t + '%'),
                textfont: { color: '#FFF', size: 12, family: C.fuente },
                showlegend: false, hoverinfo: 'none',
            },
        ], getLayout('Solicitantes por Año · Aprobados vs No Aprobados', {
            barmode: 'stack',
            xaxis: { type: 'category', title: 'Año' },
            yaxis: { title: 'Solicitantes', gridcolor: 'rgba(255,255,255,0.08)' },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.22 },
            margin: { t: 68, r: 18, b: 68, l: 72 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Tasa de Aprobación por Año (línea + promedio histórico)
    //    KPI 3: tendencia anual de rechazo — detecta deterioro o mejora
    // ═══════════════════════════════════════════════════════════════════════
    const el2 = document.getElementById('chart-tasa-anio');
    if (el2) {
        el2.classList.remove('loading');
        const tasas = statsAnio.map(s => s.tasa);

        const markerColors = tasas.map(t =>
            t < promHistorico - 5 ? '#EF4444' :
            t < promHistorico     ? C.naranja  : C.verde
        );

        Plotly.newPlot(el2, [
            {
                type: 'scatter',
                mode: 'lines+markers+text',
                name: 'Tasa de aprobación',
                x: aniosPresentes,
                y: tasas,
                line: { color: C.verde, width: 2.5 },
                marker: { color: markerColors, size: 11, symbol: 'circle' },
                text: tasas.map(t => t.toFixed(1) + '%'),
                textposition: 'top center',
                textfont: { color: '#FFF', size: 12 },
                hovertemplate: '<b>%{x}</b><br>Tasa de aprobación: %{y:.1f}%<extra></extra>',
            },
        ], getLayout('Tasa de Aprobación por Año', {
            xaxis: { type: 'category', title: 'Año' },
            yaxis: {
                title: '% Aprobados / Total',
                gridcolor: 'rgba(255,255,255,0.08)',
                range: [0, 115],
            },
            shapes: [{
                type: 'line',
                xref: 'paper',
                x0: 0,
                x1: 1,
                y0: promHistorico, y1: promHistorico,
                line: { color: 'rgba(255,255,255,0.28)', width: 1.5, dash: 'dot' },
            }],
            annotations: [{
                xref: 'paper',
                x: 1,
                y: promHistorico,
                xanchor: 'right',
                yanchor: 'bottom',
                yshift: 6,
                text: 'Promedio: ' + promHistorico + '%',
                showarrow: false,
                font: { color: 'rgba(255,255,255,0.45)', size: 10 },
            }],
            margin: { t: 58, r: 18, b: 68, l: 72 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Distribución Completa de Estatus por Año (barras apiladas)
    //    Muestra la evolución de cada STATUS a lo largo de los años
    // ═══════════════════════════════════════════════════════════════════════
    const el3 = document.getElementById('chart-flujo-estatus');
    if (el3) {
        el3.classList.remove('loading');

        const STATUS_LABELS = {
            'CE-APROBADO':    'Aprobado',
            'CON RECHAZOS':   'Con Rechazos',
            'CE-CON RECHAZO': 'Rechazo (CE)',
            'CE-PENDIENTE':   'Pendiente Histórico',
            'PENDIENTE':      'Pendiente',
            'CANCELADO':      'Cancelado',
        };
        const STATUS_COLORS = {
            'CE-APROBADO':    C.verde,
            'CON RECHAZOS':   '#EF4444',
            'CE-CON RECHAZO': '#F97316',
            'CE-PENDIENTE':   '#A855F7',
            'PENDIENTE':      '#FACC15',
            'CANCELADO':      '#6B7280',
        };

        const todosStatus = [...new Set(data.map(d => d.STATUS).filter(Boolean))];

        const traces = todosStatus.map(status => ({
            type: 'bar',
            name: STATUS_LABELS[status] || status,
            x: aniosPresentes,
            y: aniosPresentes.map(a =>
                data.filter(d => getAnio(d) === a && d.STATUS === status).length
            ),
            marker: { color: STATUS_COLORS[status] || C.paleta[4] },
            hovertemplate: '<b>%{x}</b><br>' +
                (STATUS_LABELS[status] || status) + ': %{y:,}<extra></extra>',
        }));

        Plotly.newPlot(el3, traces, getLayout('Distribución de Estatus por Año', {
            barmode: 'stack',
            xaxis: { type: 'category', title: 'Año' },
            yaxis: { title: 'Solicitantes', gridcolor: 'rgba(255,255,255,0.08)' },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.22 },
            margin: { t: 58, r: 18, b: 80, l: 72 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Primer Intento vs Reincidentes por Año
    //    Primero = TOTAL_SOLICITUDES == 1  |  Reincidente = TOTAL_SOLICITUDES > 1
    // ═══════════════════════════════════════════════════════════════════════
    const el4 = document.getElementById('chart-nuevos-reincidentes');
    if (el4) {
        el4.classList.remove('loading');

        const nuevos = aniosPresentes.map(a =>
            data.filter(d => getAnio(d) === a && (d.TOTAL_SOLICITUDES || 1) === 1).length
        );
        const reincidentes = aniosPresentes.map(a =>
            data.filter(d => getAnio(d) === a && (d.TOTAL_SOLICITUDES || 1) > 1).length
        );
        const totales = aniosPresentes.map((_, i) => nuevos[i] + reincidentes[i]);
        const pctReincidente = aniosPresentes.map((_, i) =>
            totales[i] > 0 ? ((reincidentes[i] / totales[i]) * 100).toFixed(1) : '0.0'
        );

        Plotly.newPlot(el4, [
            {
                type: 'bar', name: 'Primer intento',
                x: aniosPresentes, y: nuevos,
                marker: { color: C.verde },
                text: nuevos.map(v => v.toLocaleString('es-MX')),
                textposition: 'inside',
                insidetextanchor: 'middle',
                textfont: { color: '#FFF', size: 11 },
                hovertemplate: '<b>%{x}</b><br>Primer intento: %{y:,}<extra></extra>',
            },
            {
                type: 'bar', name: 'Reincidentes (>1 solicitud)',
                x: aniosPresentes, y: reincidentes,
                marker: { color: C.naranja },
                text: reincidentes.map(v => v.toLocaleString('es-MX')),
                textposition: 'inside',
                insidetextanchor: 'middle',
                textfont: { color: '#FFF', size: 11 },
                hovertemplate: '<b>%{x}</b><br>Reincidentes: %{y:,}<extra></extra>',
            },
            // % reincidentes sobre el total del año
            {
                type: 'scatter', mode: 'text',
                x: aniosPresentes,
                y: totales.map(t => t * 1.06),
                text: pctReincidente.map(p => p + '% reincid.'),
                textfont: { color: C.naranja, size: 10, family: C.fuente },
                showlegend: false, hoverinfo: 'none',
            },
        ], getLayout('Primer Intento vs Solicitantes Reincidentes por Año', {
            barmode: 'group',
            xaxis: { type: 'category', title: 'Año' },
            yaxis: { title: 'Solicitantes', gridcolor: 'rgba(255,255,255,0.08)' },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.22 },
            margin: { t: 58, r: 18, b: 68, l: 72 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Tasa de Aprobación por Nivel Educativo × Año (barras agrupadas)
    //    Permite ver si la brecha entre niveles cambia con el tiempo
    // ═══════════════════════════════════════════════════════════════════════
    const el5 = document.getElementById('chart-tasa-nivel-anio');
    if (el5) {
        el5.classList.remove('loading');

        const niveles = [...new Set(data.map(d => d.NIVEL_EDUCATIVO).filter(Boolean))].sort();

        const traces = niveles.map((nivel, i) => ({
            type: 'bar',
            name: nivel,
            x: aniosPresentes,
            y: aniosPresentes.map(a => {
                const sub = data.filter(d => getAnio(d) === a && d.NIVEL_EDUCATIVO === nivel);
                return sub.length > 0
                    ? +((sub.filter(d => d.ES_BENEFICIARIO).length / sub.length) * 100).toFixed(1)
                    : 0;
            }),
            marker: { color: C.paleta[i % C.paleta.length] },
            text: aniosPresentes.map(a => {
                const sub = data.filter(d => getAnio(d) === a && d.NIVEL_EDUCATIVO === nivel);
                if (sub.length === 0) return '';
                return ((sub.filter(d => d.ES_BENEFICIARIO).length / sub.length) * 100).toFixed(1) + '%';
            }),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 10 },
            cliponaxis: false,
            hovertemplate: '<b>%{x} · ' + nivel + '</b><br>Tasa: %{y:.1f}%<extra></extra>',
        }));

        Plotly.newPlot(el5, traces, getLayout('Tasa de Aprobación por Nivel × Año', {
            barmode: 'group',
            xaxis: { type: 'category', title: 'Año' },
            yaxis: {
                title: '% Aprobados',
                gridcolor: 'rgba(255,255,255,0.08)',
                range: [0, 120],
            },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.22 },
            margin: { t: 58, r: 18, b: 80, l: 72 },
        }), plotConfig);
    }
});
