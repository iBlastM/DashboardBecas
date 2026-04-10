// ── GRAFICA_TERRITORIAL.JS ── DashboardBecas ──────────────────────────────────
// Gráficas de la pestaña Territorial:
//   1. Beneficiarios por Delegación (barras horizontales + Top/Comparativa)
//   2. Treemap por Delegación (Top/Comparativa, negritas, comas)
//   3. Top Colonias por Beneficiarios (burbujas + Top/Comparativa)
//   4. Mapa coroplético por Colonia o Delegación (Top/Comparativa + zoom)
//   5. Análisis de Proximidad (oculto, mantenido para uso futuro)

document.addEventListener('datosListos', () => {
    const data = window.dashData;

    // ── Helpers ──────────────────────────────────────────────────────────────
    const _articulosMin = new Set([
        'de','del','la','el','los','las','y','e','o','u',
        'en','a','por','para','con','al','sin','ni','no','lo',
    ]);
    const toTitleCase = s => {
        if (!s) return '';
        return String(s).toLowerCase().split(/\s+/).map((w, i) => {
            if (i !== 0 && _articulosMin.has(w)) return w;
            return w.charAt(0).toUpperCase() + w.slice(1);
        }).join(' ');
    };

    const bubbleSizes = (vals, minPx = 14, maxPx = 70) => {
        const max = Math.max(...vals, 1);
        return vals.map(v => minPx + (maxPx - minPx) * Math.sqrt(v / max));
    };

    // ── Shared factory: Top/Comparativa para barras horizontales ─────────────
    const crearBarrasTopComp = ({
        chartId, campo, metricaLabel, invertField,
        selectId, modalId, checksId,
        titulo, defaultN,
    }) => {
        const el = document.getElementById(chartId);
        if (!el) return;
        el.classList.remove('loading');

        const filtered = data.filter(d => d[campo]);
        const conteo   = contarPor(filtered, campo);
        const sumas    = sumarPor(filtered, campo, invertField);
        const fullRank = sortedDesc(conteo);
        const allKeys  = fullRank.map(r => r[0]);

        let seleccion = new Set(allKeys.slice(0, defaultN));
        let selTmp    = new Set(seleccion);
        let viewMode  = 'top';

        const card     = el.closest('.chart-card');
        const selectEl = document.getElementById(selectId);
        const modalEl  = document.getElementById(modalId);
        const checksEl = document.getElementById(checksId);
        const vtBtns   = card?.querySelectorAll('.vt-btn');

        const renderBarras = (keys, chartTitulo) => {
            const labels = keys.map(toTitleCase);
            const vals   = keys.map(k => conteo[k] || 0);
            const invers = keys.map(k => sumas[k] || 0);
            const colors = keys.map((_, i) => i === 0 ? C.naranja : C.verde);

            Plotly.newPlot(el, [
                {
                    type: 'bar',
                    orientation: 'h',
                    name: metricaLabel,
                    x: vals,
                    y: labels,
                    marker: { color: colors },
                    text: vals.map(v => v.toLocaleString('es-MX')),
                    textposition: 'outside',
                    textfont: { color: '#FFF', size: 11 },
                    cliponaxis: false,
                    hovertemplate: '<b>%{y}</b><br>%{x:,} ' + metricaLabel.toLowerCase() + '<extra></extra>',
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
            ], getLayout(chartTitulo, {
                barmode: 'overlay',
                xaxis: {
                    title: '',
                    tickformat: ',',
                    gridcolor: 'rgba(255,255,255,0.08)',
                },
                xaxis2: {
                    overlaying: 'x',
                    side: 'top',
                    showgrid: false,
                    tickformat: '$,.0f',
                },
                yaxis: { autorange: 'reversed' },
                margin: { t: 78, r: 80, b: 60, l: 240 },
                legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.15 },
            }), plotConfig);
        };

        const renderTop = (n) =>
            renderBarras(allKeys.slice(0, n), `Top ${n} ${titulo}`);
        const renderComparativa = (sel) => {
            const keys = sel.size > 0 ? allKeys.filter(k => sel.has(k)) : allKeys;
            renderBarras(keys, `Comparativa · ${titulo}`);
        };

        const buildChecks = () => {
            checksEl.innerHTML = '';
            allKeys.forEach(k => {
                const lbl = document.createElement('label');
                lbl.className = 'rng-opt';
                const cb  = document.createElement('input');
                cb.type   = 'checkbox';
                cb.value  = k;
                cb.checked = selTmp.has(k);
                cb.addEventListener('change', () => {
                    if (cb.checked) selTmp.add(k); else selTmp.delete(k);
                });
                const sp = document.createElement('span');
                sp.textContent = toTitleCase(k);
                lbl.append(cb, sp);
                checksEl.appendChild(lbl);
            });
        };

        const openModal  = () => {
            selTmp = new Set(seleccion);
            buildChecks();
            modalEl.removeAttribute('hidden');
        };
        const closeModal = () => modalEl.setAttribute('hidden', '');

        modalEl?.addEventListener('click', e => { if (e.target === modalEl) closeModal(); });
        modalEl?.querySelector('.rng-modal-close')?.addEventListener('click', closeModal);
        modalEl?.querySelector('.rng-cancel-btn')?.addEventListener('click', closeModal);
        modalEl?.querySelector('[data-action="all"]')?.addEventListener('click', () => {
            allKeys.forEach(k => selTmp.add(k));
            checksEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        });
        modalEl?.querySelector('[data-action="none"]')?.addEventListener('click', () => {
            selTmp.clear();
            checksEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        });
        modalEl?.querySelector('.rng-apply-btn')?.addEventListener('click', () => {
            seleccion = new Set(selTmp);
            closeModal();
            renderComparativa(seleccion);
        });

        vtBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                viewMode = btn.dataset.view;
                vtBtns.forEach(b => b.classList.toggle('active', b === btn));
                if (viewMode === 'top') {
                    if (selectEl) selectEl.style.display = '';
                    renderTop(+(selectEl?.value ?? defaultN));
                } else {
                    if (selectEl) selectEl.style.display = 'none';
                    openModal();
                }
            });
        });

        selectEl?.addEventListener('change', () => {
            if (viewMode === 'top') renderTop(+selectEl.value);
        });

        renderTop(+(selectEl?.value ?? defaultN));
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Beneficiarios por Delegación (barras horizontales)
    // ═══════════════════════════════════════════════════════════════════════
    crearBarrasTopComp({
        chartId:      'chart-delegacion-barras',
        campo:        'DELEGACION',
        metricaLabel: 'Beneficiarios',
        invertField:  'IMPORTE',
        selectId:     'del-barras-top-n',
        modalId:      'modal-del-barras',
        checksId:     'modal-del-barras-checks',
        titulo:       'Delegaciones · Beneficiarios e Inversión',
        defaultN:     15,
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Treemap por Delegación
    // ═══════════════════════════════════════════════════════════════════════
    const elDTM = document.getElementById('chart-delegacion-treemap');
    if (elDTM) {
        elDTM.classList.remove('loading');

        const conteoDel   = contarPor(data.filter(d => d.DELEGACION), 'DELEGACION');
        const sumasDel    = sumarPor(data.filter(d => d.DELEGACION), 'DELEGACION', 'IMPORTE');
        const fullRankDel = sortedDesc(conteoDel);
        const allKeysDel  = fullRankDel.map(r => r[0]);

        let selTMDel = new Set(allKeysDel.slice(0, 15));
        let selTMTmp = new Set(selTMDel);
        let tmView   = 'top';

        const cardTM   = elDTM.closest('.chart-card');
        const selectTM = document.getElementById('del-treemap-top-n');
        const modalTM  = document.getElementById('modal-del-treemap');
        const checksTM = document.getElementById('modal-del-treemap-checks');
        const vtBtnsTM = cardTM?.querySelectorAll('.vt-btn');

        const renderTreemap = (keys) => {
            const ids     = ['Total', ...keys];
            const labels  = ['Total', ...keys.map(toTitleCase)];
            const parents = ['',      ...keys.map(() => 'Total')];
            const values  = [0,       ...keys.map(k => conteoDel[k] || 0)];
            const texts   = ['',      ...keys.map(k =>
                '<b>' + toTitleCase(k) + '</b><br>' +
                (conteoDel[k] || 0).toLocaleString('es-MX') + ' becarios<br>$' +
                (sumasDel[k] || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })
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
            }], getLayout('Distribución de Beneficiarios por Delegación', {
                paper_bgcolor: C.paperBg,
                margin: { t: 58, r: 10, b: 10, l: 10 },
            }), plotConfig);
        };

        const buildChecksTM = () => {
            checksTM.innerHTML = '';
            allKeysDel.forEach(k => {
                const lbl = document.createElement('label');
                lbl.className = 'rng-opt';
                const cb  = document.createElement('input');
                cb.type   = 'checkbox';
                cb.value  = k;
                cb.checked = selTMTmp.has(k);
                cb.addEventListener('change', () => {
                    if (cb.checked) selTMTmp.add(k); else selTMTmp.delete(k);
                });
                const sp = document.createElement('span');
                sp.textContent = toTitleCase(k);
                lbl.append(cb, sp);
                checksTM.appendChild(lbl);
            });
        };

        const openModalTM  = () => {
            selTMTmp = new Set(selTMDel);
            buildChecksTM();
            modalTM.removeAttribute('hidden');
        };
        const closeModalTM = () => modalTM.setAttribute('hidden', '');

        modalTM?.addEventListener('click', e => { if (e.target === modalTM) closeModalTM(); });
        modalTM?.querySelector('.rng-modal-close')?.addEventListener('click', closeModalTM);
        modalTM?.querySelector('.rng-cancel-btn')?.addEventListener('click', closeModalTM);
        modalTM?.querySelector('[data-action="all"]')?.addEventListener('click', () => {
            allKeysDel.forEach(k => selTMTmp.add(k));
            checksTM.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        });
        modalTM?.querySelector('[data-action="none"]')?.addEventListener('click', () => {
            selTMTmp.clear();
            checksTM.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        });
        modalTM?.querySelector('.rng-apply-btn')?.addEventListener('click', () => {
            selTMDel = new Set(selTMTmp);
            closeModalTM();
            const keys = selTMDel.size > 0 ? allKeysDel.filter(k => selTMDel.has(k)) : allKeysDel;
            renderTreemap(keys);
        });

        vtBtnsTM?.forEach(btn => {
            btn.addEventListener('click', () => {
                tmView = btn.dataset.view;
                vtBtnsTM.forEach(b => b.classList.toggle('active', b === btn));
                if (tmView === 'top') {
                    if (selectTM) selectTM.style.display = '';
                    renderTreemap(allKeysDel.slice(0, +(selectTM?.value ?? 15)));
                } else {
                    if (selectTM) selectTM.style.display = 'none';
                    openModalTM();
                }
            });
        });

        selectTM?.addEventListener('change', () => {
            if (tmView === 'top') renderTreemap(allKeysDel.slice(0, +selectTM.value));
        });

        renderTreemap(allKeysDel.slice(0, +(selectTM?.value ?? 15)));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Top Colonias por Beneficiarios (burbujas)
    // ═══════════════════════════════════════════════════════════════════════
    const elTOP = document.getElementById('chart-top15-colonias');
    if (elTOP) {
        elTOP.classList.remove('loading');

        const conteoCol   = contarPor(data.filter(d => d.COLONIA), 'COLONIA');
        const sumasCol    = sumarPor(data.filter(d => d.COLONIA), 'COLONIA', 'IMPORTE');
        const fullRankCol = sortedDesc(conteoCol);
        const allKeysCol  = fullRankCol.map(r => r[0]);

        let selColSel = new Set(allKeysCol.slice(0, 15));
        let selColTmp = new Set(selColSel);
        let colView   = 'top';

        const cardCol   = elTOP.closest('.chart-card');
        const selectCol = document.getElementById('col-top-n');
        const modalCol  = document.getElementById('modal-colonias-terr');
        const checksCol = document.getElementById('modal-colonias-terr-checks');
        const searchCol = modalCol?.querySelector('.rng-search-input');
        const vtBtnsCol = cardCol?.querySelectorAll('.vt-btn');

        const renderBubbles = (keys, titulo) => {
            const vals   = keys.map(k => conteoCol[k] || 0);
            const invers = keys.map(k => sumasCol[k] || 0);
            const mdp    = invers.map(v => v / 1_000_000);
            const sizes  = bubbleSizes(vals, 14, 60);
            const colors = keys.map((_, i) => i === 0 ? C.naranja : C.verde);
            const labels = keys.map(toTitleCase);

            Plotly.newPlot(elTOP, [{
                type: 'scatter',
                mode: 'markers',
                x: vals,
                y: mdp,
                text: labels,
                customdata: labels.map((l, i) => [l, vals[i].toLocaleString('es-MX'), mdp[i].toFixed(2)]),
                marker: {
                    size: sizes,
                    color: colors,
                    opacity: 0.88,
                    line: { color: C.paperBg, width: 2 },
                },
                hovertemplate:
                    '<b>%{customdata[0]}</b><br>' +
                    'Beneficiarios: %{customdata[1]}<br>' +
                    'Inversión: $%{customdata[2]}M' +
                    '<extra></extra>',
            }], getLayout(titulo, {
                xaxis: { title: '', gridcolor: 'rgba(255,255,255,0.08)' },
                yaxis: { title: '', ticksuffix: ' mdp', gridcolor: 'rgba(255,255,255,0.08)' },
                margin: { t: 58, r: 30, b: 60, l: 70 },
            }), plotConfig);
        };

        const buildChecksCol = (filter = '') => {
            checksCol.innerHTML = '';
            const q = filter.toLowerCase();
            allKeysCol
                .filter(k => !q || toTitleCase(k).toLowerCase().includes(q))
                .forEach(k => {
                    const lbl = document.createElement('label');
                    lbl.className = 'rng-opt';
                    const cb  = document.createElement('input');
                    cb.type   = 'checkbox';
                    cb.value  = k;
                    cb.checked = selColTmp.has(k);
                    cb.addEventListener('change', () => {
                        if (cb.checked) selColTmp.add(k); else selColTmp.delete(k);
                    });
                    const sp = document.createElement('span');
                    sp.textContent = toTitleCase(k);
                    lbl.append(cb, sp);
                    checksCol.appendChild(lbl);
                });
        };

        const openModalCol  = () => {
            selColTmp = new Set(selColSel);
            if (searchCol) searchCol.value = '';
            buildChecksCol('');
            modalCol.removeAttribute('hidden');
        };
        const closeModalCol = () => modalCol.setAttribute('hidden', '');

        searchCol?.addEventListener('input', () => buildChecksCol(searchCol.value));
        modalCol?.addEventListener('click', e => { if (e.target === modalCol) closeModalCol(); });
        modalCol?.querySelector('.rng-modal-close')?.addEventListener('click', closeModalCol);
        modalCol?.querySelector('.rng-cancel-btn')?.addEventListener('click', closeModalCol);
        modalCol?.querySelector('[data-action="all"]')?.addEventListener('click', () => {
            allKeysCol.forEach(k => selColTmp.add(k));
            checksCol.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        });
        modalCol?.querySelector('[data-action="none"]')?.addEventListener('click', () => {
            selColTmp.clear();
            checksCol.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        });
        modalCol?.querySelector('.rng-apply-btn')?.addEventListener('click', () => {
            selColSel = new Set(selColTmp);
            closeModalCol();
            const keys = selColSel.size > 0 ? allKeysCol.filter(k => selColSel.has(k)) : allKeysCol;
            renderBubbles(keys, 'Comparativa Colonias por Beneficiarios');
        });

        vtBtnsCol?.forEach(btn => {
            btn.addEventListener('click', () => {
                colView = btn.dataset.view;
                vtBtnsCol.forEach(b => b.classList.toggle('active', b === btn));
                if (colView === 'top') {
                    if (selectCol) selectCol.style.display = '';
                    const n = +(selectCol?.value ?? 15);
                    renderBubbles(allKeysCol.slice(0, n), `Top ${n} Colonias por Beneficiarios`);
                } else {
                    if (selectCol) selectCol.style.display = 'none';
                    openModalCol();
                }
            });
        });

        selectCol?.addEventListener('change', () => {
            if (colView === 'top') {
                const n = +selectCol.value;
                renderBubbles(allKeysCol.slice(0, n), `Top ${n} Colonias por Beneficiarios`);
            }
        });

        const _nCol = +(selectCol?.value ?? 15);
        renderBubbles(allKeysCol.slice(0, _nCol), `Top ${_nCol} Colonias por Beneficiarios`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Mapa de Beneficiarios por Territorio (Colonias / Delegaciones)
    // ═══════════════════════════════════════════════════════════════════════
    const elMAP = document.getElementById('chart-mapa-colonias');
    if (elMAP) {
        elMAP.classList.remove('loading');

        let _geoCol = null, _geoDel = null, _geoMun = null;
        let _mapaListenerAdded = false;
        let _tipoTerr   = 'colonias';
        let _mapaMode   = 'top';
        let _mapaZoom   = 10;
        let _mapaSel    = new Set();
        let _mapaSelTmp = new Set();

        const getConteo = tipo => tipo === 'colonias'
            ? contarPor(data.filter(d => d.COLONIA), 'COLONIA')
            : contarPor(data.filter(d => d.DELEGACION), 'DELEGACION');

        const getSumas = tipo => tipo === 'colonias'
            ? sumarPor(data.filter(d => d.COLONIA), 'COLONIA', 'IMPORTE')
            : sumarPor(data.filter(d => d.DELEGACION), 'DELEGACION', 'IMPORTE');

        const getKeys = tipo => sortedDesc(getConteo(tipo)).map(r => r[0]);

        const renderMapa = async (filtKeys) => {
            try {
                if (!_geoCol) {
                    const [r1, r2, r3] = await Promise.all([
                        fetch('GeoJsons/COL_LOC_EDO_QRO.geojson').then(r => r.json()),
                        fetch('GeoJsons/DELEGACIONES_QRO_CORR.geojson').then(r => r.json()),
                        fetch('GeoJsons/Corregidora.geojson').then(r => r.json()),
                    ]);
                    _geoCol = r1; _geoDel = r2; _geoMun = r3;
                }

                const geojson = _tipoTerr === 'colonias' ? _geoCol : _geoDel;
                const propKey = _tipoTerr === 'colonias' ? 'NOM_COL' : 'NOM_DEL';
                const conteo  = getConteo(_tipoTerr);
                const sumas   = getSumas(_tipoTerr);
                const useKeys = filtKeys ? new Set(filtKeys) : null;

                const locs = [], vals = [], texts = [];
                geojson.features.forEach(f => {
                    const nom = f.properties?.[propKey];
                    if (nom && conteo[nom] && (!useKeys || useKeys.has(nom))) {
                        locs.push(nom);
                        vals.push(conteo[nom]);
                        texts.push(
                            '<b>' + toTitleCase(nom) + '</b><br>' +
                            conteo[nom].toLocaleString('es-MX') + ' becarios<br>' +
                            'Inversión: $' + (sumas[nom] || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })
                        );
                    }
                });

                if (!vals.length) {
                    elMAP.innerHTML = '<p style="color:rgba(255,255,255,0.35);padding:2rem;text-align:center">Sin datos para esta selección.</p>';
                    return;
                }

                const zmax = Math.max(...vals);
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

                Plotly.newPlot(elMAP, [
                    {
                        type: 'choroplethmapbox',
                        geojson,
                        featureidkey: 'properties.' + propKey,
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
                        zmax,
                        colorbar: {
                            title: { text: 'Beneficiarios', font: { color: '#FFF', size: 10 } },
                            tickfont: { color: '#FFF', size: 10 },
                            tickformat: ',d',
                            thickness: 12,
                            bgcolor: C.paperBg,
                            bordercolor: 'rgba(255,255,255,0.14)',
                            borderwidth: 1,
                        },
                        marker: {
                            line: {
                                width: _tipoTerr === 'delegaciones' ? 1.5 : 0,
                                color: 'rgba(255,255,255,0.3)',
                            },
                        },
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
                ], getLayout('Distribución de Beneficiarios por Territorio', {
                    mapbox: {
                        style: 'carto-darkmatter',
                        center: { lat: 20.465, lon: -100.435 },
                        zoom: _mapaZoom,
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

                if (!_mapaListenerAdded) {
                    _mapaListenerAdded = true;
                    elMAP.on('plotly_relayout', ev => {
                        if (ev['mapbox.zoom'] !== undefined) _mapaZoom = ev['mapbox.zoom'];
                    });
                }

            } catch (err) {
                console.error('[MapaTerritorio]', err);
                elMAP.innerHTML =
                    '<p style="color:#fca5a5;padding:2rem;text-align:center">' +
                    'Error al cargar el GeoJSON de territorios.</p>';
            }
        };

        const mapaSelectEl = document.getElementById('mapa-top-n');
        const mapaModalEl  = document.getElementById('modal-mapa-terr');
        const mapaChecksEl = document.getElementById('modal-mapa-terr-checks');
        const mapaSearchEl = mapaModalEl?.querySelector('.rng-search-input');
        const tipoToggle   = document.querySelectorAll('#mapa-tipo-toggle .vt-btn');
        const compToggle   = document.querySelectorAll('#mapa-topcomp-toggle .vt-btn');
        const mapaTitleEl  = document.getElementById('modal-mapa-terr-title');

        const renderMapaTop  = (n) => renderMapa(getKeys(_tipoTerr).slice(0, n));
        const renderMapaComp = (sel) => renderMapa(
            sel.size ? getKeys(_tipoTerr).filter(k => sel.has(k)) : getKeys(_tipoTerr)
        );

        const buildMapaChecks = (filter) => {
            mapaChecksEl.innerHTML = '';
            const q = (filter || '').toLowerCase();
            getKeys(_tipoTerr)
                .filter(k => !q || toTitleCase(k).toLowerCase().includes(q))
                .forEach(k => {
                    const lbl = document.createElement('label');
                    lbl.className = 'rng-opt';
                    const cb  = document.createElement('input');
                    cb.type   = 'checkbox';
                    cb.value  = k;
                    cb.checked = _mapaSelTmp.has(k);
                    cb.addEventListener('change', () => {
                        if (cb.checked) _mapaSelTmp.add(k); else _mapaSelTmp.delete(k);
                    });
                    const sp = document.createElement('span');
                    sp.textContent = toTitleCase(k);
                    lbl.append(cb, sp);
                    mapaChecksEl.appendChild(lbl);
                });
        };

        const openMapaModal = () => {
            _mapaSelTmp = new Set(_mapaSel);
            if (mapaSearchEl) mapaSearchEl.value = '';
            if (mapaTitleEl) mapaTitleEl.textContent =
                _tipoTerr === 'colonias' ? 'Seleccionar Colonias' : 'Seleccionar Delegaciones';
            buildMapaChecks('');
            mapaModalEl.removeAttribute('hidden');
        };
        const closeMapaModal = () => mapaModalEl.setAttribute('hidden', '');

        mapaSearchEl?.addEventListener('input', () => buildMapaChecks(mapaSearchEl.value));
        mapaModalEl?.addEventListener('click', e => { if (e.target === mapaModalEl) closeMapaModal(); });
        mapaModalEl?.querySelector('.rng-modal-close')?.addEventListener('click', closeMapaModal);
        mapaModalEl?.querySelector('.rng-cancel-btn')?.addEventListener('click', closeMapaModal);
        mapaModalEl?.querySelector('[data-action="all"]')?.addEventListener('click', () => {
            getKeys(_tipoTerr).forEach(k => _mapaSelTmp.add(k));
            mapaChecksEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        });
        mapaModalEl?.querySelector('[data-action="none"]')?.addEventListener('click', () => {
            _mapaSelTmp.clear();
            mapaChecksEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        });
        mapaModalEl?.querySelector('.rng-apply-btn')?.addEventListener('click', () => {
            _mapaSel = new Set(_mapaSelTmp);
            closeMapaModal();
            renderMapaComp(_mapaSel);
        });

        tipoToggle.forEach(btn => {
            btn.addEventListener('click', () => {
                _tipoTerr = btn.dataset.territorio;
                tipoToggle.forEach(b => b.classList.toggle('active', b === btn));
                _mapaSel = new Set();
                if (_mapaMode === 'top') renderMapaTop(+(mapaSelectEl?.value ?? 15));
                else renderMapaComp(_mapaSel);
            });
        });

        compToggle.forEach(btn => {
            btn.addEventListener('click', () => {
                _mapaMode = btn.dataset.view;
                compToggle.forEach(b => b.classList.toggle('active', b === btn));
                if (_mapaMode === 'top') {
                    if (mapaSelectEl) mapaSelectEl.style.display = '';
                    renderMapaTop(+(mapaSelectEl?.value ?? 15));
                } else {
                    if (mapaSelectEl) mapaSelectEl.style.display = 'none';
                    openMapaModal();
                }
            });
        });

        mapaSelectEl?.addEventListener('change', () => {
            if (_mapaMode === 'top') renderMapaTop(+mapaSelectEl.value);
        });

        document.getElementById('mapa-zoom-in')?.addEventListener('click', () => {
            _mapaZoom = Math.min(18, _mapaZoom + 1);
            Plotly.relayout(elMAP, { 'mapbox.zoom': _mapaZoom });
        });
        document.getElementById('mapa-zoom-out')?.addEventListener('click', () => {
            _mapaZoom = Math.max(0, _mapaZoom - 1);
            Plotly.relayout(elMAP, { 'mapbox.zoom': _mapaZoom });
        });
        document.getElementById('mapa-fullscreen')?.addEventListener('click', () => {
            const cont = elMAP.closest('.chart-card') || elMAP;
            if (!document.fullscreenElement) {
                cont.requestFullscreen?.().catch(() => {});
            } else {
                document.exitFullscreen?.();
            }
        });

        renderMapaTop(+(mapaSelectEl?.value ?? 15));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Análisis de Proximidad (oculto en HTML, mantenido para uso futuro)
    // ═══════════════════════════════════════════════════════════════════════

    function haversineKm(lat1, lon1, lat2, lon2) {
        const R    = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a    = Math.sin(dLat / 2) ** 2 +
                     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                     Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

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

    const _sortedRaw = conDistRaw.map(d => d.DISTANCIA_KM).sort((a, b) => a - b);
    const _p99       = _sortedRaw[Math.floor(_sortedRaw.length * 0.99)] ?? Infinity;
    const conDist    = conDistRaw.filter(d => d.DISTANCIA_KM <= _p99);

    const _proxIds = [
        'chart-proximidad-histograma',
        'chart-proximidad-delegacion',
        'chart-proximidad-scatter',
    ];
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

    const elHIST = document.getElementById('chart-proximidad-histograma');
    if (elHIST) {
        const dists       = conDist.map(d => d.DISTANCIA_KM);
        const promGlobal  = dists.reduce((a, b) => a + b, 0) / dists.length;
        const mediana     = [...dists].sort((a, b) => a - b)[Math.floor(dists.length / 2)];
        const sinMovil    = dists.filter(d => d <= 2).length;
        const pctSinMovil = ((sinMovil / dists.length) * 100).toFixed(1);
        const xMax        = Math.ceil(_p99 + 0.5);

        Plotly.newPlot(elHIST, [{
            type: 'histogram',
            x: dists,
            xbins: { start: 0, end: xMax, size: 0.5 },
            name: 'Beneficiarios',
            marker: { color: C.verde, line: { color: 'rgba(0,0,0,0.25)', width: 0.5 } },
            hovertemplate: '%{x:.1f}–%{x:.1f} km<br>Beneficiarios: %{y:,}<extra></extra>',
        }], getLayout(
            'Distribución de Distancias Alumno → Escuela · ' + pctSinMovil + '% recorre ≤ 2 km',
            {
                xaxis: { title: 'Distancia (km)', range: [0, xMax], dtick: Math.max(1, Math.floor(xMax / 15)) },
                yaxis: { title: 'Beneficiarios', tickformat: ',' },
                bargap: 0.05,
                legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.20 },
                margin: { t: 64, r: 20, b: 80, l: 70 },
                annotations: [
                    { x: 2, y: 0.01, xref: 'x', yref: 'paper', yanchor: 'bottom', text: '← zona local (≤ 2 km)', showarrow: false, font: { color: 'rgba(255,255,255,0.45)', size: 10 }, xanchor: 'left' },
                    { x: promGlobal, y: 0.97, xref: 'x', yref: 'paper', text: 'Prom. ' + promGlobal.toFixed(2) + ' km', showarrow: false, font: { color: C.naranja, size: 10 }, xanchor: 'left', bgcolor: 'rgba(0,0,0,0.35)', borderpad: 3 },
                    { x: mediana,    y: 0.85, xref: 'x', yref: 'paper', text: 'Med. ' + mediana.toFixed(2) + ' km',    showarrow: false, font: { color: '#a78bfa', size: 10 }, xanchor: 'left', bgcolor: 'rgba(0,0,0,0.35)', borderpad: 3 },
                ],
                shapes: [
                    { type: 'rect', x0: 0, x1: 2, y0: 0, y1: 1, xref: 'x', yref: 'paper', fillcolor: 'rgba(82,188,163,0.10)', line: { width: 0 } },
                    { type: 'line', x0: promGlobal, x1: promGlobal, y0: 0, y1: 1, xref: 'x', yref: 'paper', line: { color: C.naranja, width: 2, dash: 'dash' } },
                    { type: 'line', x0: mediana,    x1: mediana,    y0: 0, y1: 1, xref: 'x', yref: 'paper', line: { color: '#a78bfa', width: 2, dash: 'dot' } },
                ],
            }
        ), plotConfig);
    }

    const elDELDIST = document.getElementById('chart-proximidad-delegacion');
    if (elDELDIST) {
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
                p75: (() => {
                    const sorted = p75Del[del].sort((a, b) => a - b);
                    return sorted[Math.floor(sorted.length * 0.75)];
                })(),
            }))
            .sort((a, b) => b.prom - a.prom);

        const promGlobal = conDist.reduce((s, d) => s + d.DISTANCIA_KM, 0) / conDist.length;

        const renderTopDelDist = (n) => {
            const delegaciones = delegacionesFull.slice(0, n);
            const labels = delegaciones.map(d => toTitleCase(d.del));
            const proms  = delegaciones.map(d => d.prom);
            const p75s   = delegaciones.map(d => d.p75);
            const cnts   = delegaciones.map(d => d.cnt);

            Plotly.newPlot(elDELDIST, [
                {
                    type: 'bar', orientation: 'h', name: 'Distancia promedio',
                    x: proms, y: labels,
                    marker: { color: proms.map(p => p > promGlobal ? C.naranja : C.verde), line: { color: 'rgba(0,0,0,0.2)', width: 0.5 } },
                    text: proms.map(p => p.toFixed(2) + ' km'),
                    textposition: 'outside', textfont: { color: '#FFF', size: 10 }, cliponaxis: false,
                    customdata: cnts,
                    hovertemplate: '<b>%{y}</b><br>Promedio: %{x:.2f} km<br>Beneficiarios: %{customdata:,}<extra></extra>',
                },
                {
                    type: 'scatter', mode: 'markers', name: 'Percentil 75',
                    x: p75s, y: labels,
                    marker: { color: '#a78bfa', size: 8, symbol: 'diamond', line: { color: '#FFF', width: 1 } },
                    hovertemplate: '<b>%{y}</b><br>P75: %{x:.2f} km<extra></extra>',
                },
                {
                    type: 'scatter', mode: 'lines',
                    name: 'Promedio global (' + promGlobal.toFixed(2) + ' km)',
                    x: [promGlobal, promGlobal], y: [labels[labels.length - 1], labels[0]],
                    line: { color: '#facc15', width: 2, dash: 'dash' }, hoverinfo: 'skip',
                },
            ], getLayout('Top ' + n + ' Delegaciones — Distancia Promedio Alumno → Escuela', {
                xaxis:  { title: { text: 'Distancia (km)', standoff: 18 }, gridcolor: 'rgba(255,255,255,0.08)' },
                yaxis:  { autorange: 'reversed' },
                legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.24 },
                margin: { t: 58, r: 80, b: 110, l: 240 },
                shapes: [{ type: 'line', x0: 2, x1: 2, y0: 0, y1: 1, yref: 'paper', line: { color: 'rgba(82,188,163,0.4)', width: 1, dash: 'dot' } }],
            }), plotConfig);
        };

        elDELDIST._renderTop = renderTopDelDist;
        const selDELDIST = document.querySelector('[data-chart="chart-proximidad-delegacion"]');
        const nDELDIST   = +(selDELDIST?.querySelector('.top-select')?.value ?? 15);
        renderTopDelDist(nDELDIST);
        selDELDIST?.querySelector('.top-select')?.addEventListener('change', function () {
            renderTopDelDist(+this.value);
        });
    }

    const elSCATDIST = document.getElementById('chart-proximidad-scatter');
    if (elSCATDIST) {
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
            type: 'scatter', mode: 'markers+text',
            x: agg.map(a => a.distProm),
            y: agg.map(a => a.impProm),
            text: agg.map(a => toTitleCase(a.del)),
            textposition: 'top center',
            textfont: { size: 9, color: 'rgba(255,255,255,0.75)' },
            marker: {
                size: agg.map(a => Math.max(10, Math.min(45, Math.sqrt(a.cnt) * 2.5))),
                color: agg.map(a => a.distProm),
                colorscale: [[0, C.verde], [0.5, C.naranja], [1, '#ef4444']],
                showscale: true,
                colorbar: { title: { text: 'km prom.', font: { color: '#FFF', size: 10 } }, tickfont: { color: '#FFF', size: 9 }, ticksuffix: ' km', thickness: 12 },
                line: { color: 'rgba(255,255,255,0.3)', width: 1 },
            },
            customdata: agg.map(a => a.cnt),
            hovertemplate: '<b>%{text}</b><br>Distancia prom.: %{x:.2f} km<br>Beca prom.: $%{y:,.0f}<br>Beneficiarios: %{customdata:,}<extra></extra>',
        }], getLayout('Distancia vs Beca Promedio por Delegación', {
            xaxis: { title: 'Distancia promedio al centro escolar (km)' },
            yaxis: { title: 'Importe promedio de beca ($)', tickformat: '$,.0f' },
            margin: { t: 58, r: 30, b: 60, l: 90 },
        }), plotConfig);
    }
    } // end if (conDist.length)
});
