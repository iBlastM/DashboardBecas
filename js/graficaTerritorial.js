// ── GRAFICA_TERRITORIAL.JS ── DashboardBecas ──────────────────────────────────
// Gráficas de la pestaña Territorial:
//   1. Beneficiarios por Delegación (barras horizontales)
//   2. Inversión vs Beneficiarios por Delegación (scatter)
//   3. Treemap por Delegación
//   4. Top 15 Colonias por Beneficiarios (barras horizontales + inversión)
//   5. Mapa de Calor por Colonia — Treemap

document.addEventListener('datosListos', () => {
    const data = window.dashData;

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Beneficiarios por Delegación (barras horizontales + puntos inversión)
    // ═══════════════════════════════════════════════════════════════════════
    const elDEL = document.getElementById('chart-delegacion-barras');
    if (elDEL) {
        elDEL.classList.remove('loading');

        const conteoDel = contarPor(data.filter(d => d.DELEGACION), 'DELEGACION');
        const sumasDel  = sumarPor(data.filter(d => d.DELEGACION), 'DELEGACION', 'IMPORTE');
        const rankingDel = sortedDesc(conteoDel);
        const labsDel = rankingDel.map(r => r[0]);
        const valsDel = rankingDel.map(r => r[1]);
        const invDel  = labsDel.map(l => sumasDel[l] || 0);

        Plotly.newPlot(elDEL, [
            {
                type: 'bar',
                orientation: 'h',
                name: 'Beneficiarios',
                x: valsDel,
                y: labsDel,
                marker: { color: C.verde },
                text: valsDel.map(v => v.toLocaleString('es-MX')),
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
                x: invDel,
                y: labsDel,
                marker: {
                    color: C.naranja,
                    size: 10,
                    symbol: 'diamond',
                    line: { color: '#FFF', width: 1 },
                },
                hovertemplate: '<b>%{y}</b><br>Inversión: $%{x:,.0f}<extra></extra>',
                xaxis: 'x2',
            },
        ], getLayout('Beneficiarios e Inversión por Delegación', {
            barmode: 'overlay',
            xaxis:  { title: 'Beneficiarios', gridcolor: 'rgba(255,255,255,0.08)' },
            xaxis2: {
                title: 'Inversión Total ($)',
                overlaying: 'x',
                side: 'top',
                showgrid: false,
                tickformat: '$,.0f',
            },
            yaxis: { autorange: 'reversed' },
            margin: { t: 68, r: 80, b: 68, l: 240 },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.12 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Scatter: Inversión vs Beneficiarios por Delegación (con nivel educativo)
    // ═══════════════════════════════════════════════════════════════════════
    const elDSC = document.getElementById('chart-delegacion-scatter');
    if (elDSC) {
        elDSC.classList.remove('loading');

        const conteoDel = contarPor(data.filter(d => d.DELEGACION), 'DELEGACION');
        const sumasDel  = sumarPor(data.filter(d => d.DELEGACION), 'DELEGACION', 'IMPORTE');
        const delegaciones = Object.keys(conteoDel);
        const xs = delegaciones.map(k => sumasDel[k] || 0);
        const ys = delegaciones.map(k => conteoDel[k]);
        const prom = delegaciones.map((k, i) => ys[i] > 0 ? xs[i] / ys[i] : 0);

        Plotly.newPlot(elDSC, [{
            type: 'scatter',
            mode: 'markers+text',
            x: xs,
            y: ys,
            text: delegaciones,
            textposition: 'top center',
            textfont: { size: 9, color: 'rgba(255,255,255,0.8)' },
            marker: {
                size: prom.map(p => Math.max(8, Math.min(36, p / 300))),
                color: ys,
                colorscale: [
                    [0,   C.paperBg],
                    [0.4, C.verde],
                    [1,   C.naranja],
                ],
                showscale: true,
                colorbar: {
                    title: { text: 'Becarios', font: { color: '#FFF', size: 10 } },
                    tickfont: { color: '#FFF', size: 9 },
                    thickness: 12,
                },
                line: { color: 'rgba(255,255,255,0.3)', width: 1 },
            },
            hovertemplate: '<b>%{text}</b><br>Beneficiarios: %{y:,}<br>Inversión: $%{x:,.0f}<extra></extra>',
        }], getLayout('Inversión vs Beneficiarios por Delegación', {
            xaxis: { title: 'Inversión Total ($)', tickformat: '$,.0f' },
            yaxis: { title: 'Beneficiarios' },
            margin: { t: 58, r: 30, b: 58, l: 70 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Treemap por Delegación
    // ═══════════════════════════════════════════════════════════════════════
    const elDTM = document.getElementById('chart-delegacion-treemap');
    if (elDTM) {
        elDTM.classList.remove('loading');

        const conteoDel = contarPor(data.filter(d => d.DELEGACION), 'DELEGACION');
        const sumasDel  = sumarPor(data.filter(d => d.DELEGACION), 'DELEGACION', 'IMPORTE');
        const rankingDel = sortedDesc(conteoDel);

        const ids     = ['Total', ...rankingDel.map(r => r[0])];
        const labels  = ['Total', ...rankingDel.map(r => r[0])];
        const parents = ['',      ...rankingDel.map(() => 'Total')];
        const values  = [0,       ...rankingDel.map(r => r[1])];
        const texts   = ['',      ...rankingDel.map(r =>
            r[0] + '<br>' + r[1].toLocaleString('es-MX') + ' becarios<br>$' +
            (sumasDel[r[0]] || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })
        )];

        Plotly.newPlot(elDTM, [{
            type: 'treemap',
            ids, labels, parents, values,
            branchvalues: 'remainder',
            text: texts,
            textinfo: 'text',
            marker: {
                colors: values,
                colorscale: [
                    [0,   'rgba(82,188,163,0.25)'],
                    [0.4, 'rgba(82,188,163,0.85)'],
                    [1,   'rgb(229,134,6)'],
                ],
                showscale: true,
                colorbar: {
                    title: { text: 'Becarios', font: { color: '#FFF', size: 10 } },
                    tickfont: { color: '#FFF', size: 9 },
                    thickness: 12,
                },
                line: { color: C.paperBg, width: 1 },
            },
            textfont: { size: 11, color: '#FFFFFF', family: C.fuente },
            pathbar: { visible: false },
            hovertemplate: '<b>%{label}</b><br>%{value:,} beneficiarios<br>%{percentRoot:.1%} del total<extra></extra>',
        }], getLayout('Distribución por Delegación — Treemap', {
            paper_bgcolor: C.paperBg,
            margin: { t: 58, r: 10, b: 10, l: 10 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Top 15 Colonias por Beneficiarios (barras horizontales)
    // ═══════════════════════════════════════════════════════════════════════
    const elTOP = document.getElementById('chart-top15-colonias');
    if (elTOP) {
        elTOP.classList.remove('loading');

        const conteo  = contarPor(data.filter(d => d.COLONIA), 'COLONIA');
        const ranking = sortedDesc(conteo).slice(0, 15);
        const labels  = ranking.map(r => r[0]);
        const vals    = ranking.map(r => r[1]);
        const sumas   = sumarPor(data.filter(d => d.COLONIA), 'COLONIA', 'IMPORTE');
        const invers  = labels.map(l => sumas[l] || 0);

        const fmt = v => (v || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 });

        Plotly.newPlot(elTOP, [
            {
                type: 'bar',
                orientation: 'h',
                name: 'Beneficiarios',
                x: vals,
                y: labels,
                marker: { color: C.verde },
                text: vals.map(v => v.toLocaleString('es-MX')),
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
                x: invers,
                y: labels,
                marker: {
                    color: C.naranja,
                    size: 10,
                    symbol: 'diamond',
                    line: { color: '#FFF', width: 1 },
                },
                hovertemplate: '<b>%{y}</b><br>Inversión: $%{x:,.0f}<extra></extra>',
                xaxis: 'x2',
            },
        ], getLayout('Top 15 Colonias por Beneficiarios', {
            barmode: 'overlay',
            xaxis:  { title: 'Beneficiarios', gridcolor: 'rgba(255,255,255,0.08)', side: 'bottom' },
            xaxis2: {
                title: 'Inversión Total ($)',
                overlaying: 'x',
                side: 'top',
                showgrid: false,
                tickformat: '$,.0f',
            },
            yaxis:  { autorange: 'reversed' },
            margin: { t: 68, r: 80, b: 68, l: 220 },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.12 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Mapa Coroplético Geográfico — Beneficiarios por Colonia
    // ═══════════════════════════════════════════════════════════════════════
    const elMAP = document.getElementById('chart-mapa-colonias');
    if (elMAP) {
        elMAP.classList.remove('loading');

        const conteoCol = contarPor(data.filter(d => d.COLONIA), 'COLONIA');
        const sumasCol  = sumarPor(data.filter(d => d.COLONIA), 'COLONIA', 'IMPORTE');

        (async () => {
            try {
                const [respGeo, respMun] = await Promise.all([
                    fetch('GeoJsons/COL_LOC_EDO_QRO.geojson'),
                    fetch('GeoJsons/Corregidora.geojson'),
                ]);
                const [geojson, munGeo] = await Promise.all([respGeo.json(), respMun.json()]);

                // Colonias — solo las que tienen datos
                const locs  = [];
                const vals  = [];
                const texts = [];

                geojson.features.forEach(f => {
                    const nom = f.properties && f.properties.NOM_COL;
                    if (nom && conteoCol[nom]) {
                        locs.push(nom);
                        vals.push(conteoCol[nom]);
                        texts.push(
                            `<b>${nom}</b><br>` +
                            `${conteoCol[nom].toLocaleString('es-MX')} becarios<br>` +
                            `$${(sumasCol[nom] || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
                        );
                    }
                });

                const zmax = Math.max(...vals);

                // Contorno del municipio → scattermapbox lines
                const munLat = [], munLon = [];
                munGeo.features.forEach(f => {
                    const geom = f.geometry;
                    const rings = geom.type === 'Polygon'
                        ? [geom.coordinates[0]]
                        : geom.type === 'MultiPolygon'
                            ? geom.coordinates.map(p => p[0])
                            : [];
                    rings.forEach(ring => {
                        ring.forEach(([lon, lat]) => { munLon.push(lon); munLat.push(lat); });
                        munLon.push(null); munLat.push(null);
                    });
                });

                Plotly.newPlot(elMAP, [
                    {
                        type: 'choroplethmapbox',
                        geojson: geojson,
                        featureidkey: 'properties.NOM_COL',
                        locations: locs,
                        z: vals,
                        text: texts,
                        hoverinfo: 'text',
                        colorscale: [
                            [0,    'rgb(255,230,180)'],
                            [0.25, 'rgb(255,180,80)'],
                            [0.55, 'rgb(220,60,30)'],
                            [1,    'rgb(160,10,10)'],
                        ],
                        zmin: 0,
                        zmax: zmax,
                        colorbar: {
                            title: { text: 'Beneficiarios', font: { color: '#FFF', size: 10 } },
                            tickfont: { color: '#FFF', size: 10 },
                            thickness: 12,
                            bgcolor:     'rgba(57,48,83,0.55)',
                            bordercolor: 'rgba(255,255,255,0.14)',
                            borderwidth: 1,
                        },
                        marker: { line: { width: 0 } },
                        showlegend: false,
                    },
                    {
                        type: 'scattermapbox',
                        mode: 'lines',
                        lon: munLon,
                        lat: munLat,
                        line: { color: C.naranja, width: 2 },
                        name: 'Municipio Corregidora',
                        hoverinfo: 'none',
                    },
                ], getLayout('Distribución de Beneficiarios por Colonia', {
                    mapbox: {
                        style: 'carto-darkmatter',
                        center: { lat: 20.465, lon: -100.435 },
                        zoom: 10,
                    },
                    legend: {
                        orientation: 'h',
                        x: 0.5, xanchor: 'center',
                        y: -0.04,
                        font: { color: '#FFF', size: 11 },
                        bgcolor: 'rgba(0,0,0,0)',
                    },
                    margin: { t: 58, r: 10, b: 40, l: 10 },
                }), plotConfig);

            } catch (err) {
                console.error('[MapaColonias]', err);
                elMAP.innerHTML =
                    '<p style="color:#fca5a5;padding:2rem;text-align:center">' +
                    'Error al cargar el GeoJSON de colonias.</p>';
            }
        })();
    }
});
