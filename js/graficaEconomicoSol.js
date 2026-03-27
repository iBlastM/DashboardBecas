// ── GRAFICA_ECONOMICO_SOL.JS ── DashboardBecas · Solicitantes ─────────────────
// Sección "Tasas de Aprobación" — reemplaza la sección Económica del dashboard
// de Beneficiarios con análisis específicos de aprobación/rechazo:
//   1. Distribución de Estatus Final (donut)
//   2. Tasa de Aprobación por Nivel Educativo (barras apiladas)
//   3. Tasa de Aprobación por Sector (barras apiladas)
//   4. Tasa de No-Aprobación por Tipo de Beca — semáforo (barras horizontales)
//      → KPI 2 de propuesta.md: Universidad 13.76%, Secundaria 6.32%, etc.
//   5. Tasa de Aprobación por Etapa (barras apiladas)
//   6. Brecha de Género en Rechazos — KPI 9 (barras apiladas)
//   7. Riesgo de Abandono — solicitantes recurrentes sin aprobación — KPI 10

document.addEventListener('datosListos', () => {
    const data = window.dashData;

    // ── helpers locales ──────────────────────────────────────────────────────

    /** % aprobados sobre total (1 decimal). */
    const tasaPct = (aprobados, total) =>
        total > 0 ? +((aprobados / total) * 100).toFixed(1) : 0;

    /**
     * Agrupa data por `campo` y devuelve un objeto
     * { [valor]: { total, aprobados } }
     */
    const buildStats = (campo) => {
        const stats = {};
        data.forEach(d => {
            const k = d[campo] || 'Sin dato';
            if (!stats[k]) stats[k] = { total: 0, aprobados: 0 };
            stats[k].total++;
            if (d.ES_BENEFICIARIO) stats[k].aprobados++;
        });
        return stats;
    };

    /**
     * Builds stacked-bar traces (Aprobados + No Aprobados) with
     * a floating text scatter showing the approval rate %.
     */
    const stackedAprobTraces = (cats, aprobados, rechazados, totales) => {
        const tasas = cats.map((_, i) =>
            totales[i] > 0 ? ((aprobados[i] / totales[i]) * 100).toFixed(1) : '0.0'
        );
        return [
            {
                type: 'bar', name: 'Aprobados',
                x: cats, y: aprobados,
                marker: { color: C.verde },
                hovertemplate: '<b>%{x}</b><br>Aprobados: %{y:,}<extra></extra>',
            },
            {
                type: 'bar', name: 'No Aprobados',
                x: cats, y: rechazados,
                marker: { color: '#EF4444' },
                hovertemplate: '<b>%{x}</b><br>No Aprobados: %{y:,}<extra></extra>',
            },
            {
                type: 'scatter', mode: 'text',
                x: cats,
                y: totales.map(t => t * 1.06),
                text: tasas.map(t => t + '%'),
                textfont: { color: '#FFFFFF', size: 13, family: C.fuente },
                showlegend: false, hoverinfo: 'none',
            },
        ];
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Distribución de Estatus Final (donut)
    // ═══════════════════════════════════════════════════════════════════════
    const elSD = document.getElementById('chart-estatus-dist');
    if (elSD) {
        elSD.classList.remove('loading');

        const STATUS_LABELS = {
            'CE-APROBADO':    'Aprobado',
            'CON RECHAZOS':   'Con Rechazos',
            'CE-CON RECHAZO': 'Rechazo (CE)',
            'CE-PENDIENTE':   'Pendiente Histórico',
            'PENDIENTE':      'Pendiente',
            'CANCELADO':      'Cancelado',
        };
        const STATUS_COLORS = {
            'CE-APROBADO':    C.verde,
            'CON RECHAZOS':   '#EF4444',
            'CE-CON RECHAZO': '#F97316',
            'CE-PENDIENTE':   '#A855F7',
            'PENDIENTE':      '#FACC15',
            'CANCELADO':      '#6B7280',
        };

        const conteo = {};
        data.forEach(d => {
            const s = d.STATUS || 'Sin dato';
            conteo[s] = (conteo[s] || 0) + 1;
        });

        const totalSD = Object.values(conteo).reduce((a, b) => a + b, 0);
        const labels = [], values = [], colors = [];
        let otrosVal = 0;
        for (const [key, val] of Object.entries(conteo)) {
            if (totalSD > 0 && (val / totalSD) * 100 < 1) {
                otrosVal += val;
            } else {
                labels.push(STATUS_LABELS[key] || key);
                values.push(val);
                colors.push(STATUS_COLORS[key] || C.paleta[4]);
            }
        }
        if (otrosVal > 0) {
            labels.push('Otros');
            values.push(otrosVal);
            colors.push('#6B7280');
        }

        Plotly.newPlot(elSD, [{
            type: 'pie', hole: 0.52,
            labels, values,
            marker: { colors, line: { color: C.paperBg, width: 2 } },
            textfont: { color: '#FFF', size: 12, family: C.fuente },
            textinfo: 'label+percent',
            hovertemplate: '<b>%{label}</b><br>%{value:,} solicitantes<br>%{percent}<extra></extra>',
        }], getLayout('Distribución de Estatus Final', {
            showlegend: false,
            margin: { t: 58, r: 10, b: 20, l: 10 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Tasa de Aprobación por Nivel Educativo (barras apiladas)
    // ═══════════════════════════════════════════════════════════════════════
    const elTN = document.getElementById('chart-tasa-nivel');
    if (elTN) {
        elTN.classList.remove('loading');
        const stats   = buildStats('NIVEL_EDUCATIVO');
        const niveles = Object.keys(stats).filter(k => k !== 'Sin dato').sort();
        const aprob   = niveles.map(n => stats[n].aprobados);
        const rech    = niveles.map(n => stats[n].total - stats[n].aprobados);
        const tot     = niveles.map(n => stats[n].total);

        Plotly.newPlot(elTN,
            stackedAprobTraces(niveles, aprob, rech, tot),
            getLayout('Tasa de Aprobación por Nivel', {
                barmode: 'stack',
                yaxis: { title: 'Solicitantes', gridcolor: 'rgba(255,255,255,0.08)' },
                legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.22 },
                margin: { t: 68, r: 18, b: 58, l: 72 },
            }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Tasa de Aprobación por Sector (barras apiladas)
    // ═══════════════════════════════════════════════════════════════════════
    const elTS = document.getElementById('chart-tasa-sector');
    if (elTS) {
        elTS.classList.remove('loading');
        const stats   = buildStats('SECTOR');
        const sectores = Object.keys(stats).filter(k => k !== 'Sin dato').sort();
        const aprob   = sectores.map(s => stats[s].aprobados);
        const rech    = sectores.map(s => stats[s].total - stats[s].aprobados);
        const tot     = sectores.map(s => stats[s].total);

        Plotly.newPlot(elTS,
            stackedAprobTraces(sectores, aprob, rech, tot),
            getLayout('Tasa de Aprobación por Sector', {
                barmode: 'stack',
                yaxis: { title: 'Solicitantes', gridcolor: 'rgba(255,255,255,0.08)' },
                showlegend: false,
                margin: { t: 68, r: 18, b: 58, l: 72 },
            }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Tasa de No-Aprobación por Tipo de Beca — semáforo (barras horizontales)
    //    KPI 2 propuesta.md: Universidad ~13.8%, Secundaria ~6.3%, Primaria ~6.3%
    //    Rojo > 10 % · Naranja 5–10 % · Verde < 5 %
    // ═══════════════════════════════════════════════════════════════════════
    const elTT = document.getElementById('chart-tasa-tipo');
    if (elTT) {
        elTT.classList.remove('loading');
        const stats    = buildStats('TIPO_BECA');
        const tiposRaw = Object.keys(stats).filter(k => k && k !== 'Sin dato');

        // Ordenar por tasa de no-aprobación descendente
        const tipos = tiposRaw.sort((a, b) => {
            const ta = (stats[a].total - stats[a].aprobados) / (stats[a].total || 1);
            const tb = (stats[b].total - stats[b].aprobados) / (stats[b].total || 1);
            return tb - ta;
        });

        const tasasRechazo = tipos.map(t => {
            const { total, aprobados } = stats[t];
            return total > 0 ? +((( total - aprobados) / total) * 100).toFixed(1) : 0;
        });
        const totales = tipos.map(t => stats[t].total);

        const colorSemaforo = v => v > 10 ? '#EF4444' : v > 5 ? C.naranja : C.verde;
        const maxTasa = Math.max(...tasasRechazo, 0.1);

        Plotly.newPlot(elTT, [{
            type: 'bar',
            orientation: 'h',
            x: tasasRechazo,
            y: tipos,
            marker: { color: tasasRechazo.map(colorSemaforo) },
            text: tasasRechazo.map((t, i) =>
                t.toFixed(1) + '%  (' + totales[i].toLocaleString('es-MX') + ' sol.)'
            ),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 12 },
            cliponaxis: false,
            customdata: totales,
            hovertemplate: '<b>%{y}</b><br>% nunca aprobados: %{x:.1f}%<br>Total solicitudes: %{customdata:,}<extra></extra>',
        }], getLayout('Tasa de No-Aprobación por Tipo de Beca · Semáforo', {
            xaxis: {
                title: '% Nunca Aprobados',
                range: [0, maxTasa * 1.45],
                gridcolor: 'rgba(255,255,255,0.08)',
            },
            yaxis: { autorange: 'reversed' },
            margin: { t: 68, r: 140, b: 78, l: 230 },
            shapes: [
                {
                    type: 'line', x0: 10, x1: 10, y0: 0, y1: 1, yref: 'paper',
                    line: { color: '#EF4444', width: 1.5, dash: 'dot' },
                },
                {
                    type: 'line', x0: 5,  x1: 5,  y0: 0, y1: 1, yref: 'paper',
                    line: { color: C.naranja, width: 1.5, dash: 'dot' },
                },
            ],
            annotations: [
                {
                    x: 10, y: -0.1, yref: 'paper', xanchor: 'center',
                    text: '▲ Alerta (10%)',
                    showarrow: false, font: { color: '#EF4444', size: 10 },
                },
                {
                    x: 5, y: -0.1, yref: 'paper', xanchor: 'center',
                    text: '▲ Atención (5%)',
                    showarrow: false, font: { color: C.naranja, size: 10 },
                },
            ],
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Tasa de Aprobación por Etapa  — KPI 8 (barras apiladas)
    //    propuesta.md: 1ª Etapa 6.75%  ·  2ª Etapa 5.79%
    // ═══════════════════════════════════════════════════════════════════════
    const elTE = document.getElementById('chart-tasa-etapa');
    if (elTE) {
        elTE.classList.remove('loading');
        const stats  = buildStats('ETAPA');
        const etapas = Object.keys(stats).filter(k => k && k !== 'Sin dato').sort();
        const aprob  = etapas.map(e => stats[e].aprobados);
        const rech   = etapas.map(e => stats[e].total - stats[e].aprobados);
        const tot    = etapas.map(e => stats[e].total);

        Plotly.newPlot(elTE,
            stackedAprobTraces(etapas, aprob, rech, tot),
            getLayout('Tasa de Aprobación por Etapa', {
                barmode: 'stack',
                yaxis: { title: 'Solicitantes', gridcolor: 'rgba(255,255,255,0.08)' },
                showlegend: false,
                margin: { t: 68, r: 18, b: 68, l: 72 },
            }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Brecha de Género en Rechazos  — KPI 9 (barras apiladas)
    //    propuesta.md: Hombre 6.80%  ·  Mujer 6.06%
    // ═══════════════════════════════════════════════════════════════════════
    const elTG = document.getElementById('chart-tasa-genero');
    if (elTG) {
        elTG.classList.remove('loading');

        const esMujer  = d => d.GENERO && d.GENERO.toUpperCase().startsWith('MUJ');
        const esHombre = d => d.GENERO && (
            d.GENERO.toUpperCase().startsWith('HOM') ||
            d.GENERO.toUpperCase().startsWith('MAS')
        );

        const grupos = [
            { label: 'Mujer',  fn: esMujer  },
            { label: 'Hombre', fn: esHombre },
        ];

        const cats  = grupos.map(g => g.label);
        const aprob = grupos.map(g => data.filter(d => g.fn(d) && d.ES_BENEFICIARIO).length);
        const tot   = grupos.map(g => data.filter(d => g.fn(d)).length);
        const rech  = grupos.map((_, i) => tot[i] - aprob[i]);

        Plotly.newPlot(elTG,
            stackedAprobTraces(cats, aprob, rech, tot),
            getLayout('Brecha de Género en Rechazos', {
                barmode: 'stack',
                yaxis: { title: 'Solicitantes', gridcolor: 'rgba(255,255,255,0.08)' },
                showlegend: false,
                margin: { t: 68, r: 18, b: 58, l: 72 },
            }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 7. Top CURPs con mayor número de rechazos
    //    Rechazos = TOTAL_SOLICITUDES − NUM_BECAS  (solicitudes no aprobadas)
    // ═══════════════════════════════════════════════════════════════════
    const elTopR = document.getElementById('chart-top-rechazos-curp');
    if (elTopR) {
        elTopR.classList.remove('loading');

        const colorBenef = v => v ? '#3B82F6' : '#EF4444';

        // Pre-calcular ranking completo (invariante respecto a n)
        const fullRanked = data
            .map(d => ({
                curp:     d.CURP || '—',
                rechazos: (d.TOTAL_SOLICITUDES || 0) - (d.NUM_BECAS || 0),
                total:    d.TOTAL_SOLICITUDES || 0,
                becas:    d.NUM_BECAS || 0,
                esBenef:  d.ES_BENEFICIARIO,
                nivel:    d.NIVEL_EDUCATIVO || '',
                tipoBeca: d.TIPO_BECA || '',
            }))
            .filter(d => d.rechazos > 0)
            .sort((a, b) => b.rechazos - a.rechazos);

        const renderTopRechazos = (n) => {
            // Invertir para que el mayor quede arriba en la gráfica horizontal
            const sorted = fullRanked.slice(0, n).reverse();

            Plotly.newPlot(elTopR,
                [
                    {
                        type: 'bar',
                        orientation: 'h',
                        x: sorted.map(d => d.rechazos),
                        y: sorted.map(d => d.curp),
                        marker: { color: sorted.map(d => colorBenef(d.esBenef)) },
                        text: sorted.map(d =>
                            d.rechazos.toLocaleString('es-MX') +
                            '  (' + d.total.toLocaleString('es-MX') + ' sol. · ' +
                            d.becas + ' aprobadas)'
                        ),
                        textposition: 'outside',
                        textfont: { color: '#FFF', size: 10, family: C.fuente },
                        cliponaxis: false,
                        customdata: sorted.map(d => ({
                            total: d.total,
                            becas: d.becas,
                            nivel: d.nivel,
                            tipo:  d.tipoBeca,
                            benef: d.esBenef,
                        })),
                        hovertemplate:
                            '<b>%{y}</b><br>' +
                            'Solicitudes no aprobadas: <b>%{x}</b><br>' +
                            'Total solicitudes: %{customdata.total}<br>' +
                            'Becas aprobadas: %{customdata.becas}<br>' +
                            'Nivel: %{customdata.nivel}<br>' +
                            'Tipo beca: %{customdata.tipo}<br>' +
                            'Beneficiario: %{customdata.benef}<extra></extra>',
                    },
                ],
                getLayout(`Top ${n} CURPs con mayor número de solicitudes no aprobadas`, {
                    xaxis: {
                        title: 'Solicitudes no aprobadas',
                        gridcolor: 'rgba(255,255,255,0.08)',
                    },
                    yaxis: { autorange: 'reversed', tickfont: { size: 10 } },
                    margin: { t: 68, r: 220, b: 58, l: 210 },
                    annotations: [
                        {
                            x: 1, y: -0.07, xref: 'paper', yref: 'paper',
                            xanchor: 'right', yanchor: 'top',
                            text: '<span style="color:#3B82F6">■</span> Eventualmente beneficiario  ' +
                                  '<span style="color:#EF4444">■</span> Nunca aprobado',
                            showarrow: false,
                            font: { color: '#CBD5E1', size: 11, family: C.fuente },
                        },
                    ],
                }),
                plotConfig
            );
        };

        elTopR._renderTop = renderTopRechazos;
        const selTopR = document.querySelector('[data-chart="chart-top-rechazos-curp"]');
        const nTopR   = +(selTopR?.querySelector('.top-btn.active')?.dataset.n ?? 15);
        renderTopRechazos(nTopR);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 8. Riesgo de Abandono — nunca aprobados con múltiples intentos
    //    KPI 10 propuesta.md: ≥3 rechazos 5,879  ·  ≥5 rechazos 3,833  ·  ≥10 rechazos 1,259
    // ═══════════════════════════════════════════════════════════════════════
    const elRA = document.getElementById('chart-riesgo-abandono');
    if (elRA) {
        elRA.classList.remove('loading');

        const noAprobados = data.filter(d => !d.ES_BENEFICIARIO);
        const total = noAprobados.length;

        const umbrales = [1, 2, 3, 5, 10];
        const cuentas  = umbrales.map(u =>
            noAprobados.filter(d => (d.TOTAL_SOLICITUDES || 1) >= u).length
        );
        const labels = umbrales.map(u => u === 1 ? '≥1\n(todos)' : '≥' + u);
        const pcts   = cuentas.map(c => total > 0 ? ((c / total) * 100).toFixed(1) : '0.0');

        Plotly.newPlot(elRA, [{
            type: 'bar',
            x: labels,
            y: cuentas,
            marker: {
                color: ['#6B7280', '#3B82F6', C.naranja, '#F97316', '#EF4444'],
            },
            text: cuentas.map((c, i) =>
                c.toLocaleString('es-MX') + '\n(' + pcts[i] + '%)'
            ),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 10 },
            cliponaxis: false,
            hovertemplate: '<b>%{x} intentos</b><br>%{y:,} sin aprobación<extra></extra>',
        }], getLayout('Riesgo de Abandono · Nunca Aprobados por Nº de Intentos', {
            xaxis: { title: 'Intentos acumulados (sin aprobación)' },
            yaxis: {
                title: 'Solicitantes',
                gridcolor: 'rgba(255,255,255,0.08)',
            },
            margin: { t: 68, r: 18, b: 68, l: 80 },
        }), plotConfig);
    }
});
