// ── GRAFICA_DEMOGRAFICO.JS ── DashboardBecas ──────────────────────────────────
// Gráficas de la pestaña Demográfico:
//   1. Composición por Género (donut)
//   2. Índice de Paridad de Género (gauge)
//   3. Concentración de Género por Sector (barras agrupadas)
//   4. Pirámide de Edades por rangos (horizontal divergente)
//   5. Edad Promedio por Nivel Educativo (barras)
//   6. Índice de Rezago Educativo (barras)

document.addEventListener('datosListos', () => {
    const data = window.dashData;

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Composición por Género (donut)
    // ═══════════════════════════════════════════════════════════════════════
    const elGen = document.getElementById('chart-genero');
    if (elGen) {
        elGen.classList.remove('loading');
        const GENEROS_VALIDOS = /^(MUJ|HOM|MAS|FEM)/i;
        const dataGen = data.filter(d => d.GENERO && GENEROS_VALIDOS.test(d.GENERO));
        const conteo = contarPor(dataGen, 'GENERO');
        const labels = Object.keys(conteo);
        const values = Object.values(conteo);
        Plotly.newPlot(elGen, [{
            type: 'pie',
            hole: 0.52,
            labels,
            values,
            marker: {
                colors: ['#cb63e0', '#1dafe9'],
                line: { color: C.paperBg, width: 2 },
            },
            textfont: { color: '#FFFFFF', size: 13, family: C.fuente },
            textinfo: 'label+percent',
            hovertemplate: '<b>%{label}</b><br>%{value:,} becarios<br>%{percent}<extra></extra>',
        }], getLayout('Composición por Género', {
            showlegend: false,
            margin: { t: 58, r: 10, b: 20, l: 10 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Índice de Paridad de Género — IPG = Mujeres / Hombres (gauge)
    // ═══════════════════════════════════════════════════════════════════════
    const elPar = document.getElementById('chart-paridad');
    if (elPar) {
        elPar.classList.remove('loading');
        const mujeres = data.filter(d => d.GENERO && d.GENERO.toUpperCase().startsWith('MUJ')).length;
        const hombres = data.filter(d => d.GENERO && (d.GENERO.toUpperCase().startsWith('HOM') || d.GENERO.toUpperCase().startsWith('MAS'))).length;
        const ipg = hombres > 0 ? +(mujeres / hombres).toFixed(3) : 0;

        Plotly.newPlot(elPar, [{
            type: 'indicator',
            mode: 'gauge+number+delta',
            value: ipg,
            delta: {
                reference: 1.0,
                increasing: { color: C.verde },
                decreasing: { color: C.naranja },
            },
            gauge: {
                axis: { range: [0, 2], tickcolor: '#FFFFFF', tickfont: { color: '#FFF', size: 11 } },
                bar: { color: C.verde, thickness: 0.28 },
                bgcolor: C.plotBg,
                bordercolor: 'rgba(255,255,255,0.18)',
                steps: [
                    { range: [0,   0.9], color: 'rgba(239,68,68,0.15)'    },
                    { range: [0.9, 1.1], color: 'rgba(82,188,163,0.18)'   },
                    { range: [1.1, 2],   color: 'rgba(168,85,247,0.15)'   },
                ],
                threshold: { line: { color: '#FFFFFF', width: 2 }, value: 1.0 },
            },
            number: { font: { size: 30, color: '#FFF', family: C.fuente } },
        }], getLayout('Índice de Paridad de Género\nIPG = Mujeres / Hombres  ·  Ideal: 1.0', {
            margin: { t: 68, r: 30, b: 10, l: 30 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Concentración de Género por Sector (barras agrupadas)
    // ═══════════════════════════════════════════════════════════════════════
    const elGS = document.getElementById('chart-genero-sector');
    if (elGS) {
        elGS.classList.remove('loading');
        const sectores = [...new Set(data.map(d => d.SECTOR))].filter(Boolean).sort();
        const gMap = [
            { key: 'MUJ', label: 'Mujer',  color: C.naranja },
            { key: 'HOM', label: 'Hombre', color: C.verde   },
            { key: 'MAS', label: 'Masculino', color: C.verde },
        ];
        // Detectar etiquetas reales en el dataset
        const generosUnicos = [...new Set(data.map(d => d.GENERO).filter(Boolean))];
        const traces = generosUnicos.map((g, i) => ({
            type: 'bar',
            name: g.charAt(0) + g.slice(1).toLowerCase(),
            x: sectores,
            y: sectores.map(s => data.filter(d => d.SECTOR === s && d.GENERO === g).length),
            marker: { color: C.paleta[i % C.paleta.length] },
            text: sectores.map(s => data.filter(d => d.SECTOR === s && d.GENERO === g).length.toLocaleString('es-MX')),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 11 },
            hovertemplate: '<b>%{x} · ' + g + '</b><br>%{y:,} becarios<extra></extra>',
        }));
        Plotly.newPlot(elGS, traces, getLayout('Género por Sector', {
            barmode: 'group',
            yaxis: { title: 'Beneficiarios', gridcolor: 'rgba(255,255,255,0.08)' },
            margin: { t: 58, r: 18, b: 58, l: 72 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Pirámide de Edades (horizontal divergente Mujer ← | → Hombre)
    // ═══════════════════════════════════════════════════════════════════════
    const elPir = document.getElementById('chart-piramide');
    if (elPir) {
        elPir.classList.remove('loading');
        const generosUnicos = [...new Set(data.map(d => d.GENERO).filter(Boolean))];
        const esMujer  = g => g && (g.toUpperCase().startsWith('MUJ') || g.toUpperCase().startsWith('FEM'));
        const esHombre = g => g && (g.toUpperCase().startsWith('HOM') || g.toUpperCase().startsWith('MAS'));

        const rangos = [[0,5],[6,8],[9,11],[12,14],[15,17],[18,20],[21,24],[25,29],[30,99]];
        const etiq   = ['0–5','6–8','9–11','12–14','15–17','18–20','21–24','25–29','30+'];

        const cuenta = (fn, [min, max]) =>
            data.filter(d => fn(d.GENERO) && d.EDAD >= min && d.EDAD <= max).length;

        const yM = rangos.map(r => -cuenta(esMujer,  r));
        const yH = rangos.map(r =>  cuenta(esHombre, r));

        Plotly.newPlot(elPir, [
            {
                type: 'bar', orientation: 'h', name: 'Mujer',
                x: yM, y: etiq,
                marker: { color: C.naranja },
                customdata: yM.map(v => Math.abs(v)),
                text: yM.map(v => Math.abs(v).toLocaleString('es-MX')),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 10 },
                hovertemplate: '<b>%{y}</b><br>%{customdata:,} mujeres<extra></extra>',
            },
            {
                type: 'bar', orientation: 'h', name: 'Hombre',
                x: yH, y: etiq,
                marker: { color: C.verde },
                text: yH.map(v => v.toLocaleString('es-MX')),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 10 },
                hovertemplate: '<b>%{y}</b><br>%{value:,} hombres<extra></extra>',
            },
        ], getLayout('Pirámide de Edades', {
            barmode: 'overlay',
            xaxis: {
                title: 'Becarios',
                tickvals: [],
                zeroline: true,
                zerolinecolor: 'rgba(255,255,255,0.4)',
                zerolinewidth: 2,
            },
            yaxis: { title: 'Rango de Edad' },
            margin: { t: 58, r: 80, b: 84, l: 60 },
            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.22 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Edad Promedio por Nivel Educativo (barras)
    // ═══════════════════════════════════════════════════════════════════════
    const elEN = document.getElementById('chart-edad-nivel');
    if (elEN) {
        elEN.classList.remove('loading');
        const promedios = promediarPor(data, 'NIVEL_EDUCATIVO', 'EDAD');
        const niveles   = Object.keys(promedios).filter(n => n && n !== 'Sin dato').sort();
        const vals      = niveles.map(n => +promedios[n].toFixed(1));

        Plotly.newPlot(elEN, [{
            type: 'bar',
            x: niveles,
            y: vals,
            marker: { color: C.paleta.slice(0, niveles.length) },
            text: vals.map(v => v.toFixed(1) + ' años'),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 13 },
            cliponaxis: false,
            hovertemplate: '<b>%{x}</b><br>Edad promedio: %{y:.1f} años<extra></extra>',
        }], getLayout('Edad Promedio por Nivel Educativo', {
            yaxis: {
                title: 'Edad (años)',
                gridcolor: 'rgba(255,255,255,0.08)',
                range: [0, Math.max(...vals) * 1.3],
            },
            margin: { t: 58, r: 18, b: 58, l: 72 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Índice de Rezago Educativo
    //    Alumnos con edad > (edad esperada para su grado + 2 años)
    //    Primaria:  grado N → edad esperada = 5 + N
    //    Secundaria: grado N → edad esperada = 11 + N
    // ═══════════════════════════════════════════════════════════════════════
    const elRez = document.getElementById('chart-rezago');
    if (elRez) {
        elRez.classList.remove('loading');

        const rezagoN = {}, totalN = {};

        data.forEach(d => {
            if (!d.NIVEL_EDUCATIVO || d.GRADO <= 0) return;
            const nivel = d.NIVEL_EDUCATIVO.toUpperCase();
            let edadEsp;
            if (nivel === 'PRIMARIA')    edadEsp = 5  + d.GRADO;
            else if (nivel === 'SECUNDARIA') edadEsp = 11 + d.GRADO;
            else return;

            totalN[nivel]  = (totalN[nivel] || 0) + 1;
            if (d.EDAD > edadEsp + 2) {
                rezagoN[nivel] = (rezagoN[nivel] || 0) + 1;
            }
        });

        const niveles = Object.keys(totalN).sort();
        const pcts  = niveles.map(n => +(( (rezagoN[n] || 0) / totalN[n]) * 100).toFixed(2));
        const maxPct = Math.max(...pcts, 1);

        Plotly.newPlot(elRez, [{
            type: 'bar',
            x: niveles,
            y: pcts,
            marker: { color: pcts.map(v => v > 10 ? '#EF4444' : v > 5 ? C.naranja : C.verde) },
            text: pcts.map(v => v.toFixed(1) + '%'),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 14 },
            cliponaxis: false,
            hovertemplate: '<b>%{x}</b><br>Rezago estimado: %{y:.1f}%<extra></extra>',
        }], getLayout('Índice de Rezago Educativo · Alumnos con Edad > Norma + 2 Años', {
            yaxis: {
                title: '% de alumnos con rezago',
                gridcolor: 'rgba(255,255,255,0.08)',
                range: [0, maxPct * 1.5],
            },
            margin: { t: 58, r: 18, b: 58, l: 80 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 7. Top de puestos por número de becas (barras agrupadas por puntuación)
    //    Cada barra = un valor único de NUM_BECAS (el "puesto")
    //    El ancho de la barra = cantidad de beneficiarios en ese puesto
    //    El tooltip lista todos los CURPs que comparten ese puesto
    // ═══════════════════════════════════════════════════════════════════════
    const elTopCurps = document.getElementById('chart-top-curps');
    if (elTopCurps) {
        elTopCurps.classList.remove('loading');

        // Cada fila es un beneficiario único; NUM_BECAS = total de becas recibidas.
        // Agrupamos por valor de NUM_BECAS: cada "puesto" = todos los beneficiarios
        // que recibieron exactamente esa cantidad de becas.
        const MAX_CURPS_TOOLTIP = 30;
        const grupos = {};
        data.filter(d => d.NUM_BECAS > 0).forEach(d => {
            const k = d.NUM_BECAS;
            if (!grupos[k]) grupos[k] = { curps: [], importeTotal: 0 };
            if (d.CURP) grupos[k].curps.push(d.CURP);
            grupos[k].importeTotal += (d.IMPORTE || 0);
        });
        const todasClaves = Object.keys(grupos).map(Number).sort((a, b) => b - a);

        const renderTopCurps = (n) => {
            const puestos = todasClaves.slice(0, n);

            const etiquetas  = puestos.map((nb, i) => `#${i + 1} · ${nb} becas  (${grupos[nb].curps.length.toLocaleString('es-MX')} benef.)`);
            const cantidades = puestos.map(nb => grupos[nb].curps.length);
            const maxVal     = Math.max(...cantidades, 1);

            const coloresTop = puestos.map((_, i) => {
                const t = i / Math.max(puestos.length - 1, 1);
                const r = Math.round(229 - t * (229 - 82));
                const g = Math.round(134 + t * (188 - 134));
                const b = Math.round(6   + t * (163 - 6));
                return `rgb(${r},${g},${b})`;
            });

            const tooltips = puestos.map((nb, i) => {
                const g          = grupos[nb];
                const cnt        = g.curps.length;
                const mostrar    = g.curps.slice(0, MAX_CURPS_TOOLTIP);
                const extras     = cnt - mostrar.length;
                const promImporte = cnt > 0
                    ? (g.importeTotal / cnt).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
                    : '$0';
                return (
                    `<b>PUESTO #${i + 1} · ${nb} BECAS</b><br>` +
                    `${cnt.toLocaleString('es-MX')} beneficiarios · Importe prom: ${promImporte}<br>` +
                    `<br><b>CURPs:</b><br>` +
                    mostrar.join('<br>') +
                    (extras > 0 ? `<br><i>… y ${extras} más</i>` : '')
                );
            });

            Plotly.newPlot(elTopCurps, [{
                type: 'bar',
                orientation: 'h',
                x: cantidades,
                y: etiquetas,
                marker: {
                    color: coloresTop,
                    line: { color: 'rgba(255,255,255,0.15)', width: 1 },
                },
                text: cantidades.map(v => v.toLocaleString('es-MX')),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 11 },
                cliponaxis: false,
                customdata: tooltips,
                hovertemplate: '%{customdata}<extra></extra>',
            }], getLayout(`Top ${n} Puestos · Número de Becas Otorgadas por Beneficiario`, {
                xaxis: {
                    title: 'Beneficiarios en el puesto',
                    gridcolor: 'rgba(255,255,255,0.08)',
                    range: [0, maxVal * 1.2],
                },
                yaxis: {
                    autorange: 'reversed',
                    tickfont: { size: 11 },
                },
                margin: { t: 58, r: 80, b: 58, l: 230 },
            }), plotConfig);
        };

        elTopCurps._renderTop = renderTopCurps;
        const selTC = document.querySelector('[data-chart="chart-top-curps"]');
        const nTC   = +(selTC?.querySelector('.top-btn.active')?.dataset.n ?? 15);
        renderTopCurps(nTC);
    }
});
