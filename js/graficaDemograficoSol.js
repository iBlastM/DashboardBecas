// ── GRAFICA_DEMOGRAFICO_SOL.JS ── DashboardBecas · Solicitantes ───────────────
// Gráfica exclusiva de la pestaña Demográfico en la vista Solicitantes:
//   7. Distribución por Nº de Solicitudes Acumuladas (reemplaza Top CURPs por becas)
//      Muestra cuántos solicitantes han aplicado N veces, separando
//      los que fueron aprobados alguna vez de los que nunca lo fueron.

document.addEventListener('datosListos', () => {
    const data = window.dashData;

    const el = document.getElementById('chart-solicitudes-dist');
    if (!el) return;
    el.classList.remove('loading');

    const MAX_BUCKET = 10; // ≥ MAX_BUCKET se agrupa en un solo bin "10+"

    const grupos = {};
    data.forEach(d => {
        const k = Math.min(d.TOTAL_SOLICITUDES || 1, MAX_BUCKET);
        if (!grupos[k]) grupos[k] = { aprobados: 0, noAprobados: 0 };
        if (d.ES_BENEFICIARIO) grupos[k].aprobados++;
        else                   grupos[k].noAprobados++;
    });

    const keys       = Array.from({ length: MAX_BUCKET }, (_, i) => i + 1).filter(k => grupos[k]);
    const labels     = keys.map(k => k === MAX_BUCKET ? MAX_BUCKET + '+' : String(k));
    const aprobados  = keys.map(k => grupos[k].aprobados);
    const noAprobados = keys.map(k => grupos[k].noAprobados);
    const totales    = keys.map((_, i) => aprobados[i] + noAprobados[i]);
    const tasas      = keys.map((_, i) =>
        totales[i] > 0 ? ((aprobados[i] / totales[i]) * 100).toFixed(1) : '0.0'
    );

    Plotly.newPlot(el, [
        {
            type: 'bar',
            name: 'Aprobados alguna vez',
            x: labels,
            y: aprobados,
            marker: { color: C.verde },
            hovertemplate: '<b>%{x} SOLICITUD(ES)</b><br>Aprobados: %{y:,}<extra></extra>',
        },
        {
            type: 'bar',
            name: 'Nunca aprobados',
            x: labels,
            y: noAprobados,
            marker: { color: '#EF4444' },
            hovertemplate: '<b>%{x} SOLICITUD(ES)</b><br>Nunca aprobados: %{y:,}<extra></extra>',
        },
        // Tasa de aprobación flotante sobre cada columna
        {
            type: 'scatter',
            mode: 'text',
            x: labels,
            y: totales.map(t => t * 1.06),
            text: tasas.map(t => t + '%'),
            textfont: { color: '#FFFFFF', size: 11, family: C.fuente },
            showlegend: false,
            hoverinfo: 'none',
        },
    ], getLayout('Distribución por Nº de Solicitudes Acumuladas · Aprobados vs Nunca Aprobados', {
        barmode: 'stack',
        xaxis: { title: 'Nº de Solicitudes Acumuladas por Persona' },
        yaxis: {
            title: 'Solicitantes',
            gridcolor: 'rgba(255,255,255,0.08)',
        },
        margin: { t: 68, r: 18, b: 68, l: 80 },
        legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.22 },
        annotations: [
            {
                x: labels[0] || '1',
                y: 1, yref: 'paper',
                xanchor: 'center', yanchor: 'top',
                text: '← primer intento',
                showarrow: false,
                font: { color: 'rgba(255,255,255,0.40)', size: 9 },
            },
        ],
    }), plotConfig);
});
