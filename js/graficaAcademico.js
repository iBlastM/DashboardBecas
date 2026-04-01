// ── GRAFICA_ACADEMICO.JS ── DashboardBecas ────────────────────────────────────
// Gráficas de la pestaña Académico:
//   1. Distribución de Becas por Nivel Educativo (donut)
//   2. Penetración por Sector (donut)
//   3. Beneficiarios por Grado Escolar (barras)
//   4. Diversidad Escolar por Sector — escuelas únicas (barras)
//   5. Diversidad Escolar por Colonia — top 15 colonias (barras horizontales)
//   6. Top 15 Escuelas por Beneficiarios (barras horizontales)

document.addEventListener('datosListos', () => {
    const data = window.dashData;

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Distribución de Becas por Nivel Educativo (donut)
    // ═══════════════════════════════════════════════════════════════════════
    const elBN = document.getElementById('chart-becas-nivel');
    if (elBN) {
        elBN.classList.remove('loading');
        const conteo = contarPor(data, 'NIVEL_EDUCATIVO');
        Plotly.newPlot(elBN, [{
            type: 'pie',
            hole: 0.52,
            labels: Object.keys(conteo),
            values: Object.values(conteo),
            marker: {
                colors: C.paleta,
                line: { color: C.paperBg, width: 2 },
            },
            textfont: { color: '#FFF', size: 13, family: C.fuente },
            textinfo: 'label+percent',
            hovertemplate: '<b>%{label}</b><br>%{value:,} becarios<br>%{percent}<extra></extra>',
        }], getLayout('Distribución por Nivel Educativo', {
            showlegend: false,
            margin: { t: 58, r: 10, b: 20, l: 10 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Penetración por Sector (donut)
    // ═══════════════════════════════════════════════════════════════════════
    const elPS = document.getElementById('chart-penetracion-sector');
    if (elPS) {
        elPS.classList.remove('loading');
        const conteo = contarPor(data, 'SECTOR');
        Plotly.newPlot(elPS, [{
            type: 'pie',
            hole: 0.52,
            labels: Object.keys(conteo),
            values: Object.values(conteo),
            marker: {
                colors: [C.verde, C.naranja, '#A855F7'],
                line: { color: C.paperBg, width: 2 },
            },
            textfont: { color: '#FFF', size: 13, family: C.fuente },
            textinfo: 'label+percent',
            hovertemplate: '<b>%{label}</b><br>%{value:,} becarios<br>%{percent}<extra></extra>',
        }], getLayout('Penetración por Sector', {
            showlegend: false,
            margin: { t: 58, r: 10, b: 20, l: 10 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Beneficiarios por Grado Escolar (barras)
    // ═══════════════════════════════════════════════════════════════════════
    const elGr = document.getElementById('chart-grado');
    if (elGr) {
        elGr.classList.remove('loading');
        const conGrado = data.filter(d => d.GRADO > 0);
        const conteo   = contarPor(conGrado, 'GRADO');
        const grados   = Object.keys(conteo).map(Number).sort((a, b) => a - b).map(String);
        const vals     = grados.map(g => conteo[g] || 0);

        Plotly.newPlot(elGr, [{
            type: 'bar',
            x: grados.map(g => 'Grado ' + g),
            y: vals,
            marker: { color: C.paleta.slice(0, grados.length) },
            text: vals.map(v => v.toLocaleString('es-MX')),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 11 },
            cliponaxis: false,
            hovertemplate: '<b>GRADO %{x}</b><br>%{y:,} becarios<extra></extra>',
        }], getLayout('Beneficiarios por Grado Escolar', {
            xaxis: { title: 'Grado' },
            yaxis: { title: 'Beneficiarios', gridcolor: 'rgba(255,255,255,0.08)' },
            margin: { t: 58, r: 18, b: 68, l: 72 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Diversidad Escolar por Sector — nº de escuelas únicas por sector
    // ═══════════════════════════════════════════════════════════════════════
    const elDS = document.getElementById('chart-diversidad-sector');
    if (elDS) {
        elDS.classList.remove('loading');

        // Escuelas únicas por sector
        const escSector = {};
        data.forEach(d => {
            if (!d.SECTOR || !d.ESCUELA) return;
            if (!escSector[d.SECTOR]) escSector[d.SECTOR] = new Set();
            escSector[d.SECTOR].add(d.ESCUELA);
        });
        const sectores   = Object.keys(escSector).sort();
        const numEscuelas = sectores.map(s => escSector[s].size);
        const numBenef   = sectores.map(s => data.filter(d => d.SECTOR === s).length);

        Plotly.newPlot(elDS, [
            {
                type: 'bar', name: 'Escuelas Únicas',
                x: sectores, y: numEscuelas,
                marker: { color: C.verde },
                text: numEscuelas.map(v => v.toLocaleString('es-MX')),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 12 },
                yaxis: 'y',
                hovertemplate: '<b>%{x}</b><br>Escuelas únicas: %{y:,}<extra></extra>',
            },
            {
                type: 'bar', name: 'Beneficiarios',
                x: sectores, y: numBenef,
                marker: { color: C.naranja },
                text: numBenef.map(v => v.toLocaleString('es-MX')),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 12 },
                yaxis: 'y2',
                hovertemplate: '<b>%{x}</b><br>Beneficiarios: %{y:,}<extra></extra>',
            },
        ], getLayout('Diversidad Escolar por Sector', {
            barmode: 'group',
            yaxis:  { title: 'Escuelas únicas',  gridcolor: 'rgba(255,255,255,0.08)' },
            yaxis2: {
                title: 'Beneficiarios',
                overlaying: 'y',
                side: 'right',
                gridcolor: 'rgba(255,255,255,0)',
                showgrid: false,
            },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.18, yanchor: 'top' },
            margin: { t: 58, r: 80, b: 80, l: 72 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Diversidad Escolar por Colonia — escuelas únicas por colonia
    // ═══════════════════════════════════════════════════════════════════════
    const elDC = document.getElementById('chart-diversidad-colonia');
    if (elDC) {
        elDC.classList.remove('loading');

        const escColonia = {};
        data.forEach(d => {
            if (!d.COLONIA || !d.ESCUELA) return;
            if (!escColonia[d.COLONIA]) escColonia[d.COLONIA] = new Set();
            escColonia[d.COLONIA].add(d.ESCUELA);
        });
        const fullDC = Object.entries(escColonia)
            .map(([k, v]) => [k, v.size])
            .sort((a, b) => b[1] - a[1]);

        const renderDiversidadColonia = (n) => {
            const ranking = fullDC.slice(0, n);
            const labels  = ranking.map(r => r[0]);
            const vals    = ranking.map(r => r[1]);

            Plotly.newPlot(elDC, [{
                type: 'bar',
                orientation: 'h',
                x: vals,
                y: labels,
                marker: { color: C.paleta[2] },
                text: vals.map(v => v.toLocaleString('es-MX')),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 11 },
                cliponaxis: false,
                hovertemplate: '<b>%{y}</b><br>Escuelas únicas: %{x:,}<extra></extra>',
            }], getLayout(`Diversidad Escolar por Colonia (Top ${n})`, {
                xaxis: { title: 'Escuelas únicas' },
                yaxis: { autorange: 'reversed' },
                margin: { t: 58, r: 60, b: 48, l: 200 },
            }), plotConfig);
        };

        elDC._renderTop = renderDiversidadColonia;
        const selDC = document.querySelector('[data-chart="chart-diversidad-colonia"]');
        const nDC   = +(selDC?.querySelector('.top-select')?.value ?? 15);
        renderDiversidadColonia(nDC);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Top Escuelas por Beneficiarios (barras horizontales)
    // ═══════════════════════════════════════════════════════════════════════
    const elTE = document.getElementById('chart-top-escuelas');
    if (elTE) {
        elTE.classList.remove('loading');

        const conteo   = contarPor(data.filter(d => d.ESCUELA), 'ESCUELA');
        const fullRank = sortedDesc(conteo);

        const renderTopEscuelas = (n) => {
            const ranking = fullRank.slice(0, n);
            const labels  = ranking.map(r => r[0].charAt(0).toUpperCase() + r[0].slice(1).toLowerCase());
            const vals    = ranking.map(r => r[1]);
            const maxV    = Math.max(...vals, 1);

            Plotly.newPlot(elTE, [{
                type: 'bar',
                orientation: 'h',
                x: vals,
                y: labels,
                marker: { color: vals.map(v => v === maxV ? C.naranja : C.verde) },
                text: vals.map(v => v.toLocaleString('es-MX')),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 11 },
                cliponaxis: false,
                hovertemplate: '<b>%{y}</b><br>%{x:,} beneficiarios<extra></extra>',
            }], getLayout(`Top ${n} Escuelas por Beneficiarios`, {
                xaxis: { automargin: true },
                yaxis: { autorange: 'reversed' },
                margin: { t: 58, r: 80, b: 72, l: 340 },
                annotations: [{
                    text: 'Beneficiarios',
                    xref: 'paper', yref: 'paper',
                    x: 0.4, y: -0.1,
                    xanchor: 'center', yanchor: 'top',
                    showarrow: false,
                    font: { color: '#FFF', size: 13, family: C.fuente },
                }],
            }), plotConfig);
        };

        elTE._renderTop = renderTopEscuelas;
        const selTE = document.querySelector('[data-chart="chart-top-escuelas"]');
        const nTE   = +(selTE?.querySelector('.top-select')?.value ?? 15);
        renderTopEscuelas(nTE);
    }
});
