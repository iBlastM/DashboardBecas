// ── GRAFICA_ECONOMICO.JS ── DashboardBecas ────────────────────────────────────
// Gráficas de la pestaña Económico:
//   1. Gasto por Nivel Educativo (pie)
//   2. Inversión por Sector (barras)
//   3. Promedio de Apoyo por categorías (barras agrupadas)
//   4. Distribución del Recurso por Tipo de Beca (barras horizontales apiladas)
//   5. Top 10 Escuelas por Inversión
//   6. Top 10 Colonias por Inversión

document.addEventListener('datosListos', () => {
    const data = window.dashData;
    const fmt  = (v, opts) => (v || 0).toLocaleString('es-MX', opts || {});

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Gasto Total por Nivel Educativo (pie)
    // ═══════════════════════════════════════════════════════════════════════
    const elGN = document.getElementById('chart-gasto-nivel');
    if (elGN) {
        elGN.classList.remove('loading');
        const sumas  = sumarPor(data, 'NIVEL_EDUCATIVO', 'IMPORTE');
        const labels = Object.keys(sumas).filter(k => k && k !== 'Sin dato');
        const values = labels.map(k => sumas[k]);

        Plotly.newPlot(elGN, [{
            type: 'pie',
            labels,
            values,
            marker: {
                colors: C.paleta,
                line: { color: C.paperBg, width: 2 },
            },
            textfont: { color: '#FFF', size: 12, family: C.fuente },
            textinfo: 'label+percent',
            hovertemplate: '<b>%{label}</b><br>$%{value:,.0f}<br>%{percent}<extra></extra>',
        }], getLayout('Gasto por Nivel Educativo', {
            showlegend: true,
            margin: { t: 58, r: 10, b: 20, l: 10 },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.15 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Inversión Total por Sector (barras)
    // ═══════════════════════════════════════════════════════════════════════
    const elIS = document.getElementById('chart-inversion-sector');
    if (elIS) {
        elIS.classList.remove('loading');
        const sumas   = sumarPor(data, 'SECTOR', 'IMPORTE');
        const sectores = Object.keys(sumas).filter(k => k && k !== 'Sin dato').sort();
        const vals     = sectores.map(s => sumas[s] || 0);

        Plotly.newPlot(elIS, [{
            type: 'bar',
            x: sectores,
            y: vals,
            marker: { color: [C.verde, C.naranja, '#A855F7', '#3B82F6'].slice(0, sectores.length) },
            text: vals.map(v => '$' + fmt(v, { maximumFractionDigits: 0 })),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 11 },
            cliponaxis: false,
            hovertemplate: '<b>%{x}</b><br>$%{y:,.0f}<extra></extra>',
        }], getLayout('Inversión por Sector', {
            yaxis: {
                title: 'Inversión Total ($)',
                gridcolor: 'rgba(255,255,255,0.08)',
                tickformat: '$,.0f',
            },
            margin: { t: 58, r: 18, b: 58, l: 100 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Promedio de Apoyo por categorías (barras agrupadas)
    //    — General · Por Nivel · Por Sector · Por Tipo de Beca
    // ═══════════════════════════════════════════════════════════════════════
    const elAP = document.getElementById('chart-apoyo-promedio');
    if (elAP) {
        elAP.classList.remove('loading');

        const totalGeneral = data.length > 0
            ? data.reduce((s, d) => s + d.IMPORTE, 0) / data.length
            : 0;

        const promNivel = promediarPor(data, 'NIVEL_EDUCATIVO', 'IMPORTE');
        const promSector = promediarPor(data, 'SECTOR', 'IMPORTE');
        const promTipo   = promediarPor(data, 'TIPO_BECA', 'IMPORTE');

        // Aplanar en una sola gráfica de barras con anotaciones de categoría
        const categorias = ['General', ...Object.keys(promNivel), ...Object.keys(promSector), ...Object.keys(promTipo)];
        const valores    = [
            totalGeneral,
            ...Object.values(promNivel),
            ...Object.values(promSector),
            ...Object.values(promTipo),
        ].map(v => +v.toFixed(2));

        const colores = [
            C.naranja,
            ...Array(Object.keys(promNivel).length).fill(C.verde),
            ...Array(Object.keys(promSector).length).fill('#A855F7'),
            ...Array(Object.keys(promTipo).length).fill('#3B82F6'),
        ];

        Plotly.newPlot(elAP, [{
            type: 'bar',
            x: categorias,
            y: valores,
            marker: { color: colores },
            text: valores.map(v => '$' + fmt(v, { minimumFractionDigits: 0, maximumFractionDigits: 0 })),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 10 },
            cliponaxis: false,
            hovertemplate: '<b>%{x}</b><br>Promedio: $%{y:,.2f}<extra></extra>',
        }], getLayout('Promedio de Apoyo por Beneficiario', {
            xaxis: { tickangle: -35 },
            yaxis: {
                title: 'Importe Promedio ($)',
                gridcolor: 'rgba(255,255,255,0.08)',
                tickformat: '$,.0f',
            },
            margin: { t: 58, r: 18, b: 100, l: 90 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Distribución del Recurso por Tipo de Beca (barras horizontales apiladas
    //    con colores fijos por tipo para fácil comparación)
    // ═══════════════════════════════════════════════════════════════════════
    const elRT = document.getElementById('chart-recurso-tipo');
    if (elRT) {
        elRT.classList.remove('loading');

        const tiposOrden = ['PRIMARIA','PRIMARIA EXCELENCIA','SECUNDARIA','SECUNDARIA EXCELENCIA','UNIVERSITARIO'];
        const TIPO_COLOR = {
            'PRIMARIA':              '#5B8AF5',
            'PRIMARIA EXCELENCIA':   C.naranja,
            'SECUNDARIA':            C.verde,
            'SECUNDARIA EXCELENCIA': '#F472B6',
            'UNIVERSITARIO':         '#A855F7',
        };

        // Suma y conteo por tipo
        const tiposPresentes = tiposOrden.filter(t =>
            data.some(d => d.TIPO_BECA === t)
        );
        // También incluir tipos no en la lista predef
        const otrosTipos = [...new Set(data.map(d => d.TIPO_BECA).filter(Boolean))]
            .filter(t => !tiposOrden.includes(t)).sort();
        const todosLos = [...tiposPresentes, ...otrosTipos];

        const sumasTipo  = sumarPor(data, 'TIPO_BECA', 'IMPORTE');
        const cuentasTipo = contarPor(data, 'TIPO_BECA');

        const traces = todosLos.map((tipo, i) => ({
            type: 'bar',
            name: tipo,
            x: [sumasTipo[tipo] || 0],
            y: ['Inversión Total'],
            orientation: 'h',
            marker: { color: TIPO_COLOR[tipo] || C.paleta[i % C.paleta.length] },
            text: ['$' + fmt(sumasTipo[tipo] || 0, { maximumFractionDigits: 0 }) +
                   ' (' + (cuentasTipo[tipo] || 0).toLocaleString('es-MX') + ')'],
            textposition: 'inside',
            insidetextanchor: 'middle',
            textfont: { color: '#FFF', size: 11 },
            hovertemplate: '<b>' + tipo + '</b><br>$%{x:,.0f}<extra></extra>',
        }));

        Plotly.newPlot(elRT, traces, getLayout('Distribución del Recurso por Tipo de Beca', {
            barmode: 'stack',
            xaxis: { title: 'Inversión ($)', tickformat: '$,.0f', gridcolor: 'rgba(255,255,255,0.08)' },
            yaxis: { title: '' },
            margin: { t: 58, r: 18, b: 68, l: 100 },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.25 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Top Escuelas por Inversión Total
    // ═══════════════════════════════════════════════════════════════════════
    const elTE = document.getElementById('chart-top10-escuelas-invest');
    if (elTE) {
        elTE.classList.remove('loading');
        const sumasE   = sumarPor(data.filter(d => d.ESCUELA), 'ESCUELA', 'IMPORTE');
        const fullRankE = sortedDesc(sumasE);

        const renderTopEscInvest = (n) => {
            const ranking = fullRankE.slice(0, n);
            const labels  = ranking.map(r => r[0]);
            const vals    = ranking.map(r => r[1]);

            Plotly.newPlot(elTE, [{
                type: 'bar',
                orientation: 'h',
                x: vals,
                y: labels,
                marker: { color: C.naranja },
                text: vals.map(v => '$' + fmt(v, { maximumFractionDigits: 0 })),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 10 },
                cliponaxis: false,
                hovertemplate: '<b>%{y}</b><br>$%{x:,.0f}<extra></extra>',
            }], getLayout(`Top ${n} Escuelas por Inversión`, {
                xaxis: { title: 'Inversión Total ($)', tickformat: '$,.0f' },
                yaxis: { autorange: 'reversed' },
                margin: { t: 58, r: 100, b: 58, l: 340 },
            }), plotConfig);
        };

        elTE._renderTop = renderTopEscInvest;
        const selTE = document.querySelector('[data-chart="chart-top10-escuelas-invest"]');
        const nTE   = +(selTE?.querySelector('.top-btn.active')?.dataset.n ?? 10);
        renderTopEscInvest(nTE);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Top Colonias por Inversión Total
    // ═══════════════════════════════════════════════════════════════════════
    const elTC = document.getElementById('chart-top10-colonias-invest');
    if (elTC) {
        elTC.classList.remove('loading');
        const sumasC    = sumarPor(data.filter(d => d.COLONIA), 'COLONIA', 'IMPORTE');
        const fullRankC = sortedDesc(sumasC);

        const renderTopColInvest = (n) => {
            const ranking = fullRankC.slice(0, n);
            const labels  = ranking.map(r => r[0]);
            const vals    = ranking.map(r => r[1]);

            Plotly.newPlot(elTC, [{
                type: 'bar',
                orientation: 'h',
                x: vals,
                y: labels,
                marker: { color: C.verde },
                text: vals.map(v => '$' + fmt(v, { maximumFractionDigits: 0 })),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 10 },
                cliponaxis: false,
                hovertemplate: '<b>%{y}</b><br>$%{x:,.0f}<extra></extra>',
            }], getLayout(`Top ${n} Colonias por Inversión`, {
                xaxis: { title: 'Inversión Total ($)', tickformat: '$,.0f' },
                yaxis: { autorange: 'reversed' },
                margin: { t: 58, r: 100, b: 58, l: 240 },
            }), plotConfig);
        };

        elTC._renderTop = renderTopColInvest;
        const selTC = document.querySelector('[data-chart="chart-top10-colonias-invest"]');
        const nTC   = +(selTC?.querySelector('.top-btn.active')?.dataset.n ?? 10);
        renderTopColInvest(nTC);
    }
});
