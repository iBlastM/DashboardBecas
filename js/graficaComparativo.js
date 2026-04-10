// â”€â”€ GRAFICA_COMPARATIVO.JS â”€â”€ DashboardBecas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Gráficas de la pestaña Comparativo (datos por BENEFICIARIO ÚNICO):
//   1. Beneficiarios únicos por Etapa (barras)
//   2. Inversión Total por Etapa en mdp (barras)
//   3. Variación de Beneficiarios por Etapas (línea + delta Δ%)
//   4. Variación de Importe Promedio por Etapa (línea)
//   5. Comparativa de Becas Otorgadas por Tipo y Etapa (barras agrupadas + Top/Comparativa)
//   6. Composición de Tipos de Becas por Etapa (barras 100% apiladas + Top/Comparativa)

document.addEventListener('datosListos', () => {
    const data = window.dashData;

    // Orden canónico de periodos: AÃ‘O-E1, AÃ‘O-E2, AÃ‘O-EX
    const TODOS_PERIODOS = [];
    [2020, 2021, 2022, 2023, 2024, 2025].forEach(a => {
        (a === 2020 ? ['E1', 'E2'] : ['E1', 'E2', 'EX']).forEach(e => TODOS_PERIODOS.push(a + '-' + e));
    });

    const periodosPresentes = TODOS_PERIODOS.filter(p =>
        data.some(d =>
            Array.isArray(d.PERIODOS) ? d.PERIODOS.includes(p) : d.PERIODO === p
        )
    );

    if (periodosPresentes.length === 0) return;

    // Con beneficiarios únicos, cada uno tiene PERIODOS[] con todos sus periodos
    const filterP = p => data.filter(d =>
        Array.isArray(d.PERIODOS) ? d.PERIODOS.includes(p) : d.PERIODO === p
    );

    // Inversión real por periodo: suma de cada beca individual (campo BECAS)
    const invEnPeriodo = (p) => data.reduce((sum, d) => {
        if (Array.isArray(d.BECAS) && d.BECAS.length > 0) {
            return sum + d.BECAS
                .filter(b => b.PERIODO === p)
                .reduce((s, b) => s + (b.IMPORTE || 0), 0);
        }
        return sum + (d.PERIODO === p ? d.IMPORTE : 0);
    }, 0);

    // Número de becas (no beneficiarios) otorgadas en un periodo
    const becasEnPeriodo = (p) => data.reduce((cnt, d) => {
        if (Array.isArray(d.BECAS) && d.BECAS.length > 0) {
            return cnt + d.BECAS.filter(b => b.PERIODO === p).length;
        }
        return cnt + (d.PERIODO === p ? 1 : 0);
    }, 0);

    const fmt     = (v, opts) => (v || 0).toLocaleString('es-MX', opts || {});
    const toLabel = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    // Etiqueta corta: "2022-E1" â†’ "1E 2022"
    const periodoLabel = p => {
        const [yr, etapa] = p.split('-');
        const emap = { E1: '1E', E2: '2E', EX: 'EX' };
        return (emap[etapa] || etapa) + ' ' + yr;
    };

    const xLabels = periodosPresentes.map(periodoLabel);

    // Colores por periodo
    const PERIODO_COLORS = periodosPresentes.map((_, i) => C.paleta[i % C.paleta.length]);

    // Pre-calcular métricas por periodo
    const nPeriodo    = {};  // beneficiarios únicos con beca en ese periodo
    const invPeriodo  = {};  // inversión real del periodo (desde BECAS detalle) en pesos
    const promPeriodo = {};  // importe promedio por beca en el periodo
    periodosPresentes.forEach(p => {
        nPeriodo[p]    = filterP(p).length;
        invPeriodo[p]  = invEnPeriodo(p);
        const becasCnt = becasEnPeriodo(p);
        promPeriodo[p] = becasCnt > 0 ? invPeriodo[p] / becasCnt : 0;
    });

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 1. Beneficiarios por Etapa (barras)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const el1 = document.getElementById('chart-periodo-beneficiarios');
    if (el1) {
        el1.classList.remove('loading');
        const yVals = periodosPresentes.map(p => nPeriodo[p]);

        Plotly.newPlot(el1, [{
            type: 'bar',
            x: xLabels,
            y: yVals,
            marker: { color: PERIODO_COLORS },
            text: yVals.map(v => v.toLocaleString('es-MX')),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 12 },
            cliponaxis: false,
            hovertemplate: '<b>%{x}</b><br>%{y:,} beneficiarios<extra></extra>',
        }], getLayout('Beneficiarios por Etapa', {
            xaxis: { type: 'category', title: '' },
            yaxis: {
                title: '',
                gridcolor: 'rgba(255,255,255,0.08)',
                range: [0, Math.max(...yVals) * 1.25],
                tickformat: ',.0f',
            },
            margin: { t: 58, r: 18, b: 68, l: 72 },
        }), plotConfig);
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 2. Inversión Total por Periodo (mdp) â€” valores en millones de pesos
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const el2 = document.getElementById('chart-periodo-inversion');
    if (el2) {
        el2.classList.remove('loading');
        // Convertir a millones de pesos
        const yVals = periodosPresentes.map(p => +(invPeriodo[p] / 1e6).toFixed(2));

        Plotly.newPlot(el2, [{
            type: 'bar',
            x: xLabels,
            y: yVals,
            marker: { color: PERIODO_COLORS },
            text: yVals.map(v => v.toFixed(1) + ' mdp'),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 11 },
            cliponaxis: false,
            hovertemplate: '<b>%{x}</b><br>%{y:.2f} mdp<extra></extra>',
        }], getLayout('Inversión Total por Periodo (mdp)', {
            xaxis: { type: 'category', title: '' },
            yaxis: {
                title: '',
                gridcolor: 'rgba(255,255,255,0.08)',
                tickformat: '.1f',
                ticksuffix: ' mdp',
                range: [0, Math.max(...yVals) * 1.25],
            },
            margin: { t: 58, r: 18, b: 68, l: 100 },
        }), plotConfig);
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 3. Variación de Beneficiarios por Etapas (Δ % línea)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const el3 = document.getElementById('chart-periodo-variacion');
    if (el3) {
        el3.classList.remove('loading');
        const yAbs   = periodosPresentes.map(p => nPeriodo[p]);
        const yDelta = [null]; // primer periodo no tiene delta anterior
        for (let i = 1; i < periodosPresentes.length; i++) {
            const prev = nPeriodo[periodosPresentes[i - 1]];
            const curr = nPeriodo[periodosPresentes[i]];
            yDelta.push(prev > 0 ? +((curr - prev) / prev * 100).toFixed(1) : null);
        }

        Plotly.newPlot(el3, [
            {
                type: 'scatter', mode: 'lines+markers', name: 'Beneficiarios',
                x: xLabels, y: yAbs,
                line: { color: C.verde, width: 2.5 },
                marker: { color: C.verde, size: 8 },
                hovertemplate: '<b>%{x}</b><br>%{y:,} beneficiarios<extra></extra>',
                yaxis: 'y',
            },
            {
                type: 'scatter', mode: 'lines+markers+text', name: 'Δ variación %',
                x: xLabels, y: yDelta,
                line: { color: C.naranja, width: 2, dash: 'dot' },
                marker: {
                    color: yDelta.map(v => v == null ? '#999' : v >= 0 ? C.verde : '#EF4444'),
                    size: 9,
                },
                text: yDelta.map(v => v == null ? '' : (v > 0 ? '+' : '') + v + '%'),
                textposition: 'top center',
                textfont: {
                    // Negativo en rojo, positivo/neutro en naranja
                    color: yDelta.map(v => v == null ? C.naranja : v < 0 ? '#EF4444' : C.naranja),
                    size: 11,
                },
                hovertemplate: '<b>%{x}</b><br>Δ %{y:.1f}%<extra></extra>',
                yaxis: 'y2',
            },
        ], getLayout('Variación de Beneficiarios por Etapas', {
            xaxis: { type: 'category', title: '' },
            yaxis:  {
                title: '',
                gridcolor: 'rgba(255,255,255,0.08)',
                tickformat: ',.0f',
            },
            yaxis2: {
                title: '',
                overlaying: 'y', side: 'right',
                showgrid: false,
                zeroline: true, zerolinecolor: 'rgba(255,255,255,0.3)',
            },
            showlegend: false,
            margin: { t: 58, r: 80, b: 80, l: 72 },
        }), plotConfig);
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 4. Variación de Importe Promedio por Etapa (línea)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const el4 = document.getElementById('chart-periodo-promedio');
    if (el4) {
        el4.classList.remove('loading');
        const yVals = periodosPresentes.map(p => +promPeriodo[p].toFixed(2));

        Plotly.newPlot(el4, [{
            type: 'scatter',
            mode: 'lines+markers+text',
            x: xLabels,
            y: yVals,
            line: { color: C.naranja, width: 2.5 },
            marker: { color: C.naranja, size: 9, line: { color: '#FFF', width: 1.5 } },
            text: yVals.map(v => '$' + fmt(v, { minimumFractionDigits: 0, maximumFractionDigits: 0 })),
            textposition: 'top center',
            textfont: { color: C.naranja, size: 11 },
            fill: 'tozeroy',
            fillcolor: 'rgba(229,134,6,0.12)',
            hovertemplate: '<b>%{x}</b><br>Promedio: $%{y:,.2f}<extra></extra>',
        }], getLayout('Variación de Importe Promedio por Etapa', {
            xaxis: { type: 'category', title: '', automargin: true },
            yaxis: {
                title: '',
                gridcolor: 'rgba(255,255,255,0.08)',
                tickformat: '$,.0f',
                range: [0, Math.max(...yVals) * 1.3],
            },
            margin: { t: 58, r: 80, b: 68, l: 100 },
        }), plotConfig);
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 5. Comparativa de Becas Otorgadas por Tipo y Etapa
    //    Top: todas los tipos Â· Comparativa: selección de tipos vía modal
    //    Si se selecciona un solo tipo, agrega línea Δ% entre periodos
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const el5 = document.getElementById('chart-periodo-tipo-beca');
    if (el5) {
        el5.classList.remove('loading');

        const TIPO_COLOR = {
            'PRIMARIA':              '#5B8AF5',
            'PRIMARIA EXCELENCIA':   C.naranja,
            'SECUNDARIA':            C.verde,
            'SECUNDARIA EXCELENCIA': '#F472B6',
            'UNIVERSIDAD':           '#A855F7',
        };

        // Recolectar todos los tipos presentes
        const tiposSet = new Set();
        data.forEach(d => {
            if (Array.isArray(d.BECAS)) d.BECAS.forEach(b => { if (b.TIPO_BECA) tiposSet.add(b.TIPO_BECA); });
            else if (d.TIPO_BECA) tiposSet.add(d.TIPO_BECA);
        });
        const tipos = [...tiposSet].sort();

        const countTipoEnPeriodo = (p, tipo) => data.reduce((cnt, d) => {
            if (Array.isArray(d.BECAS) && d.BECAS.length > 0) {
                return cnt + d.BECAS.filter(b => b.PERIODO === p && b.TIPO_BECA === tipo).length;
            }
            return cnt + (d.PERIODO === p && d.TIPO_BECA === tipo ? 1 : 0);
        }, 0);

        const card5         = el5.closest('.chart-card');
        const modalTipoBeca = document.getElementById('modal-tipo-beca');
        const checksTipoBeca= document.getElementById('modal-tipo-beca-checks');
        const vtBtns5       = card5?.querySelectorAll('.vt-btn');

        let selTipos    = new Set(tipos);
        let selTiposTmp = new Set(tipos);

        const renderTipoBeca = (tiposSel, titulo) => {
            const activeTipos = tiposSel.size > 0 ? tipos.filter(t => tiposSel.has(t)) : tipos;
            const traces = activeTipos.map((tipo, i) => {
                const yVals = periodosPresentes.map(p => countTipoEnPeriodo(p, tipo));
                return {
                    type: 'bar',
                    name: toLabel(tipo),
                    x: xLabels,
                    y: yVals,
                    marker: { color: TIPO_COLOR[tipo] || C.paleta[i % C.paleta.length] },
                    text: yVals.map(v => v > 0 ? v.toLocaleString('es-MX') : ''),
                    textposition: 'outside',
                    textfont: { color: '#FFF', size: 10 },
                    cliponaxis: false,
                    hovertemplate: '<b>%{x} Â· ' + toLabel(tipo) + '</b><br>%{y:,} becas<extra></extra>',
                };
            });

            // Variación Δ% cuando se selecciona exactamente un tipo
            const showDelta = activeTipos.length === 1;
            if (showDelta) {
                const tipo   = activeTipos[0];
                const counts = periodosPresentes.map(p => countTipoEnPeriodo(p, tipo));
                const dVals  = [null];
                for (let i = 1; i < counts.length; i++) {
                    const prev = counts[i - 1];
                    dVals.push(prev > 0 ? +((counts[i] - prev) / prev * 100).toFixed(1) : null);
                }
                traces.push({
                    type: 'scatter', mode: 'lines+markers+text', name: 'Δ variación %',
                    x: xLabels, y: dVals,
                    line: { color: C.naranja, width: 2, dash: 'dot' },
                    marker: {
                        color: dVals.map(v => v == null ? '#999' : v >= 0 ? C.verde : '#EF4444'),
                        size: 9,
                    },
                    text: dVals.map(v => v == null ? '' : (v > 0 ? '+' : '') + v + '%'),
                    textposition: 'top center',
                    textfont: {
                        color: dVals.map(v => v == null ? C.naranja : v < 0 ? '#EF4444' : C.naranja),
                        size: 11,
                    },
                    hovertemplate: '<b>%{x}</b><br>Δ %{y:.1f}%<extra></extra>',
                    yaxis: 'y2',
                });
            }

            const extraLayout = showDelta ? {
                yaxis2: {
                    title: '',
                    overlaying: 'y', side: 'right',
                    showgrid: false,
                    zeroline: true, zerolinecolor: 'rgba(255,255,255,0.3)',
                },
            } : {};

            Plotly.newPlot(el5, traces, getLayout(titulo, {
                barmode: 'group',
                xaxis: { type: 'category', title: '' },
                yaxis: {
                    title: '',
                    gridcolor: 'rgba(255,255,255,0.08)',
                    tickformat: ',.0f',
                },
                margin: { t: 58, r: showDelta ? 80 : 18, b: 90, l: 72 },
                legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.28 },
                ...extraLayout,
            }), plotConfig);
        };

        const buildChecksTipoBeca = () => {
            checksTipoBeca.innerHTML = '';
            tipos.forEach(tipo => {
                const lbl = document.createElement('label');
                lbl.className = 'rng-opt';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.value = tipo;
                cb.checked = selTiposTmp.has(tipo);
                cb.addEventListener('change', () => {
                    if (cb.checked) selTiposTmp.add(tipo); else selTiposTmp.delete(tipo);
                });
                const sp = document.createElement('span');
                sp.textContent = toLabel(tipo);
                lbl.append(cb, sp);
                checksTipoBeca.appendChild(lbl);
            });
        };

        const openModal5  = () => {
            selTiposTmp = new Set(selTipos);
            buildChecksTipoBeca();
            modalTipoBeca?.removeAttribute('hidden');
        };
        const closeModal5 = () => modalTipoBeca?.setAttribute('hidden', '');

        modalTipoBeca?.addEventListener('click', e => { if (e.target === modalTipoBeca) closeModal5(); });
        modalTipoBeca?.querySelector('.rng-modal-close')?.addEventListener('click', closeModal5);
        modalTipoBeca?.querySelector('.rng-cancel-btn')?.addEventListener('click', closeModal5);
        modalTipoBeca?.querySelector('[data-action="all"]')?.addEventListener('click', () => {
            tipos.forEach(t => selTiposTmp.add(t));
            checksTipoBeca.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        });
        modalTipoBeca?.querySelector('[data-action="none"]')?.addEventListener('click', () => {
            selTiposTmp.clear();
            checksTipoBeca.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        });
        modalTipoBeca?.querySelector('.rng-apply-btn')?.addEventListener('click', () => {
            selTipos = new Set(selTiposTmp);
            closeModal5();
            renderTipoBeca(selTipos, 'Comparativa de Becas Otorgadas por Tipo y Etapa');
        });

        vtBtns5?.forEach(btn => {
            btn.addEventListener('click', () => {
                openModal5();
            });
        });

        renderTipoBeca(selTipos, 'Comparativa de Becas Otorgadas por Tipo y Etapa');
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 6. Composición de Tipos de Becas por Etapa â€” barras 100% apiladas
    //    Top: todos los periodos Â· Comparativa: selección de etapas vía modal
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const el6 = document.getElementById('chart-periodo-mix');
    if (el6) {
        el6.classList.remove('loading');

        const TIPO_COLOR_6 = {
            'PRIMARIA':              '#5B8AF5',
            'PRIMARIA EXCELENCIA':   C.naranja,
            'SECUNDARIA':            C.verde,
            'SECUNDARIA EXCELENCIA': '#F472B6',
            'UNIVERSIDAD':           '#A855F7',
        };

        const tiposSet6 = new Set();
        data.forEach(d => {
            if (Array.isArray(d.BECAS)) d.BECAS.forEach(b => { if (b.TIPO_BECA) tiposSet6.add(b.TIPO_BECA); });
            else if (d.TIPO_BECA) tiposSet6.add(d.TIPO_BECA);
        });
        const tipos6 = [...tiposSet6].sort();

        const card6       = el6.closest('.chart-card');
        const modalEtapas = document.getElementById('modal-etapas-mix');
        const checksEtapas= document.getElementById('modal-etapas-mix-checks');
        const vtBtns6     = card6?.querySelectorAll('.vt-btn');

        let selEtapas    = new Set(periodosPresentes);
        let selEtapasTmp = new Set(periodosPresentes);

        const renderMix = (etapasSel) => {
            const activeP      = etapasSel.size > 0
                ? periodosPresentes.filter(p => etapasSel.has(p))
                : periodosPresentes;
            const activeLabels = activeP.map(periodoLabel);

            const traces = tipos6.map((tipo, i) => {
                const yVals = activeP.map(p => {
                    const total = becasEnPeriodo(p);
                    const cnt   = data.reduce((c, d) => {
                        if (Array.isArray(d.BECAS) && d.BECAS.length > 0) {
                            return c + d.BECAS.filter(b => b.PERIODO === p && b.TIPO_BECA === tipo).length;
                        }
                        return c + (d.PERIODO === p && d.TIPO_BECA === tipo ? 1 : 0);
                    }, 0);
                    return total > 0 ? +(cnt / total * 100).toFixed(1) : 0;
                });
                return {
                    type: 'bar',
                    name: toLabel(tipo),
                    x: activeLabels,
                    y: yVals,
                    marker: { color: TIPO_COLOR_6[tipo] || C.paleta[i % C.paleta.length] },
                    text: yVals.map(v => v > 3 ? v.toFixed(1) + '%' : ''),
                    textposition: 'inside',
                    insidetextanchor: 'middle',
                    textfont: { color: '#FFF', size: 10 },
                    hovertemplate: '<b>%{x} Â· ' + toLabel(tipo) + '</b><br>%{y:.1f}%<extra></extra>',
                };
            });

            Plotly.newPlot(el6, traces, getLayout('Composición de Tipos de Becas por Etapa', {
                barmode: 'stack',
                xaxis: { type: 'category', title: '' },
                yaxis: {
                    title: '',
                    gridcolor: 'rgba(255,255,255,0.08)',
                    range: [0, 105],
                    ticksuffix: '%',
                },
                showlegend: false,
                margin: { t: 58, r: 18, b: 60, l: 72 },
            }), plotConfig);
        };

        const buildChecksEtapas = () => {
            checksEtapas.innerHTML = '';
            periodosPresentes.forEach(p => {
                const lbl = document.createElement('label');
                lbl.className = 'rng-opt';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.value = p;
                cb.checked = selEtapasTmp.has(p);
                cb.addEventListener('change', () => {
                    if (cb.checked) selEtapasTmp.add(p); else selEtapasTmp.delete(p);
                });
                const sp = document.createElement('span');
                sp.textContent = periodoLabel(p);
                lbl.append(cb, sp);
                checksEtapas.appendChild(lbl);
            });
        };

        const openModal6  = () => {
            selEtapasTmp = new Set(selEtapas);
            buildChecksEtapas();
            modalEtapas?.removeAttribute('hidden');
        };
        const closeModal6 = () => modalEtapas?.setAttribute('hidden', '');

        modalEtapas?.addEventListener('click', e => { if (e.target === modalEtapas) closeModal6(); });
        modalEtapas?.querySelector('.rng-modal-close')?.addEventListener('click', closeModal6);
        modalEtapas?.querySelector('.rng-cancel-btn')?.addEventListener('click', closeModal6);
        modalEtapas?.querySelector('[data-action="all"]')?.addEventListener('click', () => {
            periodosPresentes.forEach(p => selEtapasTmp.add(p));
            checksEtapas.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        });
        modalEtapas?.querySelector('[data-action="none"]')?.addEventListener('click', () => {
            selEtapasTmp.clear();
            checksEtapas.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        });
        modalEtapas?.querySelector('.rng-apply-btn')?.addEventListener('click', () => {
            selEtapas = new Set(selEtapasTmp);
            closeModal6();
            renderMix(selEtapas);
        });

        vtBtns6?.forEach(btn => {
            btn.addEventListener('click', () => {
                openModal6();
            });
        });

        renderMix(selEtapas);
    }
});
