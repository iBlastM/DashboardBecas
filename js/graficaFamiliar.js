// ── GRAFICA_FAMILIAR.JS ── DashboardBecas ─────────────────────────────────────
// Gráficas de la pestaña Familiar:
//   1. Género del Tutor (donut)
//   2. Edad Promedio del Tutor por Nivel (barras)
//   3. Correlación Edad Tutor × Sector (box plots)
//   4. Rangos de Edades del Tutor (histograma)
//   5. Brecha Generacional  EDAD_TUTOR − EDAD (histograma con anotación)
//   6. Índice de Jefatura Femenina Estimada — % tutoras por colonia (barras)

document.addEventListener('datosListos', () => {
    const data     = window.dashData;
    const conTutor = data.filter(d => d.EDAD_TUTOR > 0);

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Género del Tutor (donut)
    // ═══════════════════════════════════════════════════════════════════════
    const elGT = document.getElementById('chart-genero-tutor');
    if (elGT) {
        elGT.classList.remove('loading');
        const conteo = contarPor(data, 'GENERO_TUTOR');
        Plotly.newPlot(elGT, [{
            type: 'pie',
            hole: 0.52,
            labels: Object.keys(conteo),
            values: Object.values(conteo),
            marker: {
                colors: ['#1dafe9','#cb63e0'],
                line: { color: C.paperBg, width: 2 },
            },
            textfont: { color: '#FFFFFF', size: 13, family: C.fuente },
            textinfo: 'label+percent',
            hovertemplate: '<b>%{label}</b><br>%{value:,} tutores<br>%{percent}<extra></extra>',
        }], getLayout('Género del Tutor', {
            showlegend: false,
            margin: { t: 58, r: 10, b: 20, l: 10 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Edad Promedio del Tutor por Nivel Educativo (barras)
    // ═══════════════════════════════════════════════════════════════════════
    const elETN = document.getElementById('chart-edad-tutor-nivel');
    if (elETN) {
        elETN.classList.remove('loading');
        const promedios = promediarPor(conTutor, 'NIVEL_EDUCATIVO', 'EDAD_TUTOR');
        const niveles   = Object.keys(promedios).filter(n => n && n !== 'Sin dato').sort();
        const vals      = niveles.map(n => +promedios[n].toFixed(1));

        Plotly.newPlot(elETN, [{
            type: 'bar',
            x: niveles,
            y: vals,
            marker: { color: C.paleta.slice(0, niveles.length) },
            text: vals.map(v => v.toFixed(1) + ' años'),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 13 },
            cliponaxis: false,
            hovertemplate: '<b>%{x}</b><br>Edad promedio tutor: %{y:.1f} años<extra></extra>',
        }], getLayout('Edad Promedio del Tutor por Nivel', {
            yaxis: {
                title: 'Edad (años)',
                gridcolor: 'rgba(255,255,255,0.08)',
                range: [0, Math.max(...vals) * 1.3],
            },
            margin: { t: 58, r: 18, b: 58, l: 72 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Correlación Edad Tutor × Sector (box plots)
    // ═══════════════════════════════════════════════════════════════════════
    const elETS = document.getElementById('chart-edad-tutor-sector');
    if (elETS) {
        elETS.classList.remove('loading');
        const sectores = [...new Set(conTutor.map(d => d.SECTOR))].filter(Boolean).sort();
        const traces   = sectores.map((s, i) => ({
            type: 'box',
            name: s,
            y: conTutor.filter(d => d.SECTOR === s).map(d => d.EDAD_TUTOR),
            marker: { color: C.paleta[i % C.paleta.length] },
            boxmean: 'sd',
            hovertemplate: '<b>' + s + '</b><br>Edad: %{y:.0f} años<extra></extra>',
        }));
        Plotly.newPlot(elETS, traces, getLayout('Distribución de Edad del Tutor por Sector', {
            showlegend: false,
            yaxis: { title: 'Edad Tutor (años)', gridcolor: 'rgba(255,255,255,0.08)' },
            margin: { t: 58, r: 18, b: 58, l: 72 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Rangos de Edades del Tutor (histograma agrupado como barras)
    // ═══════════════════════════════════════════════════════════════════════
    const elRE = document.getElementById('chart-edad-tutor-rangos');
    if (elRE) {
        elRE.classList.remove('loading');
        const bins   = [[18,24],[25,29],[30,34],[35,39],[40,44],[45,49],[50,54],[55,59],[60,64],[65,200]];
        const etiq   = ['18-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60-64','65+'];
        const counts = bins.map(([min, max]) =>
            conTutor.filter(d => d.EDAD_TUTOR >= min && d.EDAD_TUTOR <= max).length
        );
        const maxC = Math.max(...counts);

        Plotly.newPlot(elRE, [{
            type: 'bar',
            x: etiq,
            y: counts,
            marker: { color: counts.map(v => v === maxC ? C.naranja : C.verde) },
            text: counts.map(v => v.toLocaleString('es-MX')),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 11 },
            cliponaxis: false,
            hovertemplate: '<b>%{x} AÑOS</b><br>%{y:,} tutores<extra></extra>',
        }], getLayout('Rangos de Edad del Tutor', {
            xaxis: { title: 'Rango de Edad' },
            yaxis: { title: 'Tutores', gridcolor: 'rgba(255,255,255,0.08)' },
            margin: { t: 58, r: 18, b: 68, l: 72 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Brecha Generacional — distribución de (EDAD_TUTOR − EDAD)
    //    Nota: brecha ≥ 45 → posible abuelo/a   |   brecha ≤ 20 → maternidad temprana
    // ═══════════════════════════════════════════════════════════════════════
    const elBG = document.getElementById('chart-brecha-generacional');
    if (elBG) {
        elBG.classList.remove('loading');
        const conAmbos = data.filter(d => d.EDAD_TUTOR > 0 && d.EDAD > 0);
        const brechas  = conAmbos.map(d => d.EDAD_TUTOR - d.EDAD);
        const avgBrecha = brechas.length > 0
            ? (brechas.reduce((a, b) => a + b, 0) / brechas.length).toFixed(1)
            : 0;

        const bins2  = [[-20,4],[5,14],[15,19],[20,24],[25,29],[30,34],[35,39],[40,44],[45,49],[50,200]];
        const etiq2  = ['< 5','5-14','15-19','20-24','25-29','30-34','35-39','40-44','45-49','50+'];
        const counts2 = bins2.map(([min, max]) => brechas.filter(v => v >= min && v < max).length);

        Plotly.newPlot(elBG, [{
            type: 'bar',
            x: etiq2,
            y: counts2,
            marker: {
                color: etiq2.map((_, i) => i >= 8 ? '#A855F7' : i <= 1 ? '#F97316' : C.verde),
            },
            text: counts2.map(v => v.toLocaleString('es-MX')),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 11 },
            cliponaxis: false,
            hovertemplate: '<b>BRECHA %{x} AÑOS</b><br>%{y:,} casos<extra></extra>',
        }], getLayout(`Brecha Generacional · Promedio: ${avgBrecha} años`, {
            xaxis: { title: 'Diferencia de edad (tutor − alumno, años)' },
            yaxis: { title: 'N° de casos', gridcolor: 'rgba(255,255,255,0.08)' },
            margin: { t: 68, r: 18, b: 68, l: 72 },
            annotations: [
                {
                    x: '20-24', y: 1, yref: 'paper', xanchor: 'right', yanchor: 'top',
                    text: '← Maternidad temprana',
                    showarrow: false, font: { color: '#F97316', size: 10 },
                },
                {
                    x: '45-49', y: 1, yref: 'paper', xanchor: 'left', yanchor: 'top',
                    text: 'Posible abuelo/a →',
                    showarrow: false, font: { color: '#A855F7', size: 10 },
                },
            ],
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Índice de Jefatura Femenina Estimada
    //    % de tutoras mujeres por colonia (top 20 colonias con mayor %)
    //    Umbral mínimo: 10 beneficiarios por colonia
    // ═══════════════════════════════════════════════════════════════════════
    const elJF = document.getElementById('chart-jefatura-femenina');
    if (elJF) {
        elJF.classList.remove('loading');

        const stats = {};
        data.forEach(d => {
            const c = d.COLONIA || 'S/D';
            if (!stats[c]) stats[c] = { total: 0, mujeres: 0 };
            stats[c].total++;
            if (d.GENERO_TUTOR === 'MUJER') stats[c].mujeres++;
        });

        // Pre-calcular ranking completo (invariante respecto a n)
        const fullRanked = Object.entries(stats)
            .filter(([, v]) => v.total >= 10)
            .map(([k, v]) => ({ colonia: k, pct: (v.mujeres / v.total) * 100, total: v.total }))
            .sort((a, b) => b.pct - a.pct);

        const renderJefatura = (n) => {
            const ranked = fullRanked.slice(0, n);
            const yLab = ranked.map(r => r.colonia);
            const xVal = ranked.map(r => +r.pct.toFixed(1));
            const text = ranked.map(r => r.pct.toFixed(1) + '% (' + r.total.toLocaleString('es-MX') + ')');

            Plotly.newPlot(elJF, [{
                type: 'bar',
                orientation: 'h',
                x: xVal,
                y: yLab,
                marker: { color: xVal.map(v => v > 70 ? '#EC4899' : v > 55 ? C.naranja : C.verde) },
                text,
                textposition: 'outside',
                textfont: { color: '#FFF', size: 10 },
                cliponaxis: false,
                hovertemplate: '<b>%{y}</b><br>Tutoras mujeres: %{x:.1f}%<extra></extra>',
            }], getLayout(`Índice de Jefatura Femenina Estimada · % Tutoras por Colonia (Top ${n})`, {
                xaxis: { title: '% Tutoras Mujeres', range: [0, 115] },
                yaxis: { autorange: 'reversed' },
                margin: { t: 58, r: 100, b: 58, l: 220 },
            }), plotConfig);
        };

        elJF._renderTop = renderJefatura;
        const selJF = document.querySelector('[data-chart="chart-jefatura-femenina"]');
        const nJF   = +(selJF?.querySelector('.top-btn.active')?.dataset.n ?? 15);
        renderJefatura(nJF);
    }
});
