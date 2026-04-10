// ── GRAFICA_FAMILIAR.JS ── DashboardBecas ─────────────────────────────────────
// Gráficas de la pestaña Familiar:
//   1. Género del Tutor (donut)
//   2. Edad Promedio del Tutor por Nivel (barras)
//   3. Correlación Edad Tutor × Sector (box plots)
//   4. Rangos de Edades del Tutor (histograma)
//   5. Brecha Generacional  EDAD_TUTOR − EDAD (histograma con anotación)
//   6. Índice de Jefatura Femenina Estimada — % tutoras por colonia (barras)

// ── Helpers locales ─────────────────────────────────────────────────────────
/** Normaliza nombre de sector: accenta "Pública", capitaliza correctamente. */
const normSector = s => {
    const MAP = { PUBLICA: 'Pública', PRIVADA: 'Privada', FEDERAL: 'Federal' };
    if (!s) return s;
    return MAP[s.toUpperCase().trim()] ?? (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());
};

/** Title-case en español: preposiciones/artículos cortos en minúscula. */
const titleCasEs = str => {
    if (!str) return str;
    const PREPS = new Set(['de','del','la','las','los','el','en','y','a','e','o','al','por','con','sin','ante','bajo','sobre','tras','entre','un','una']);
    return str.toLowerCase().split(' ').map((w, i) => {
        if (i > 0 && PREPS.has(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
};

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
            labels: Object.keys(conteo).map(l => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase()),
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
        const niveles   = Object.keys(promedios).filter(n => n && n !== 'Sin dato' && n !== 'UNIVERSIDAD').sort();
        const vals      = niveles.map(n => +promedios[n].toFixed(1));
        const nivelesDisplay = niveles.map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase());

        Plotly.newPlot(elETN, [{
            type: 'bar',
            x: nivelesDisplay,
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

        /** Percentil lineal sobre array numérico ordenado */
        const pctLineal = (arr, p) => {
            const idx  = (p / 100) * (arr.length - 1);
            const lo   = Math.floor(idx);
            const frac = idx - lo;
            return frac === 0 ? arr[lo] : arr[lo] * (1 - frac) + arr[lo + 1] * frac;
        };

        const sectores = [...new Set(conTutor.map(d => d.SECTOR))].filter(Boolean).sort();
        const traces   = sectores.map((s, i) => {
            const edades = conTutor.filter(d => d.SECTOR === s).map(d => d.EDAD_TUTOR).sort((a, b) => a - b);
            const n      = edades.length;
            const q1     = pctLineal(edades, 25);
            const med    = pctLineal(edades, 50);
            const q3     = pctLineal(edades, 75);
            const mean   = edades.reduce((a, b) => a + b, 0) / n;
            const sd     = Math.sqrt(edades.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
            const iqr    = q3 - q1;
            const lf     = Math.max(edades[0],     q1 - 1.5 * iqr);
            const uf     = Math.min(edades[n - 1], q3 + 1.5 * iqr);

            // hoveron:'points' suprime el popup inglés de la caja;
            // el hovertemplate (estático por sector) muestra las estadísticas en español.
            const ht =
                `<b>${normSector(s)}</b>` +
                `<br>Mediana: ${med.toFixed(1)} años` +
                `<br>Cuartil 1 (Q1): ${q1.toFixed(1)} años` +
                `<br>Cuartil 3 (Q3): ${q3.toFixed(1)} años` +
                `<br>Límite inferior: ${lf.toFixed(1)} años` +
                `<br>Límite superior: ${uf.toFixed(1)} años` +
                `<br>Media: ${mean.toFixed(1)} años` +
                `<br>Desv. estándar: ${sd.toFixed(1)} años` +
                `<br>N: ${n.toLocaleString('es-MX')} tutores` +
                `<extra></extra>`;

            return {
                type: 'box',
                name: normSector(s),
                y: edades,
                marker: { color: C.paleta[i % C.paleta.length] },
                boxmean: 'sd',
                hoveron: 'points',
                hovertemplate: ht,
            };
        });

        Plotly.newPlot(elETS, traces, getLayout('Distribución de Edad del Tutor por Sector', {
            showlegend: false,
            yaxis: { title: 'Edad tutor (años)', gridcolor: 'rgba(255,255,255,0.08)' },
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

        const layoutRangosBase = {
            xaxis: { gridcolor: 'rgba(255,255,255,0.08)' },
            yaxis: { gridcolor: 'rgba(255,255,255,0.08)', tickformat: ',' },
            margin: { t: 68, r: 18, b: 55, l: 72 },
        };

        const renderRangosTop = () => {
            const n = +(document.getElementById('rangos-top-n')?.value ?? 5);
            // Ordenar rangos de mayor a menor y tomar los primeros N
            const order = counts
                .map((c, i) => ({ c, i }))
                .sort((a, b) => b.c - a.c)
                .slice(0, n);
            const xTop = order.map(o => etiq[o.i]);
            const yTop = order.map(o => o.c);
            const maxTop = yTop[0] ?? 0;

            Plotly.newPlot(elRE, [{
                type: 'bar',
                x: xTop,
                y: yTop,
                marker: { color: yTop.map((v, i) => i === 0 ? C.naranja : C.verde) },
                text: yTop.map(v => v.toLocaleString('es-MX')),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 11 },
                cliponaxis: false,
                hovertemplate: '<b>%{x} años</b><br>%{y:,} tutores<extra></extra>',
            }], getLayout(`Rangos de Edad del Tutor · Top ${n} con más tutores`, layoutRangosBase), plotConfig);
        };

        // Selección aplicada de rangos (persiste entre aperturas del modal)
        let seleccionRangos = [...etiq];

        const renderRangosComparativa = (sel) => {
            const idxSel  = sel.map(e => etiq.indexOf(e)).filter(i => i >= 0);
            const xSel    = idxSel.map(i => etiq[i]);
            const ySel    = idxSel.map(i => counts[i]);
            const maxCSel = Math.max(...ySel, 0);

            Plotly.newPlot(elRE, [{
                type: 'bar',
                x: xSel,
                y: ySel,
                marker: { color: ySel.map(v => v === maxCSel ? C.naranja : C.verde) },
                text: ySel.map(v => v.toLocaleString('es-MX')),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 11 },
                cliponaxis: false,
                hovertemplate: '<b>%{x} años</b><br>%{y:,} tutores<extra></extra>',
            }], getLayout('Rangos de Edad del Tutor · Selección de rangos', layoutRangosBase), plotConfig);
        };

        // ── Modal de rangos ────────────────────────────────────────────────
        const modal      = document.getElementById('modal-rangos');
        const rngChecks  = document.getElementById('rng-checks');

        const abrirModal = () => {
            if (!modal) return;
            // Sincronizar checkboxes con selección actual
            rngChecks.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = seleccionRangos.includes(cb.value);
            });
            modal.hidden = false;
        };
        const cerrarModal = () => { if (modal) modal.hidden = true; };

        document.getElementById('rng-all')?.addEventListener('click', () => {
            rngChecks.querySelectorAll('input').forEach(cb => cb.checked = true);
        });
        document.getElementById('rng-none')?.addEventListener('click', () => {
            rngChecks.querySelectorAll('input').forEach(cb => cb.checked = false);
        });
        document.getElementById('rng-cancel')?.addEventListener('click', cerrarModal);
        document.getElementById('rng-cancel-btn')?.addEventListener('click', cerrarModal);
        // Clic en overlay fuera del modal también cierra
        modal?.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });

        document.getElementById('rng-apply-btn')?.addEventListener('click', () => {
            const checked = [...rngChecks.querySelectorAll('input:checked')].map(cb => cb.value);
            seleccionRangos = checked.length > 0 ? checked : [...etiq];
            cerrarModal();
            renderRangosComparativa(seleccionRangos);
        });

        // Botones view-toggle
        const vtRangos    = document.getElementById('vt-rangos');
        const rangosTopN  = document.getElementById('rangos-top-n');
        if (vtRangos) {
            vtRangos.querySelectorAll('.vt-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    vtRangos.querySelectorAll('.vt-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    if (btn.dataset.view === 'comparativa') {
                        if (rangosTopN) rangosTopN.hidden = true;
                        abrirModal();
                    } else {
                        if (rangosTopN) rangosTopN.hidden = false;
                        renderRangosTop();
                    }
                });
            });
        }
        // Re-render al cambiar Top N
        rangosTopN?.addEventListener('change', () => {
            const activeBtn = vtRangos?.querySelector('.vt-btn.active');
            if (!activeBtn || activeBtn.dataset.view === 'top') renderRangosTop();
        });

        renderRangosTop();
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
                color: etiq2.map((_, i) => C.paleta[i % C.paleta.length]),
            },
            text: counts2.map(v => v.toLocaleString('es-MX')),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 11, weight: 700 },
            cliponaxis: false,
            hovertemplate: '<b>Brecha %{x} años</b><br>%{y:,} casos<extra></extra>',
        }], getLayout(`Brecha Generacional · Promedio: ${avgBrecha} años`, {
            xaxis: { title: 'Diferencia de edad (tutor − alumno, años)' },
            yaxis: { title: 'N° de casos', gridcolor: 'rgba(255,255,255,0.08)', tickformat: ',' },
            margin: { t: 68, r: 18, b: 68, l: 80 },
            annotations: [
                {
                    x: '20-24', y: 1, yref: 'paper', xanchor: 'right', yanchor: 'top',
                    text: '← Maternidad temprana',
                    showarrow: false, font: { color: C.paleta[1], size: 10 },
                },
                {
                    x: '45-49', y: 1, yref: 'paper', xanchor: 'left', yanchor: 'top',
                    text: 'Posible abuelo/a →',
                    showarrow: false, font: { color: C.paleta[4], size: 10 },
                },
            ],
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Índice de Jefatura Femenina Estimada
    //    % de tutoras mujeres por colonia (top N colonias con mayor %)
    //    Umbral mínimo: 10 beneficiarios por colonia
    // ═══════════════════════════════════════════════════════════════════════
    const elJF = document.getElementById('chart-jefatura-femenina');
    if (elJF) {
        elJF.classList.remove('loading');

        // Paleta de rosas (12 tonos, análoga a C.paleta en verde)
        const PAL_ROSA = [
            '#f48fb1','#f06292','#ec407a','#e91e63',
            '#d81b60','#c2185b','#ad1457','#ff80ab',
            '#ff4081','#f50057','#ff69b4','#db7093',
        ];

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
            .map(([k, v]) => ({ colonia: titleCasEs(k), pct: (v.mujeres / v.total) * 100, total: v.total }))
            .sort((a, b) => b.pct - a.pct);

        const renderJefatura = (n, pctMin = 0) => {
            let filtered = fullRanked;
            if (pctMin > 0) {
                const sortedPcts = fullRanked.map(r => r.pct).slice().sort((a, b) => a - b);
                const idx = Math.floor((pctMin / 100) * sortedPcts.length);
                const umbral = sortedPcts[Math.min(idx, sortedPcts.length - 1)];
                filtered = fullRanked.filter(r => r.pct >= umbral);
            }
            const ranked = filtered.slice(0, n);
            const yLab = ranked.map(r => r.colonia);
            const xVal = ranked.map(r => +r.pct.toFixed(1));
            const text = ranked.map(r => r.pct.toFixed(1) + '% (' + r.total.toLocaleString('es-MX') + ')');

            Plotly.newPlot(elJF, [{
                type: 'bar',
                orientation: 'h',
                x: xVal,
                y: yLab,
                marker: { color: xVal.map((_, i) => PAL_ROSA[i % PAL_ROSA.length]) },
                text,
                textposition: 'outside',
                textfont: { color: '#FFF', size: 10, weight: 700 },
                cliponaxis: false,
                hovertemplate: '<b>%{y}</b><br>Tutoras mujeres: %{x:.1f}%<extra></extra>',
            }], getLayout(`Índice de Jefatura Femenina Estimada · % Tutoras por Colonia (Top ${n})`, {
                xaxis: { title: null, range: [0, 125] },
                yaxis: { autorange: 'reversed' },
                margin: { t: 58, r: 130, b: 30, l: 220 },
            }), plotConfig);
        };

        elJF._renderTop = (n) => {
            const pctSel = document.querySelector('.jf-percentile');
            renderJefatura(n, +(pctSel?.value ?? 0));
        };
        const selJF = document.querySelector('[data-chart="chart-jefatura-femenina"]');
        const nJF   = +(selJF?.querySelector('.top-select')?.value ?? 15);
        const pJF   = +(selJF?.querySelector('.jf-percentile')?.value ?? 0);
        renderJefatura(nJF, pJF);

        // Evento para filtro de percentil
        document.addEventListener('change', function _pctHandler(e) {
            if (!e.target.closest('.jf-percentile')) return;
            const topSel = document.querySelector('[data-chart="chart-jefatura-femenina"] .top-select');
            renderJefatura(+(topSel?.value ?? 15), +e.target.value);
        });
    }
});
