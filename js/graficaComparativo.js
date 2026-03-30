// ── GRAFICA_COMPARATIVO.JS ── DashboardBecas ──────────────────────────────────
// Gráficas de la pestaña Comparativo (datos por BENEFICIARIO ÚNICO):
//   1. Beneficiarios únicos por Periodo (barras) — un beneficiario en múltiples
//      periodos cuenta en cada uno de ellos
//   2. Inversión Total por Periodo (barras) — suma de BECAS.IMPORTE del periodo
//   3. Variación de Beneficiarios entre Periodos (línea + delta Δ%)
//   4. Importe Promedio por Beca por Periodo (línea)
//   5. Becas por Tipo × Periodo (barras agrupadas)
//   6. Composición del Mix de Tipos de Beca por Periodo (barras 100% apiladas)

document.addEventListener('datosListos', () => {
    const data = window.dashData;

    // Orden canónico de periodos: AÑO-E1, AÑO-E2, AÑO-EX
    const TODOS_PERIODOS = [];
    [2021, 2022, 2023, 2024, 2025].forEach(a => {
        ['E1', 'E2', 'EX'].forEach(e => TODOS_PERIODOS.push(a + '-' + e));
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

    // Etiqueta legible: "2022-E1" → "1ª Etapa\n2022"
    // El año va al final para evitar que Plotly interprete la etiqueta como fecha.
    const periodoLabel = p => {
        const [yr, etapa] = p.split('-');
        const emap = { E1: '1ª Etapa', E2: '2ª Etapa', EX: 'Extraord.' };
        return (emap[etapa] || etapa) + '\n' + yr;
    };

    const xLabels = periodosPresentes.map(periodoLabel);

    // Colores por periodo
    const PERIODO_COLORS = periodosPresentes.map((_, i) => C.paleta[i % C.paleta.length]);
    const colorP = p => PERIODO_COLORS[periodosPresentes.indexOf(p)] || C.paleta[0];

    // Pre-calcular métricas por periodo
    const nPeriodo    = {};  // beneficiarios únicos con beca en ese periodo
    const invPeriodo  = {};  // inversión real del periodo (desde BECAS detalle)
    const promPeriodo = {};  // importe promedio por beca en el periodo
    periodosPresentes.forEach(p => {
        nPeriodo[p]    = filterP(p).length;
        invPeriodo[p]  = invEnPeriodo(p);
        const becasCnt = becasEnPeriodo(p);
        promPeriodo[p] = becasCnt > 0 ? invPeriodo[p] / becasCnt : 0;
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Beneficiarios por Periodo (barras)
    // ═══════════════════════════════════════════════════════════════════════
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
        }], getLayout('Beneficiarios por Periodo', {
            xaxis: { type: 'category', title: 'Periodo' },
            yaxis: {
                title: 'Beneficiarios',
                gridcolor: 'rgba(255,255,255,0.08)',
                range: [0, Math.max(...yVals) * 1.25],
            },
            margin: { t: 58, r: 18, b: 68, l: 72 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Inversión Total por Periodo (barras)
    // ═══════════════════════════════════════════════════════════════════════
    const el2 = document.getElementById('chart-periodo-inversion');
    if (el2) {
        el2.classList.remove('loading');
        const yVals = periodosPresentes.map(p => invPeriodo[p]);

        Plotly.newPlot(el2, [{
            type: 'bar',
            x: xLabels,
            y: yVals,
            marker: { color: PERIODO_COLORS },
            text: yVals.map(v => '$' + fmt(v, { maximumFractionDigits: 0 })),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 11 },
            cliponaxis: false,
            hovertemplate: '<b>%{x}</b><br>$%{y:,.0f}<extra></extra>',
        }], getLayout('Inversión Total por Periodo', {
            xaxis: { type: 'category', title: 'Periodo' },
            yaxis: {
                title: 'Inversión ($)',
                gridcolor: 'rgba(255,255,255,0.08)',
                tickformat: '$,.0f',
                range: [0, Math.max(...yVals) * 1.25],
            },
            margin: { t: 58, r: 18, b: 68, l: 100 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Variación de Beneficiarios entre Periodos (Δ % línea)
    // ═══════════════════════════════════════════════════════════════════════
    const el3 = document.getElementById('chart-periodo-variacion');
    if (el3) {
        el3.classList.remove('loading');
        const yAbs  = periodosPresentes.map(p => nPeriodo[p]);
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
                textfont: { color: C.naranja, size: 11 },
                hovertemplate: '<b>%{x}</b><br>Δ %{y:.1f}%<extra></extra>',
                yaxis: 'y2',
            },
        ], getLayout('Variación de Beneficiarios entre Periodos', {
            xaxis: { type: 'category', title: 'Periodo' },
            yaxis:  { title: 'Beneficiarios', gridcolor: 'rgba(255,255,255,0.08)' },
            yaxis2: {
                title: 'Variación (%)',
                overlaying: 'y', side: 'right',
                showgrid: false,
                zeroline: true, zerolinecolor: 'rgba(255,255,255,0.3)',
            },
            margin: { t: 58, r: 80, b: 115, l: 72 },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.32 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Importe Promedio por Periodo (línea)
    // ═══════════════════════════════════════════════════════════════════════
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
        }], getLayout('Importe Promedio por Periodo', {
            xaxis: { type: 'category', title: 'Periodo' },
            yaxis: {
                title: 'Importe Promedio ($)',
                gridcolor: 'rgba(255,255,255,0.08)',
                tickformat: '$,.0f',
                range: [0, Math.max(...yVals) * 1.3],
            },
            margin: { t: 58, r: 18, b: 68, l: 100 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Beneficiarios por Tipo de Beca × Periodo (barras agrupadas)
    // ═══════════════════════════════════════════════════════════════════════
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

        // Con beneficiarios únicos, contar por tipo usando el detalle de BECAS
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

        const traces = tipos.map((tipo, i) => {
            const yVals = periodosPresentes.map(p => countTipoEnPeriodo(p, tipo));
            return {
                type: 'bar',
                name: tipo,
                x: xLabels,
                y: yVals,
                marker: { color: TIPO_COLOR[tipo] || C.paleta[i % C.paleta.length] },
                text: yVals.map(v => v > 0 ? v.toLocaleString('es-MX') : ''),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 10 },
                cliponaxis: false,
                hovertemplate: '<b>%{x} · ' + tipo + '</b><br>%{y:,} becas<extra></extra>',
            };
        });

        Plotly.newPlot(el5, traces, getLayout('Becas por Tipo y Periodo', {
            barmode: 'group',
            xaxis: { type: 'category', title: 'Periodo' },
            yaxis: { title: 'Beneficiarios', gridcolor: 'rgba(255,255,255,0.08)' },
            margin: { t: 58, r: 18, b: 90, l: 72 },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.28 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Composición del Mix de Tipos de Beca — barras 100% apiladas
    // ═══════════════════════════════════════════════════════════════════════
    const el6 = document.getElementById('chart-periodo-mix');
    if (el6) {
        el6.classList.remove('loading');

        const TIPO_COLOR = {
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

        const traces = tipos6.map((tipo, i) => {
            const yVals = periodosPresentes.map(p => {
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
                name: tipo,
                x: xLabels,
                y: yVals,
                marker: { color: TIPO_COLOR[tipo] || C.paleta[i % C.paleta.length] },
                text: yVals.map(v => v > 3 ? v.toFixed(1) + '%' : ''),
                textposition: 'inside',
                insidetextanchor: 'middle',
                textfont: { color: '#FFF', size: 10 },
                hovertemplate: '<b>%{x} · ' + tipo + '</b><br>%{y:.1f}%<extra></extra>',
            };
        });

        Plotly.newPlot(el6, traces, getLayout('Composición del Mix de Tipos de Beca por Periodo', {
            barmode: 'stack',
            xaxis: { type: 'category', title: 'Periodo' },
            yaxis: {
                title: '% del total',
                gridcolor: 'rgba(255,255,255,0.08)',
                range: [0, 105],
                ticksuffix: '%',
            },
            margin: { t: 58, r: 18, b: 90, l: 72 },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.28 },
        }), plotConfig);
    }
});
