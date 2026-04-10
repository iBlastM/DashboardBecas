// ── GRAFICA_ECONOMICO.JS ── DashboardBecas ────────────────────────────────────
// Gráficas de la pestaña Económico:
//   1. Inversión por Nivel Educativo (pie)
//   2. Inversión por Sector (mdp) (barras)
//   3. Promedio de Apoyo por categorías (barras agrupadas)
//   4. Distribución del Recurso Público por Tipo de Beca (burbujas + comparativo)
//   5. Comparativa de Inversión/Beneficiarios por Escuela (top + burbujas)
//   6. Comparativa de Inversión/Beneficiarios por Colonia (top + burbujas)

document.addEventListener('datosListos', () => {
    const data = window.dashData;
    const fmt  = (v, opts) => (v || 0).toLocaleString('es-MX', opts || {});

    // ── Helpers ─────────────────────────────────────────────────────────────
    const _articulosMin = new Set(['de','del','la','el','los','las','y','e','o','u','en','a','por','para','con','al','sin','ni','no','lo']);
    const toTitleCase = s => {
        if (!s) return '';
        return String(s).toLowerCase().split(/\s+/).map((w, i) => {
            if (i !== 0 && _articulosMin.has(w)) return w;
            return w.charAt(0).toUpperCase() + w.slice(1);
        }).join(' ');
    };

    // Escala tamaños de burbuja a un rango de píxeles proporcional a sqrt(valor)
    const bubbleSizes = (vals, minPx = 12, maxPx = 80) => {
        const max = Math.max(...vals, 1);
        return vals.map(v => minPx + (maxPx - minPx) * Math.sqrt(v / max));
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Inversión por Nivel Educativo (pie)
    // ═══════════════════════════════════════════════════════════════════════
    const elGN = document.getElementById('chart-gasto-nivel');
    if (elGN) {
        elGN.classList.remove('loading');
        const sumas  = sumarPor(data, 'NIVEL_EDUCATIVO', 'IMPORTE');
        const counts = contarPor(data, 'NIVEL_EDUCATIVO');
        const keys   = Object.keys(sumas).filter(k => k && k !== 'Sin dato');
        const labels = keys.map(toTitleCase);
        const values = keys.map(k => sumas[k]);
        const benefi = keys.map(k => counts[k] || 0);

        // Mostrar monto dentro del pie (en millones si >= 1M)
        const textVals = values.map(v =>
            v >= 1_000_000
                ? '$' + (v / 1_000_000).toFixed(1) + 'M'
                : '$' + fmt(v, { maximumFractionDigits: 0 })
        );

        Plotly.newPlot(elGN, [{
            type: 'pie',
            labels,
            values,
            customdata: benefi.map(b => fmt(b)),
            text: textVals,
            textinfo: 'text',
            marker: {
                colors: C.paleta,
                line: { color: C.paperBg, width: 2 },
            },
            textfont: { color: '#FFF', size: 12, family: C.fuente },
            hovertemplate: '<b>%{label}</b><br>%{customdata} Beneficiarios<br>%{percent}<extra></extra>',
        }], getLayout('Inversión por Nivel Educativo', {
            showlegend: false,
            margin: { t: 58, r: 10, b: 20, l: 10 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Inversión por Sector (mdp)
    // ═══════════════════════════════════════════════════════════════════════
    const elIS = document.getElementById('chart-inversion-sector');
    if (elIS) {
        elIS.classList.remove('loading');
        const sumas    = sumarPor(data, 'SECTOR', 'IMPORTE');
        const totalInv = Object.values(sumas).reduce((s, v) => s + v, 0);

        // Orden: Pública primero, Privada después
        const _sectorOrden = ['PUBLICA', 'PRIVADA'];
        const _sectorMap   = { 'PUBLICA': 'Pública', 'PRIVADA': 'Privada' };
        const sectores = [
            ..._sectorOrden.filter(s => sumas[s] != null),
            ...Object.keys(sumas).filter(k => k && k !== 'Sin dato' && !_sectorOrden.includes(k.toUpperCase())).sort(),
        ];
        const displayNames = sectores.map(s => _sectorMap[s.toUpperCase()] || toTitleCase(s));
        const vals    = sectores.map(s => sumas[s] || 0);
        const valsMdp = vals.map(v => +(v / 1_000_000).toFixed(3));
        const pcts    = vals.map(v => totalInv > 0 ? (v / totalInv * 100).toFixed(1) + '%' : '0%');

        Plotly.newPlot(elIS, [{
            type: 'bar',
            x: displayNames,
            y: valsMdp,
            marker: { color: [C.verde, C.naranja, '#A855F7', '#3B82F6'].slice(0, sectores.length) },
            text: valsMdp.map(v => v.toFixed(2) + ' mdp'),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 11 },
            cliponaxis: false,
            customdata: pcts,
            hovertemplate: '<b>%{x}</b><br>%{y:.2f} mdp<br>%{customdata} del total<extra></extra>',
        }], getLayout('Inversión por Sector (mdp)', {
            yaxis: {
                title: '',
                gridcolor: 'rgba(255,255,255,0.08)',
                tickformat: '.1f',
                ticksuffix: ' mdp',
            },
            margin: { t: 58, r: 18, b: 58, l: 80 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Promedio de Apoyo por categorías (barras agrupadas)
    //    — General · Por Nivel · Por Sector · Por Tipo de Beca
    //    Los distintos colores indican el grupo al que pertenece cada barra:
    //    naranja = General, verde = Nivel Educativo, morado = Sector, azul = Tipo de Beca
    // ═══════════════════════════════════════════════════════════════════════
    const elAP = document.getElementById('chart-apoyo-promedio');
    if (elAP) {
        elAP.classList.remove('loading');

        const totalGeneral = data.length > 0
            ? data.reduce((s, d) => s + d.IMPORTE, 0) / data.length
            : 0;

        const promNivel  = promediarPor(data, 'NIVEL_EDUCATIVO', 'IMPORTE');
        const promSector = promediarPor(data, 'SECTOR', 'IMPORTE');
        const promTipo   = promediarPor(data, 'TIPO_BECA', 'IMPORTE');

        const categorias = [
            'General',
            ...Object.keys(promNivel).map(toTitleCase),
            ...Object.keys(promSector).map(toTitleCase),
            ...Object.keys(promTipo).map(toTitleCase),
        ];
        const valores = [
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
    // 4. Distribución del Recurso Público por Tipo de Beca (burbujas)
    // ═══════════════════════════════════════════════════════════════════════
    const elRT = document.getElementById('chart-recurso-tipo');
    if (elRT) {
        elRT.classList.remove('loading');

        const tiposOrden   = ['PRIMARIA','PRIMARIA EXCELENCIA','SECUNDARIA','SECUNDARIA EXCELENCIA','UNIVERSITARIO'];
        const tiposPresentes = tiposOrden.filter(t => data.some(d => d.TIPO_BECA === t));
        const otrosTipos   = [...new Set(data.map(d => d.TIPO_BECA).filter(Boolean))]
            .filter(t => !tiposOrden.includes(t)).sort();
        const todosLos     = [...tiposPresentes, ...otrosTipos];
        const sumasTipo    = sumarPor(data, 'TIPO_BECA', 'IMPORTE');
        const cuentasTipo  = contarPor(data, 'TIPO_BECA');
        const totalTipo    = Object.values(sumasTipo).reduce((a, b) => a + b, 0);

        const vals  = todosLos.map(t => sumasTipo[t] || 0);
        const sizes = bubbleSizes(vals, 20, 90);
        const pcts  = vals.map(v => totalTipo > 0 ? (v / totalTipo * 100).toFixed(1) + '%' : '0%');

        // Una traza por tipo para que aparezca leyenda
        const traces = todosLos.map((t, i) => ({
            type: 'scatter',
            mode: 'markers',
            name: toTitleCase(t),
            x: [i],
            y: [0],
            marker: {
                size: [sizes[i]],
                color: C.paleta[i % C.paleta.length],
                line: { color: C.paperBg, width: 2 },
            },
            customdata: [[
                fmt(cuentasTipo[t] || 0),
                ((vals[i] || 0) / 1_000_000).toFixed(2),
                pcts[i],
                toTitleCase(t),
            ]],
            hovertemplate:
                '<b>%{customdata[3]}</b><br>' +
                'Inversión: $%{customdata[1]}M<br>' +
                '%{customdata[0]} Beneficiarios<br>' +
                '%{customdata[2]} del total' +
                '<extra></extra>',
        }));

        Plotly.newPlot(elRT, traces, getLayout('Distribución del Recurso Público por Tipo de Beca', {
            showlegend: true,
            xaxis: {
                title: '',
                tickvals: todosLos.map((_, i) => i),
                ticktext: todosLos.map(toTitleCase),
                tickangle: -20,
                zeroline: false,
                gridcolor: 'rgba(255,255,255,0.06)',
            },
            yaxis: {
                title: '',
                showticklabels: false,
                zeroline: false,
                showgrid: false,
                range: [-1.5, 1.5],
            },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.18 },
            margin: { t: 58, r: 30, b: 90, l: 30 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Factory: Top/Comparativa con burbujas + modal de selección
    // Usada por charts 5 (Escuelas) y 6 (Colonias)
    // ═══════════════════════════════════════════════════════════════════════
    const crearTopComparativa = ({ chartId, campo, modalId, checksId, selectId, palColor, titulo }) => {
        const el = document.getElementById(chartId);
        if (!el) return;
        el.classList.remove('loading');

        const filteredData = data.filter(d => d[campo]);
        const sumasObj     = sumarPor(filteredData, campo, 'IMPORTE');
        const cuentasObj   = contarPor(filteredData, campo);
        const fullRank     = sortedDesc(sumasObj);
        const allKeys      = fullRank.map(r => r[0]);

        // Estado persistente
        let seleccion = new Set(allKeys.slice(0, 10));
        let selTmp    = new Set(seleccion);
        let viewMode  = 'top';

        const card    = el.closest('.chart-card');
        const selectEl = document.getElementById(selectId);
        const modalEl  = document.getElementById(modalId);
        const checksEl = document.getElementById(checksId);
        const vtBtns   = card?.querySelectorAll('.vt-btn');

        // ── Render burbujas ──────────────────────────────────────────────
        const renderBubbles = (keys, chartTitulo) => {
            const vals   = keys.map(k => sumasObj[k] || 0);
            const counts = keys.map(k => cuentasObj[k] || 0);
            const mdp    = vals.map(v => v / 1_000_000);
            const sizes  = bubbleSizes(vals, 16, 72);
            // Primera burbuja (mayor inversión) en naranja, resto en palColor
            const colors = keys.map((_, i) => i === 0 ? C.naranja : palColor);

            Plotly.newPlot(el, [{
                type: 'scatter',
                mode: 'markers',
                x: counts,
                y: mdp,
                text: keys.map(toTitleCase),
                customdata: keys.map((k, i) => [toTitleCase(k), fmt(counts[i]), mdp[i].toFixed(2)]),
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
            }], getLayout(chartTitulo, {
                xaxis: { title: '', gridcolor: 'rgba(255,255,255,0.08)' },
                yaxis: { title: '', ticksuffix: ' mdp', gridcolor: 'rgba(255,255,255,0.08)' },
                margin: { t: 58, r: 30, b: 58, l: 70 },
            }), plotConfig);
        };

        const renderTop = (n) => {
            renderBubbles(allKeys.slice(0, n), `Top ${n} · ${titulo}`);
        };

        const renderComparativa = (sel) => {
            const keys = sel.size > 0 ? allKeys.filter(k => sel.has(k)) : allKeys;
            renderBubbles(keys, `Comparativa · ${titulo}`);
        };

        // ── Modal ────────────────────────────────────────────────────────
        const searchEl = modalEl?.querySelector('.rng-search-input');

        // buildChecks filtra por texto; cada checkbox actualiza selTmp en tiempo real
        const buildChecks = (filter = '') => {
            checksEl.innerHTML = '';
            const q = filter.toLowerCase();
            allKeys
                .filter(k => !q || toTitleCase(k).toLowerCase().includes(q))
                .forEach(k => {
                    const lbl = document.createElement('label');
                    lbl.className = 'rng-opt';
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.value = k;
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

        const openModal = () => {
            selTmp = new Set(seleccion);
            if (searchEl) searchEl.value = '';
            buildChecks('');
            modalEl.removeAttribute('hidden');
        };

        const closeModal = () => modalEl.setAttribute('hidden', '');

        // Clic en el fondo oscuro cierra sin aplicar
        modalEl?.addEventListener('click', e => {
            if (e.target === modalEl) closeModal();
        });

        // × y Cancelar
        modalEl?.querySelector('.rng-modal-close')?.addEventListener('click', closeModal);
        modalEl?.querySelector('.rng-cancel-btn')?.addEventListener('click', closeModal);

        // Filtrado en tiempo real
        searchEl?.addEventListener('input', () => buildChecks(searchEl.value));

        // Seleccionar todos / Limpiar — operan sobre TODOS los valores (no solo los visibles)
        modalEl?.querySelector('[data-action="all"]')?.addEventListener('click', () => {
            allKeys.forEach(k => selTmp.add(k));
            checksEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        });
        modalEl?.querySelector('[data-action="none"]')?.addEventListener('click', () => {
            selTmp.clear();
            checksEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        });

        // Aplicar — selTmp ya está sincronizado, incluye items no visibles
        modalEl?.querySelector('.rng-apply-btn')?.addEventListener('click', () => {
            seleccion = new Set(selTmp);
            closeModal();
            renderComparativa(seleccion);
        });

        // ── View toggle ──────────────────────────────────────────────────
        vtBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                viewMode = btn.dataset.view;
                vtBtns.forEach(b => b.classList.toggle('active', b === btn));
                if (viewMode === 'top') {
                    if (selectEl) selectEl.style.display = '';
                    renderTop(+(selectEl?.value ?? 10));
                } else {
                    if (selectEl) selectEl.style.display = 'none';
                    openModal();
                }
            });
        });

        // Select de N cambia el top
        selectEl?.addEventListener('change', () => {
            if (viewMode === 'top') renderTop(+selectEl.value);
        });

        // Render inicial
        renderTop(+(selectEl?.value ?? 10));
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Comparativa de Inversión/Beneficiarios por Escuela
    // ═══════════════════════════════════════════════════════════════════════
    crearTopComparativa({
        chartId:  'chart-top10-escuelas-invest',
        campo:    'ESCUELA',
        modalId:  'modal-escuelas',
        checksId: 'modal-escuelas-checks',
        selectId: 'escuelas-top-n',
        palColor: C.verde,
        titulo:   'Inversión/Beneficiarios por Escuela',
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Comparativa de Inversión/Beneficiarios por Colonia
    // ═══════════════════════════════════════════════════════════════════════
    crearTopComparativa({
        chartId:  'chart-top10-colonias-invest',
        campo:    'COLONIA',
        modalId:  'modal-colonias',
        checksId: 'modal-colonias-checks',
        selectId: 'colonias-top-n',
        palColor: C.paleta[2],
        titulo:   'Inversión/Beneficiarios por Colonia',
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 7. Inversión / Beneficiarios por Delegación (movido de Territorial)
    // ═══════════════════════════════════════════════════════════════════════
    crearTopComparativa({
        chartId:  'chart-delegacion-scatter',
        campo:    'DELEGACION',
        modalId:  'modal-del-scatter',
        checksId: 'modal-del-scatter-checks',
        selectId: 'del-scatter-top-n',
        palColor: C.verde,
        titulo:   'Inversión / Beneficiarios por Delegación',
    });
});

