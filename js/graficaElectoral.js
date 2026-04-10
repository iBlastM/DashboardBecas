// ── GRAFICA_ELECTORAL.JS ── DashboardBecas ─────────────────────────────────────
// Gráficas de la pestaña Electoral:
//   1. Distribución por Distrito Federal (pie)
//   2. Distribución por Distrito Local (pie)
//   3. Inversión vs Beneficiarios por Distrito Local (barras + línea)
//   4. Inversión vs Beneficiarios por Distrito Federal (barras + línea)
//   5. Mapa de Secciones Electorales (choropleth) con Top/Comparativa

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
            showlegend: false,
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
            showlegend: false,
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
        const labsDL = rankingDL.map(r => labelDistrito('DL', r[0]));
        const valsDL = rankingDL.map(r => r[1]);
        const invDL  = rankingDL.map(r => sumasDL[r[0]] || 0);

        Plotly.newPlot(elDLI, [
            {
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Inversión',
                x: labsDL,
                y: invDL,
                line: { color: C.naranja, width: 2 },
                marker: { color: C.naranja, size: 9, symbol: 'diamond' },
                hovertemplate: '<b>%{x}</b><br>Inversión: $%{y:.3s}<extra></extra>',
                yaxis: 'y',
            },
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
                yaxis: 'y2',
            },
        ], getLayout('Inversión vs Beneficiarios por Distrito Local', {
            showlegend: false,
            yaxis:  { title: '', gridcolor: 'rgba(255,255,255,0.08)', tickprefix: '$', tickformat: '.3s' },
            yaxis2: {
                title: '',
                overlaying: 'y',
                side: 'right',
                showgrid: false,
            },
            margin: { t: 58, r: 80, b: 80, l: 70 },
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
        const labsDF = rankingDF.map(r => labelDistrito('DF', r[0]));
        const valsDF = rankingDF.map(r => r[1]);
        const invDF  = rankingDF.map(r => sumasDF[r[0]] || 0);

        Plotly.newPlot(elDFI, [
            {
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Inversión',
                x: labsDF,
                y: invDF,
                line: { color: C.naranja, width: 2 },
                marker: { color: C.naranja, size: 9, symbol: 'diamond' },
                hovertemplate: '<b>%{x}</b><br>Inversión: $%{y:.3s}<extra></extra>',
                yaxis: 'y',
            },
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
                yaxis: 'y2',
            },
        ], getLayout('Inversión vs Beneficiarios por Distrito Federal', {
            showlegend: false,
            yaxis:  { title: '', gridcolor: 'rgba(255,255,255,0.08)', tickprefix: '$', tickformat: '.3s' },
            yaxis2: {
                title: '',
                overlaying: 'y',
                side: 'right',
                showgrid: false,
            },
            margin: { t: 58, r: 80, b: 80, l: 70 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Mapa de Secciones Electorales — Choropleth + Top/Comparativa
    // ═══════════════════════════════════════════════════════════════════════
    const elMAPSEC = document.getElementById('chart-mapa-secciones');
    if (elMAPSEC) {
        elMAPSEC.classList.remove('loading');

        let _geoSec  = null;
        let _secListenerAdded = false;
        let _secMetrica  = 'beneficiarios';  // 'beneficiarios' | 'inversion'
        let _secMode     = 'top';
        let _secZoom     = 11;
        let _secSel      = new Set();
        let _secSelTmp   = new Set();

        const validSE  = data.filter(d => d.SECCION_ELECTORAL != null);
        const conteoSE = contarPor(validSE, 'SECCION_ELECTORAL');
        const sumasSE  = sumarPor(validSE, 'SECCION_ELECTORAL', 'IMPORTE');

        const getSecKeys = () =>
            _secMetrica === 'beneficiarios'
                ? sortedDesc(conteoSE).map(r => r[0])
                : Object.entries(sumasSE).sort((a, b) => b[1] - a[1]).map(r => +r[0]);

        let _geoMun = null;

        const renderMapaSec = async (filtKeys) => {
            try {
                if (!_geoSec) {
                    const raw = await fetch('GeoJsons/SE_EDO_QRO_24_25.geojson').then(r => r.json());
                    // Filtrar solo Corregidora (CU_MUN = '22006')
                    _geoSec = {
                        type: 'FeatureCollection',
                        features: raw.features.filter(f => f.properties?.CU_MUN === '22006'),
                    };
                }
                if (!_geoMun) {
                    _geoMun = await fetch('GeoJsons/Corregidora.geojson').then(r => r.json());
                }

                const useKeys = filtKeys ? new Set(filtKeys.map(Number)) : null;
                const vals  = [], locs = [], texts = [];

                _geoSec.features.forEach(f => {
                    const sec = f.properties?.['25_SECCION'];
                    if (sec == null) return;
                    const secNum = Number(sec);
                    if (useKeys && !useKeys.has(secNum)) return;
                    const ben = conteoSE[secNum] || 0;
                    const inv = sumasSE[secNum] || 0;
                    if (ben === 0 && inv === 0) return;
                    locs.push(secNum);
                    vals.push(_secMetrica === 'beneficiarios' ? ben : inv);
                    texts.push(
                        '<b>Sección ' + secNum + '</b><br>' +
                        ben.toLocaleString('es-MX') + ' beneficiarios<br>' +
                        'Inversión: $' + inv.toLocaleString('es-MX', { maximumFractionDigits: 0 })
                    );
                });

                if (!vals.length) {
                    elMAPSEC.innerHTML = '<p style="color:rgba(255,255,255,0.35);padding:2rem;text-align:center">Sin datos para esta selección.</p>';
                    return;
                }

                const zmax = Math.max(...vals);
                const esBen = _secMetrica === 'beneficiarios';

                // Extraer coordenadas del perímetro del municipio para scattermapbox
                const munLat = [], munLon = [];
                _geoMun.features.forEach(f => {
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

                Plotly.newPlot(elMAPSEC, [
                    {
                    type: 'choroplethmapbox',
                    geojson: _geoSec,
                    featureidkey: 'properties.25_SECCION',
                    locations: locs,
                    z: vals,
                    text: texts,
                    hoverinfo: 'text',
                    colorscale: esBen
                        ? [[0, 'rgb(255,230,180)'], [0.25, 'rgb(255,180,80)'], [0.55, 'rgb(220,60,30)'], [1, 'rgb(160,10,10)']]
                        : [[0, 'rgb(200,230,255)'], [0.25, 'rgb(80,160,230)'], [0.55, 'rgb(10,80,200)'], [1, 'rgb(5,30,120)']],
                    zmin: 0,
                    zmax,
                    colorbar: {
                        title: { text: esBen ? 'Beneficiarios' : 'Inversión ($)', font: { color: '#FFF', size: 10 } },
                        tickfont: { color: '#FFF', size: 10 },
                        tickformat: esBen ? ',d' : '$,.0f',
                        thickness: 12,
                        bgcolor: C.paperBg,
                        bordercolor: 'rgba(255,255,255,0.14)',
                        borderwidth: 1,
                    },
                    marker: { line: { width: 1, color: 'rgba(255,255,255,0.25)' } },
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
                        showlegend: false,
                    },
                ], getLayout('Distribución de Beneficiarios/Inversión por Sección', {
                    mapbox: {
                        style: 'carto-darkmatter',
                        center: { lat: 20.525, lon: -100.430 },
                        zoom: _secZoom,
                    },
                    margin: { t: 106, r: 10, b: 10, l: 10 },
                }), plotConfig);

                if (!_secListenerAdded) {
                    _secListenerAdded = true;
                    elMAPSEC.on('plotly_relayout', ev => {
                        if (ev['mapbox.zoom'] !== undefined) _secZoom = ev['mapbox.zoom'];
                    });
                }

            } catch (err) {
                console.error('[MapaSecciones]', err);
                elMAPSEC.innerHTML =
                    '<p style="color:#fca5a5;padding:2rem;text-align:center">' +
                    'Error al cargar el GeoJSON de secciones.</p>';
            }
        };

        const secSelectEl  = document.getElementById('sec-mapa-top-n');
        const secModalEl   = document.getElementById('modal-mapa-sec');
        const secChecksEl  = document.getElementById('modal-mapa-sec-checks');
        const secCompToggle  = document.querySelectorAll('#sec-topcomp-toggle .vt-btn');
        const secMetricToggle = document.querySelectorAll('#sec-metrica-toggle .vt-btn');

        const renderSecTop  = (n) => renderMapaSec(getSecKeys().slice(0, n));
        const renderSecComp = (sel) => renderMapaSec(
            sel.size ? getSecKeys().filter(k => sel.has(k)) : getSecKeys()
        );

        const buildSecChecks = () => {
            secChecksEl.innerHTML = '';
            getSecKeys().forEach(k => {
                const lbl = document.createElement('label');
                lbl.className = 'rng-opt';
                const cb  = document.createElement('input');
                cb.type   = 'checkbox';
                cb.value  = k;
                cb.checked = _secSelTmp.has(k);
                cb.addEventListener('change', () => {
                    if (cb.checked) _secSelTmp.add(k); else _secSelTmp.delete(k);
                });
                const sp = document.createElement('span');
                sp.textContent = 'Sección ' + k;
                lbl.append(cb, sp);
                secChecksEl.appendChild(lbl);
            });
        };

        const openSecModal  = () => {
            _secSelTmp = new Set(_secSel);
            buildSecChecks();
            secModalEl.removeAttribute('hidden');
        };
        const closeSecModal = () => secModalEl.setAttribute('hidden', '');

        secModalEl?.addEventListener('click', e => { if (e.target === secModalEl) closeSecModal(); });
        secModalEl?.querySelector('.rng-modal-close')?.addEventListener('click', closeSecModal);
        secModalEl?.querySelector('.rng-cancel-btn')?.addEventListener('click', closeSecModal);
        secModalEl?.querySelector('[data-action="all"]')?.addEventListener('click', () => {
            getSecKeys().forEach(k => _secSelTmp.add(k));
            secChecksEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        });
        secModalEl?.querySelector('[data-action="none"]')?.addEventListener('click', () => {
            _secSelTmp.clear();
            secChecksEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        });
        secModalEl?.querySelector('.rng-apply-btn')?.addEventListener('click', () => {
            _secSel = new Set(_secSelTmp);
            closeSecModal();
            renderSecComp(_secSel);
        });

        secMetricToggle.forEach(btn => {
            btn.addEventListener('click', () => {
                _secMetrica = btn.dataset.metrica;
                secMetricToggle.forEach(b => b.classList.toggle('active', b === btn));
                _secSel = new Set();
                if (_secMode === 'top') renderSecTop(+(secSelectEl?.value ?? 15));
                else renderSecComp(_secSel);
            });
        });

        secCompToggle.forEach(btn => {
            btn.addEventListener('click', () => {
                _secMode = btn.dataset.view;
                secCompToggle.forEach(b => b.classList.toggle('active', b === btn));
                if (_secMode === 'top') {
                    if (secSelectEl) secSelectEl.style.display = '';
                    renderSecTop(+(secSelectEl?.value ?? 15));
                } else {
                    if (secSelectEl) secSelectEl.style.display = 'none';
                    openSecModal();
                }
            });
        });

        secSelectEl?.addEventListener('change', () => {
            if (_secMode === 'top') renderSecTop(+secSelectEl.value);
        });

        document.getElementById('sec-mapa-zoom-in')?.addEventListener('click', () => {
            _secZoom = Math.min(18, _secZoom + 1);
            Plotly.relayout(elMAPSEC, { 'mapbox.zoom': _secZoom });
        });
        document.getElementById('sec-mapa-zoom-out')?.addEventListener('click', () => {
            _secZoom = Math.max(0, _secZoom - 1);
            Plotly.relayout(elMAPSEC, { 'mapbox.zoom': _secZoom });
        });
        document.getElementById('sec-mapa-fullscreen')?.addEventListener('click', () => {
            const cont = elMAPSEC.closest('.chart-card') || elMAPSEC;
            if (!document.fullscreenElement) {
                cont.requestFullscreen?.().catch(() => {});
            } else {
                document.exitFullscreen?.();
            }
        });

        renderSecTop(+(secSelectEl?.value ?? 15));
    }
});
