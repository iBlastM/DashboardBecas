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

        const conteoDel  = contarPor(data.filter(d => d.DELEGACION), 'DELEGACION');
        const sumasDel   = sumarPor(data.filter(d => d.DELEGACION), 'DELEGACION', 'IMPORTE');
        const fullRankDel = sortedDesc(conteoDel);

        const renderTopDelegacion = (n) => {
            const rankingDel = fullRankDel.slice(0, n);
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
            ], getLayout(`Top ${n} Delegaciones · Beneficiarios e Inversión`, {
                barmode: 'overlay',
                xaxis:  { title: 'Beneficiarios', gridcolor: 'rgba(255,255,255,0.08)' },
                xaxis2: {
                    overlaying: 'x',
                    side: 'top',
                    showgrid: false,
                    tickformat: '$,.0f',
                },
                yaxis: { autorange: 'reversed' },
                margin: { t: 78, r: 80, b: 90, l: 240 },
                legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.20 },
            }), plotConfig);
        };

        elDEL._renderTop = renderTopDelegacion;
        const selDEL = document.querySelector('[data-chart="chart-delegacion-barras"]');
        const nDEL   = +(selDEL?.querySelector('.top-btn.active')?.dataset.n ?? 15);
        renderTopDelegacion(nDEL);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Scatter: Inversión vs Beneficiarios por Delegación (con nivel educativo)
    // ═══════════════════════════════════════════════════════════════════════
    const elDSC = document.getElementById('chart-delegacion-scatter');
    if (elDSC) {
        elDSC.classList.remove('loading');

        const conteoDel  = contarPor(data.filter(d => d.DELEGACION), 'DELEGACION');
        const sumasDel   = sumarPor(data.filter(d => d.DELEGACION), 'DELEGACION', 'IMPORTE');
        const todasDel   = Object.keys(conteoDel);

        // Build checklist items
        const itemsEl = document.getElementById('delegacion-scatter-items');
        if (itemsEl) {
            itemsEl.innerHTML = todasDel.map(del =>
                `<label class="chk-item">
                    <input type="checkbox" class="dsc-chk" value="${del}" checked>
                    <span title="${del}">${del}</span>
                </label>`
            ).join('');
        }

        const renderScatter = () => {
            const checked      = new Set([...document.querySelectorAll('.dsc-chk:checked')].map(c => c.value));
            const delegaciones = todasDel.filter(d => checked.has(d));
            const xs   = delegaciones.map(k => sumasDel[k] || 0);
            const ys   = delegaciones.map(k => conteoDel[k]);
            const prom = delegaciones.map((k, i) => ys[i] > 0 ? xs[i] / ys[i] : 0);

            Plotly.react(elDSC, [{
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
        };

        renderScatter();

        if (itemsEl) {
            itemsEl.addEventListener('change', () => {
                renderScatter();
                updateLabel();
            });
        }

        // Dropdown toggle
        const toggleBtn   = document.getElementById('dsc-toggle');
        const panel       = document.getElementById('delegacion-scatter-filter');
        const labelEl     = document.getElementById('dsc-toggle-label');

        const updateLabel = () => {
            const total   = document.querySelectorAll('.dsc-chk').length;
            const checked = document.querySelectorAll('.dsc-chk:checked').length;
            labelEl.textContent = checked === total ? 'Delegaciones' :
                                  checked === 0     ? 'Sin selección' :
                                  `${checked} / ${total}`;
        };

        toggleBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = panel.classList.toggle('open');
            toggleBtn.classList.toggle('open', open);
        });

        document.addEventListener('click', (e) => {
            if (!toggleBtn?.contains(e.target) && !panel?.contains(e.target)) {
                panel?.classList.remove('open');
                toggleBtn?.classList.remove('open');
            }
        });

        document.getElementById('dsc-all')?.addEventListener('click', () => {
            document.querySelectorAll('.dsc-chk').forEach(c => c.checked = true);
            renderScatter();
            updateLabel();
        });
        document.getElementById('dsc-none')?.addEventListener('click', () => {
            document.querySelectorAll('.dsc-chk').forEach(c => c.checked = false);
            renderScatter();
            updateLabel();
        });
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
    // 4. Top Colonias por Beneficiarios (barras horizontales)
    // ═══════════════════════════════════════════════════════════════════════
    const elTOP = document.getElementById('chart-top15-colonias');
    if (elTOP) {
        elTOP.classList.remove('loading');

        const conteo   = contarPor(data.filter(d => d.COLONIA), 'COLONIA');
        const sumasT   = sumarPor(data.filter(d => d.COLONIA), 'COLONIA', 'IMPORTE');
        const fullRank = sortedDesc(conteo);

        const fmt = v => (v || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 });

        const renderTopColonias = (n) => {
            const ranking = fullRank.slice(0, n);
            const labels  = ranking.map(r => r[0]);
            const vals    = ranking.map(r => r[1]);
            const invers  = labels.map(l => sumasT[l] || 0);

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
            ], getLayout(`Top ${n} Colonias por Beneficiarios`, {
                barmode: 'overlay',
                xaxis:  { title: 'Beneficiarios', gridcolor: 'rgba(255,255,255,0.08)', side: 'bottom' },
                xaxis2: {
                    overlaying: 'x',
                    side: 'top',
                    showgrid: false,
                    tickformat: '$,.0f',
                },
                yaxis:  { autorange: 'reversed' },
                margin: { t: 78, r: 80, b: 90, l: 220 },
                legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.20 },
            }), plotConfig);
        };

        elTOP._renderTop = renderTopColonias;
        const selTOP = document.querySelector('[data-chart="chart-top15-colonias"]');
        const nTOP   = +(selTOP?.querySelector('.top-btn.active')?.dataset.n ?? 15);
        renderTopColonias(nTOP);
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

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Análisis de Proximidad — Distancia alumno ↔ escuela (Haversine)
    // ═══════════════════════════════════════════════════════════════════════

    /** Distancia Haversine en km entre dos puntos. */
    function haversineKm(lat1, lon1, lat2, lon2) {
        const R   = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // Calcular distancias solo para registros con coordenadas completas y delegación válida
    const conDistRaw = data
        .filter(d =>
            d.DELEGACION &&
            d.LATITUD != null && d.LONGITUD != null &&
            d.LAT_ESCUELA != null && d.LONG_ESCUELA != null
        )
        .map(d => ({
            ...d,
            DISTANCIA_KM: haversineKm(d.LATITUD, d.LONGITUD, d.LAT_ESCUELA, d.LONG_ESCUELA),
        }));

    // Eliminar outliers: distancias por encima del percentil 99 (coordenadas erróneas)
    const _sortedRaw = conDistRaw.map(d => d.DISTANCIA_KM).sort((a, b) => a - b);
    const _p99       = _sortedRaw[Math.floor(_sortedRaw.length * 0.99)] ?? Infinity;
    const conDist    = conDistRaw.filter(d => d.DISTANCIA_KM <= _p99);

    // Quitar estado de carga en los tres contenedores siempre
    const _proxIds = ['chart-proximidad-histograma', 'chart-proximidad-delegacion', 'chart-proximidad-scatter'];
    _proxIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('loading');
    });

    if (!conDist.length) {
        _proxIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML =
                '<p style="color:rgba(255,255,255,0.35);padding:2rem;text-align:center;font-size:0.85rem">' +
                'Sin datos de proximidad para esta selección.</p>';
        });
    } else {

    // ── 6a. Histograma de distancias ─────────────────────────────────────
    const elHIST = document.getElementById('chart-proximidad-histograma');
    if (elHIST) {

        const dists      = conDist.map(d => d.DISTANCIA_KM);
        const promGlobal = dists.reduce((a, b) => a + b, 0) / dists.length;
        const mediana    = [...dists].sort((a, b) => a - b)[Math.floor(dists.length / 2)];
        const sinMovil   = dists.filter(d => d <= 2).length;
        const pctSinMovil = ((sinMovil / dists.length) * 100).toFixed(1);
        const xMax       = Math.ceil(_p99 + 0.5);

        Plotly.newPlot(elHIST, [
            {
                type: 'histogram',
                x: dists,
                xbins: { start: 0, end: xMax, size: 0.5 },
                name: 'Beneficiarios',
                marker: {
                    color: C.verde,
                    line: { color: 'rgba(0,0,0,0.25)', width: 0.5 },
                },
                hovertemplate: '%{x:.1f}–%{x:.1f} km<br>Beneficiarios: %{y:,}<extra></extra>',
            },
        ], getLayout(
            `Distribución de Distancias Alumno → Escuela · ${pctSinMovil}% recorre ≤ 2 km`,
            {
                xaxis: { title: 'Distancia (km)', range: [0, xMax], dtick: Math.max(1, Math.floor(xMax / 15)) },
                yaxis: { title: 'Beneficiarios' },
                bargap: 0.05,
                legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.20 },
                margin: { t: 64, r: 20, b: 80, l: 70 },
                annotations: [
                    {
                        x: 2,
                        y: 0.01,
                        xref: 'x',
                        yref: 'paper',
                        yanchor: 'bottom',
                        text: '← zona local (≤ 2 km)',
                        showarrow: false,
                        font: { color: 'rgba(255,255,255,0.45)', size: 10 },
                        xanchor: 'left',
                    },
                    {
                        x: promGlobal,
                        y: 0.97,
                        xref: 'x',
                        yref: 'paper',
                        text: `Prom. ${promGlobal.toFixed(2)} km`,
                        showarrow: false,
                        font: { color: C.naranja, size: 10 },
                        xanchor: 'left',
                        bgcolor: 'rgba(0,0,0,0.35)',
                        borderpad: 3,
                    },
                    {
                        x: mediana,
                        y: 0.85,
                        xref: 'x',
                        yref: 'paper',
                        text: `Med. ${mediana.toFixed(2)} km`,
                        showarrow: false,
                        font: { color: '#a78bfa', size: 10 },
                        xanchor: 'left',
                        bgcolor: 'rgba(0,0,0,0.35)',
                        borderpad: 3,
                    },
                ],
                shapes: [
                    {
                        // zona verde ≤ 2 km
                        type: 'rect',
                        x0: 0, x1: 2,
                        y0: 0, y1: 1,
                        xref: 'x', yref: 'paper',
                        fillcolor: 'rgba(82,188,163,0.10)',
                        line: { width: 0 },
                    },
                    {
                        // línea de promedio
                        type: 'line',
                        x0: promGlobal, x1: promGlobal,
                        y0: 0, y1: 1,
                        xref: 'x', yref: 'paper',
                        line: { color: C.naranja, width: 2, dash: 'dash' },
                    },
                    {
                        // línea de mediana
                        type: 'line',
                        x0: mediana, x1: mediana,
                        y0: 0, y1: 1,
                        xref: 'x', yref: 'paper',
                        line: { color: '#a78bfa', width: 2, dash: 'dot' },
                    },
                ],
            }
        ), plotConfig);
    }

    // ── 6b. Distancia promedio por delegación (barras + umbral) ──────────
    const elDELDIST = document.getElementById('chart-proximidad-delegacion');
    if (elDELDIST) {

        // Agrupar por delegación (ya excluye sin delegación por el filtro de conDist)
        const sumDel = {}, cntDel = {}, p75Del = {};
        conDist.forEach(d => {
            const del = d.DELEGACION;
            sumDel[del] = (sumDel[del] || 0) + d.DISTANCIA_KM;
            cntDel[del] = (cntDel[del] || 0) + 1;
            if (!p75Del[del]) p75Del[del] = [];
            p75Del[del].push(d.DISTANCIA_KM);
        });

        const delegacionesFull = Object.keys(sumDel)
            .map(del => ({
                del,
                prom: sumDel[del] / cntDel[del],
                cnt:  cntDel[del],
                p75:  (() => {
                    const sorted = p75Del[del].sort((a, b) => a - b);
                    return sorted[Math.floor(sorted.length * 0.75)];
                })(),
            }))
            .sort((a, b) => b.prom - a.prom);

        const promGlobal = conDist.reduce((s, d) => s + d.DISTANCIA_KM, 0) / conDist.length;

        const renderTopDelDist = (n) => {
            const delegaciones = delegacionesFull.slice(0, n);
            const labels = delegaciones.map(d => d.del);
            const proms  = delegaciones.map(d => d.prom);
            const p75s   = delegaciones.map(d => d.p75);
            const cnts   = delegaciones.map(d => d.cnt);

            Plotly.newPlot(elDELDIST, [
                {
                    type: 'bar',
                    orientation: 'h',
                    name: 'Distancia promedio',
                    x: proms,
                    y: labels,
                    marker: {
                        color: proms.map(p => p > promGlobal ? C.naranja : C.verde),
                        line: { color: 'rgba(0,0,0,0.2)', width: 0.5 },
                    },
                    text: proms.map(p => p.toFixed(2) + ' km'),
                    textposition: 'outside',
                    textfont: { color: '#FFF', size: 10 },
                    cliponaxis: false,
                    customdata: cnts,
                    hovertemplate: '<b>%{y}</b><br>Promedio: %{x:.2f} km<br>Beneficiarios: %{customdata:,}<extra></extra>',
                },
                {
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Percentil 75',
                    x: p75s,
                    y: labels,
                    marker: {
                        color: '#a78bfa',
                        size: 8,
                        symbol: 'diamond',
                        line: { color: '#FFF', width: 1 },
                    },
                    hovertemplate: '<b>%{y}</b><br>P75: %{x:.2f} km<extra></extra>',
                },
                {
                    type: 'scatter',
                    mode: 'lines',
                    name: `Promedio global (${promGlobal.toFixed(2)} km)`,
                    x: [promGlobal, promGlobal],
                    y: [labels[labels.length - 1], labels[0]],
                    line: { color: '#facc15', width: 2, dash: 'dash' },
                    hoverinfo: 'skip',
                },
            ], getLayout(`Top ${n} Delegaciones — Distancia Promedio Alumno → Escuela`, {
                xaxis:  { title: { text: 'Distancia (km)', standoff: 18 }, gridcolor: 'rgba(255,255,255,0.08)' },
                yaxis:  { autorange: 'reversed' },
                legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.24 },
                margin: { t: 58, r: 80, b: 110, l: 240 },
                shapes: [{
                    type: 'line',
                    x0: 2, x1: 2,
                    y0: 0, y1: 1,
                    yref: 'paper',
                    line: { color: 'rgba(82,188,163,0.4)', width: 1, dash: 'dot' },
                }],
            }), plotConfig);
        };

        elDELDIST._renderTop = renderTopDelDist;
        const selDELDIST = document.querySelector('[data-chart="chart-proximidad-delegacion"]');
        const nDELDIST   = +(selDELDIST?.querySelector('.top-btn.active')?.dataset.n ?? 15);
        renderTopDelDist(nDELDIST);
    }

    // ── 6c. Scatter: distancia vs importe (¿se compensa la movilidad?) ───
    const elSCATDIST = document.getElementById('chart-proximidad-scatter');
    if (elSCATDIST) {

        // Agrupar por delegación para mostrar puntos agregados (evita sobreplotting)
        const delMap = {};
        conDist.forEach(d => {
            const del = d.DELEGACION;
            if (!delMap[del]) delMap[del] = { dists: [], importes: [], cnt: 0 };
            delMap[del].dists.push(d.DISTANCIA_KM);
            delMap[del].importes.push(d.IMPORTE);
            delMap[del].cnt++;
        });

        const agg = Object.entries(delMap).map(([del, v]) => ({
            del,
            distProm: v.dists.reduce((a, b) => a + b, 0) / v.cnt,
            impProm:  v.importes.reduce((a, b) => a + b, 0) / v.cnt,
            cnt:      v.cnt,
        }));

        Plotly.newPlot(elSCATDIST, [{
            type: 'scatter',
            mode: 'markers+text',
            x: agg.map(a => a.distProm),
            y: agg.map(a => a.impProm),
            text: agg.map(a => a.del),
            textposition: 'top center',
            textfont: { size: 9, color: 'rgba(255,255,255,0.75)' },
            marker: {
                size: agg.map(a => Math.max(10, Math.min(45, Math.sqrt(a.cnt) * 2.5))),
                color: agg.map(a => a.distProm),
                colorscale: [
                    [0,   C.verde],
                    [0.5, C.naranja],
                    [1,   '#ef4444'],
                ],
                showscale: true,
                colorbar: {
                    title: { text: 'km prom.', font: { color: '#FFF', size: 10 } },
                    tickfont: { color: '#FFF', size: 9 },
                    ticksuffix: ' km',
                    thickness: 12,
                },
                line: { color: 'rgba(255,255,255,0.3)', width: 1 },
            },
            customdata: agg.map(a => a.cnt),
            hovertemplate:
                '<b>%{text}</b><br>' +
                'Distancia prom.: %{x:.2f} km<br>' +
                'Beca prom.: $%{y:,.0f}<br>' +
                'Beneficiarios: %{customdata:,}<extra></extra>',
        }], getLayout('Distancia vs Beca Promedio por Delegación', {
            xaxis: { title: 'Distancia promedio al centro escolar (km)' },
            yaxis: { title: 'Importe promedio de beca ($)', tickformat: '$,.0f' },
            margin: { t: 58, r: 30, b: 60, l: 90 },
        }), plotConfig);
    }
    } 
});
