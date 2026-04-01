// ── GRAFICA_ELECTORAL.JS ── DashboardBecas ─────────────────────────────────────
// Gráficas de la pestaña Electoral:
//   1. Distribución por Distrito Local (pie)
//   2. Distribución por Distrito Federal (pie)
//   3. Inversión por Distrito Local (barras)
//   4. Inversión por Distrito Federal (barras)
//   5. Top 20 Secciones Electorales por Beneficiarios (barras horizontales)
//   6. Top 20 Secciones Electorales por Inversión (barras horizontales)

document.addEventListener('datosListos', () => {
    const data = window.dashData;

    // Helpers: etiqueta legible para distrito
    const labelDistrito = (tipo, num) =>
        num != null ? `${tipo} ${num}` : 'Sin dato';

    /**
     * Agrupa entradas con menos del 1% del total bajo la clave "Otros".
     * Devuelve { labels, values } listos para Plotly.
     */
    const agruparOtros = (conteo, umbralPct = 1) => {
        const total = Object.values(conteo).reduce((a, b) => a + b, 0);
        const labels = [], values = [];
        let otros = 0;
        for (const [lab, val] of Object.entries(conteo)) {
            if (total > 0 && (val / total) * 100 < umbralPct) {
                otros += val;
            } else {
                labels.push(lab);
                values.push(val);
            }
        }
        if (otros > 0) {
            labels.push('Otros');
            values.push(otros);
        }
        return { labels, values };
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Distribución por Distrito Local — Pie
    // ═══════════════════════════════════════════════════════════════════════
    const elDLP = document.getElementById('chart-distrito-local-pie');
    if (elDLP) {
        elDLP.classList.remove('loading');

        const validDL = data.filter(d => d.DISTRITO_LOCAL != null);
        const conteoDL = contarPor(validDL, 'DISTRITO_LOCAL');
        const { labels: rawLabsDL, values: valsDL } = agruparOtros(conteoDL);
        const labsDL = rawLabsDL.map(k => k === 'Otros' ? 'Otros' : labelDistrito('Distrito Local', k));

        Plotly.newPlot(elDLP, [{
            type: 'pie',
            labels: labsDL,
            values: valsDL,
            marker: { colors: C.paleta, line: { color: C.paperBg, width: 2 } },
            textinfo: 'label+percent',
            textfont: { size: 12, color: '#FFFFFF' },
            hovertemplate: '<b>%{label}</b><br>%{value:,} beneficiarios<br>%{percent}<extra></extra>',
            hole: 0.38,
        }], getLayout('Beneficiarios por Distrito Local', {
            showlegend: true,
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.12 },
            margin: { t: 58, r: 10, b: 40, l: 10 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Distribución por Distrito Federal — Pie
    // ═══════════════════════════════════════════════════════════════════════
    const elDFP = document.getElementById('chart-distrito-federal-pie');
    if (elDFP) {
        elDFP.classList.remove('loading');

        const validDF = data.filter(d => d.DISTRITO_FEDERAL != null);
        const conteoDF = contarPor(validDF, 'DISTRITO_FEDERAL');
        const { labels: rawLabsDF, values: valsDF } = agruparOtros(conteoDF);
        const labsDF = rawLabsDF.map(k => k === 'Otros' ? 'Otros' : labelDistrito('Distrito Federal', k));

        Plotly.newPlot(elDFP, [{
            type: 'pie',
            labels: labsDF,
            values: valsDF,
            marker: {
                colors: C.paleta.slice(2),
                line: { color: C.paperBg, width: 2 },
            },
            textinfo: 'label+percent',
            textfont: { size: 12, color: '#FFFFFF' },
            hovertemplate: '<b>%{label}</b><br>%{value:,} beneficiarios<br>%{percent}<extra></extra>',
            hole: 0.38,
        }], getLayout('Beneficiarios por Distrito Federal', {
            showlegend: true,
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.12 },
            margin: { t: 58, r: 10, b: 40, l: 10 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Inversión por Distrito Local — Barras agrupadas (becarios + inversión)
    // ═══════════════════════════════════════════════════════════════════════
    const elDLI = document.getElementById('chart-distrito-local-inversion');
    if (elDLI) {
        elDLI.classList.remove('loading');

        const validDL = data.filter(d => d.DISTRITO_LOCAL != null);
        const conteoDL = contarPor(validDL, 'DISTRITO_LOCAL');
        const sumasDL  = sumarPor(validDL, 'DISTRITO_LOCAL', 'IMPORTE');
        const rankingDL = sortedDesc(conteoDL);
        const labsDL = rankingDL.map(r => labelDistrito('Distrito Local', r[0]));
        const valsDL = rankingDL.map(r => r[1]);
        const invDL  = rankingDL.map(r => sumasDL[r[0]] || 0);

        Plotly.newPlot(elDLI, [
            {
                type: 'bar',
                name: 'Beneficiarios',
                x: labsDL,
                y: valsDL,
                marker: { color: C.verde },
                text: valsDL.map(v => v.toLocaleString('es-MX')),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 11 },
                cliponaxis: false,
                hovertemplate: '<b>%{x}</b><br>%{y:,} beneficiarios<extra></extra>',
                yaxis: 'y',
            },
            {
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Inversión',
                x: labsDL,
                y: invDL,
                line: { color: C.naranja, width: 2 },
                marker: { color: C.naranja, size: 9, symbol: 'diamond' },
                hovertemplate: '<b>%{x}</b><br>Inversión: $%{y:.3s}<extra></extra>',
                yaxis: 'y2',
            },
        ], getLayout('Inversión y Beneficiarios por Distrito Local', {
            yaxis:  { title: 'Beneficiarios', gridcolor: 'rgba(255,255,255,0.08)' },
            yaxis2: {
                title: 'Inversión Total ($)',
                overlaying: 'y',
                side: 'right',
                showgrid: false,
                tickprefix: '$',
                tickformat: '.3s',
            },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.18 },
            margin: { t: 58, r: 80, b: 68, l: 60 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Inversión por Distrito Federal — Barras + línea
    // ═══════════════════════════════════════════════════════════════════════
    const elDFI = document.getElementById('chart-distrito-federal-inversion');
    if (elDFI) {
        elDFI.classList.remove('loading');

        const validDF = data.filter(d => d.DISTRITO_FEDERAL != null);
        const conteoDF = contarPor(validDF, 'DISTRITO_FEDERAL');
        const sumasDF  = sumarPor(validDF, 'DISTRITO_FEDERAL', 'IMPORTE');
        const rankingDF = sortedDesc(conteoDF);
        const labsDF = rankingDF.map(r => labelDistrito('Distrito Federal', r[0]));
        const valsDF = rankingDF.map(r => r[1]);
        const invDF  = rankingDF.map(r => sumasDF[r[0]] || 0);

        Plotly.newPlot(elDFI, [
            {
                type: 'bar',
                name: 'Beneficiarios',
                x: labsDF,
                y: valsDF,
                marker: { color: C.paleta[2] },
                text: valsDF.map(v => v.toLocaleString('es-MX')),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 11 },
                cliponaxis: false,
                hovertemplate: '<b>%{x}</b><br>%{y:,} beneficiarios<extra></extra>',
                yaxis: 'y',
            },
            {
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Inversión',
                x: labsDF,
                y: invDF,
                line: { color: C.naranja, width: 2 },
                marker: { color: C.naranja, size: 9, symbol: 'diamond' },
                hovertemplate: '<b>%{x}</b><br>Inversión: $%{y:.3s}<extra></extra>',
                yaxis: 'y2',
            },
        ], getLayout('Inversión y Beneficiarios por Distrito Federal', {
            yaxis:  { title: 'Beneficiarios', gridcolor: 'rgba(255,255,255,0.08)' },
            yaxis2: {
                title: 'Inversión Total ($)',
                overlaying: 'y',
                side: 'right',
                showgrid: false,
                tickprefix: '$',
                tickformat: '.3s',
            },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.18 },
            margin: { t: 58, r: 80, b: 68, l: 60 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Top Secciones Electorales por Beneficiarios (barras horizontales)
    // ═══════════════════════════════════════════════════════════════════════
    const elTS = document.getElementById('chart-top-secciones');
    if (elTS) {
        elTS.classList.remove('loading');

        const validSE  = data.filter(d => d.SECCION_ELECTORAL != null);
        const conteoSE = contarPor(validSE, 'SECCION_ELECTORAL');
        const sumasSE  = sumarPor(validSE, 'SECCION_ELECTORAL', 'IMPORTE');
        const fullRankSE = sortedDesc(conteoSE);

        const renderTopSecciones = (n) => {
            const rankingSE = fullRankSE.slice(0, n);
            const labsSE = rankingSE.map(r => `Sección ${r[0]}`);
            const valsSE = rankingSE.map(r => r[1]);
            const invSE  = rankingSE.map(r => sumasSE[r[0]] || 0);

            Plotly.newPlot(elTS, [
                {
                    type: 'bar',
                    orientation: 'h',
                    name: 'Beneficiarios',
                    x: valsSE,
                    y: labsSE,
                    marker: { color: C.verde },
                    text: valsSE.map(v => v.toLocaleString('es-MX')),
                    textposition: 'outside',
                    textfont: { color: '#FFF', size: 11 },
                    cliponaxis: false,
                    hovertemplate: '<b>%{y}</b><br>%{x:,} beneficiarios<extra></extra>',
                    xaxis: 'x',
                },
                {
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Inversión',
                    x: invSE,
                    y: labsSE,
                    marker: {
                        color: C.naranja,
                        size: 10,
                        symbol: 'diamond',
                        line: { color: '#FFF', width: 1 },
                    },
                    hovertemplate: '<b>%{y}</b><br>Inversión: $%{x:,.0f}<extra></extra>',
                    xaxis: 'x2',
                },
            ], getLayout(`Top ${n} Secciones Electorales por Beneficiarios`, {
                barmode: 'overlay',
                xaxis:  { title: 'Beneficiarios', gridcolor: 'rgba(255,255,255,0.08)' },
                xaxis2: {
                    overlaying: 'x',
                    side: 'top',
                    showgrid: false,
                    tickformat: '$,.0f',
                },
                yaxis:  { autorange: 'reversed' },
                margin: { t: 78, r: 80, b: 90, l: 110 },
                legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.20 },
            }), plotConfig);
        };

        elTS._renderTop = renderTopSecciones;
        const selTS = document.querySelector('[data-chart="chart-top-secciones"]');
        const nTS   = +(selTS?.querySelector('.top-select')?.value ?? 15);
        renderTopSecciones(nTS);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Top Secciones con Mayor Inversión (barras horizontales)
    // ═══════════════════════════════════════════════════════════════════════
    const elSI = document.getElementById('chart-seccion-inversion');
    if (elSI) {
        elSI.classList.remove('loading');

        const validSEI  = data.filter(d => d.SECCION_ELECTORAL != null);
        const sumasSEI  = sumarPor(validSEI, 'SECCION_ELECTORAL', 'IMPORTE');
        const conteoSEI = contarPor(validSEI, 'SECCION_ELECTORAL');
        const fullRankSEI = Object.entries(sumasSEI).sort((a, b) => b[1] - a[1]);

        const renderTopSecInversion = (n) => {
            const rankingSEInv = fullRankSEI.slice(0, n);
            const labsSEI = rankingSEInv.map(r => `Sección ${r[0]}`);
            const invSEI  = rankingSEInv.map(r => r[1]);
            const benSEI  = rankingSEInv.map(r => conteoSEI[r[0]] || 0);

            Plotly.newPlot(elSI, [
                {
                    type: 'bar',
                    orientation: 'h',
                    name: 'Inversión',
                    x: invSEI,
                    y: labsSEI,
                    marker: { color: C.naranja },
                    text: invSEI.map(v => '$' + v.toLocaleString('es-MX', { maximumFractionDigits: 0 })),
                    textposition: 'outside',
                    textfont: { color: '#FFF', size: 11 },
                    cliponaxis: false,
                    hovertemplate: '<b>%{y}</b><br>Inversión: $%{x:,.0f}<extra></extra>',
                    xaxis: 'x',
                },
                {
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Beneficiarios',
                    x: benSEI,
                    y: labsSEI,
                    marker: {
                        color: C.verde,
                        size: 10,
                        symbol: 'circle',
                        line: { color: '#FFF', width: 1 },
                    },
                    hovertemplate: '<b>%{y}</b><br>%{x:,} beneficiarios<extra></extra>',
                    xaxis: 'x2',
                },
            ], getLayout(`Top ${n} Secciones Electorales por Inversión`, {
                barmode: 'overlay',
                xaxis:  { title: 'Inversión Total ($)', tickformat: '$,.0f', gridcolor: 'rgba(255,255,255,0.08)' },
                xaxis2: {
                    overlaying: 'x',
                    side: 'top',
                    showgrid: false,
                },
                yaxis:  { autorange: 'reversed' },
                margin: { t: 78, r: 80, b: 90, l: 110 },
                legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.20 },
            }), plotConfig);
        };

        elSI._renderTop = renderTopSecInversion;
        const selSI = document.querySelector('[data-chart="chart-seccion-inversion"]');
        const nSI   = +(selSI?.querySelector('.top-select')?.value ?? 15);
        renderTopSecInversion(nSI);
    }
});
