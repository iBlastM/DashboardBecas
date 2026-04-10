// ── GRAFICA_ACADEMICO.JS ── DashboardBecas ────────────────────────────────────
// Gráficas de la pestaña Académico:
//   1. Distribución de Becas por Nivel Educativo (donut)
//   2. Cobertura por Sector (donut)
//   3. Beneficiarios por Grado Escolar (barras)
//   4. Número de Beneficiarios por Rangos de Promedios (barras)
//   5. Promedio de Calificación por Nivel Educativo (barras horizontales)
//   6. Delegaciones con Alumnos con Promedios Más Altos (barras horizontales)
//   7. Escuelas con Promedios Más Altos (barras horizontales)
//   8. Escuelas con Mayor Número de Beneficiarios (barras horizontales — Top / Comparativa)

document.addEventListener('datosListos', () => {
    const data = window.dashData;

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Distribución de Becas por Nivel Educativo (donut)
    // ═══════════════════════════════════════════════════════════════════════
    const elBN = document.getElementById('chart-becas-nivel');
    if (elBN) {
        elBN.classList.remove('loading');
        const conteo = contarPor(data, 'NIVEL_EDUCATIVO');
        Plotly.newPlot(elBN, [{
            type: 'pie',
            hole: 0.52,
            labels: Object.keys(conteo).map(l => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase()),
            values: Object.values(conteo),
            marker: {
                colors: C.paleta,
                line: { color: C.paperBg, width: 2 },
            },
            textfont: { color: '#FFF', size: 13, family: C.fuente },
            textinfo: 'label+percent',
            hovertemplate: '<b>%{label}</b><br>%{value:,} becarios<br>%{percent}<extra></extra>',
        }], getLayout('Distribución por Nivel Educativo', {
            showlegend: false,
            margin: { t: 58, r: 10, b: 20, l: 10 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Cobertura por Sector (donut)
    // ═══════════════════════════════════════════════════════════════════════
    const elPS = document.getElementById('chart-penetracion-sector');
    if (elPS) {
        elPS.classList.remove('loading');
        const conteo = contarPor(data, 'SECTOR');
        const normSector = s => {
            const m = { 'PUBLICA': 'Pública', 'PRIVADA': 'Privada', 'FEDERAL': 'Federal' };
            return m[s.toUpperCase()] || (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());
        };
        Plotly.newPlot(elPS, [{
            type: 'pie',
            hole: 0.52,
            labels: Object.keys(conteo).map(normSector),
            values: Object.values(conteo),
            marker: {
                colors: [C.verde, C.naranja, '#A855F7'],
                line: { color: C.paperBg, width: 2 },
            },
            textfont: { color: '#FFF', size: 13, family: C.fuente },
            textinfo: 'label+percent',
            hovertemplate: '<b>%{label}</b><br>%{value:,} becarios<br>%{percent}<extra></extra>',
        }], getLayout('Cobertura por Sector', {
            showlegend: false,
            margin: { t: 58, r: 10, b: 20, l: 10 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Beneficiarios por Grado Escolar (barras)
    // ═══════════════════════════════════════════════════════════════════════
    const elGr = document.getElementById('chart-grado');
    if (elGr) {
        elGr.classList.remove('loading');
        const conGrado = data.filter(d => d.GRADO > 0);
        const conteo   = contarPor(conGrado, 'GRADO');
        const grados   = Object.keys(conteo).map(Number).sort((a, b) => a - b).map(String);
        const vals     = grados.map(g => conteo[g] || 0);

        Plotly.newPlot(elGr, [{
            type: 'bar',
            x: grados.map(g => 'Grado ' + g),
            y: vals,
            marker: { color: C.paleta.slice(0, grados.length) },
            text: vals.map(v => v.toLocaleString('es-MX')),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 11 },
            cliponaxis: false,
            hovertemplate: '<b>%{x}</b><br>%{y:,} becarios<extra></extra>',
        }], getLayout('Beneficiarios por Grado Escolar', {
            xaxis: { title: null },
            yaxis: { title: null, gridcolor: 'rgba(255,255,255,0.08)', tickformat: ',' },
            margin: { t: 58, r: 18, b: 58, l: 60 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Número de Beneficiarios por Rangos de Promedios (barras)
    // ═══════════════════════════════════════════════════════════════════════
    const elRP = document.getElementById('chart-rangos-promedio');
    if (elRP) {
        elRP.classList.remove('loading');
        const conProm = data.filter(d => d.PROMEDIO != null && d.PROMEDIO > 0);

        const rangos = [
            { lo: 0,   hi: 6,    label: '< 6.0'   },
            { lo: 6,   hi: 7,    label: '6.0 – 6.9' },
            { lo: 7,   hi: 8,    label: '7.0 – 7.9' },
            { lo: 8,   hi: 9,    label: '8.0 – 8.9' },
            { lo: 9,   hi: 9.95, label: '9.0 – 9.9' },
            { lo: 9.95,hi: 10.1, label: '10.0'      },
        ];
        const etiq = rangos.map(r => r.label);
        const vals = rangos.map(r => conProm.filter(d => d.PROMEDIO >= r.lo && d.PROMEDIO < r.hi).length);

        Plotly.newPlot(elRP, [{
            type: 'bar',
            x: etiq,
            y: vals,
            marker: { color: C.paleta.slice(0, etiq.length) },
            text: vals.map(v => v.toLocaleString('es-MX')),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 11 },
            cliponaxis: false,
            hovertemplate: '<b>Promedio %{x}</b><br>%{y:,} beneficiarios<extra></extra>',
        }], getLayout('Número de Beneficiarios por Rangos de Promedios', {
            xaxis: { title: null },
            yaxis: { title: null, gridcolor: 'rgba(255,255,255,0.08)', tickformat: ',' },
            margin: { t: 58, r: 18, b: 68, l: 60 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Promedio de Calificación por Nivel Educativo (barras horizontales)
    // ═══════════════════════════════════════════════════════════════════════
    const elPN = document.getElementById('chart-promedio-nivel');
    if (elPN) {
        elPN.classList.remove('loading');
        const conProm = data.filter(d => d.PROMEDIO != null && d.PROMEDIO > 0 && d.NIVEL_EDUCATIVO);

        const promediosPorNivel = {};
        const cuentasPorNivel  = {};
        conProm.forEach(d => {
            const k = d.NIVEL_EDUCATIVO.charAt(0).toUpperCase() + d.NIVEL_EDUCATIVO.slice(1).toLowerCase();
            promediosPorNivel[k] = (promediosPorNivel[k] || 0) + d.PROMEDIO;
            cuentasPorNivel[k]  = (cuentasPorNivel[k]  || 0) + 1;
        });
        const niveles    = Object.keys(promediosPorNivel).sort();
        const promedios  = niveles.map(k => +(promediosPorNivel[k] / cuentasPorNivel[k]).toFixed(2));
        const minProm    = Math.max(0, Math.min(...promedios) - 0.5);

        Plotly.newPlot(elPN, [{
            type: 'bar',
            orientation: 'h',
            x: promedios,
            y: niveles,
            marker: { color: C.paleta.slice(0, niveles.length) },
            text: promedios.map(v => v.toFixed(2)),
            textposition: 'outside',
            textfont: { color: '#FFF', size: 12 },
            cliponaxis: false,
            hovertemplate: '<b>%{y}</b><br>Promedio: %{x:.2f}<extra></extra>',
        }], getLayout('Promedio de Calificación por Nivel Educativo', {
            xaxis: { title: null, range: [minProm, 10.4] },
            yaxis: { title: null, autorange: 'reversed' },
            margin: { t: 58, r: 60, b: 48, l: 120 },
        }), plotConfig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Delegaciones con Alumnos con Promedios Más Altos (barras horiz.)
    // ═══════════════════════════════════════════════════════════════════════
    const elDP = document.getElementById('chart-delegaciones-promedio');
    if (elDP) {
        elDP.classList.remove('loading');
        const conProm = data.filter(d => d.PROMEDIO != null && d.PROMEDIO > 0 && d.DELEGACION);

        const promMap = {};
        const cntMap  = {};
        conProm.forEach(d => {
            const k = d.DELEGACION.charAt(0).toUpperCase() + d.DELEGACION.slice(1).toLowerCase();
            promMap[k] = (promMap[k] || 0) + d.PROMEDIO;
            cntMap[k]  = (cntMap[k]  || 0) + 1;
        });
        const fullRank = Object.entries(promMap)
            .map(([k, s]) => [k, +(s / cntMap[k]).toFixed(2)])
            .sort((a, b) => b[1] - a[1]);

        const renderDelegacionesProm = (n) => {
            const ranking = fullRank.slice(0, n);
            const labels  = ranking.map(r => r[0]);
            const vals    = ranking.map(r => r[1]);
            const minProm = Math.max(0, Math.min(...vals) - 0.3);

            Plotly.newPlot(elDP, [{
                type: 'bar',
                orientation: 'h',
                x: vals,
                y: labels,
                marker: { color: vals.map((_, i) => C.paleta[i % C.paleta.length]) },
                text: vals.map(v => v.toFixed(2)),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 11 },
                cliponaxis: false,
                hovertemplate: '<b>%{y}</b><br>Promedio: %{x:.2f}<extra></extra>',
            }], getLayout(`Delegaciones con Alumnos con Promedios Más Altos`, {
                xaxis: { title: null, range: [minProm, 10.4] },
                yaxis: { title: null, autorange: 'reversed' },
                margin: { t: 58, r: 60, b: 48, l: 220 },
            }), plotConfig);
        };

        elDP._renderTop = renderDelegacionesProm;
        const selDP = document.querySelector('[data-chart="chart-delegaciones-promedio"]');
        const nDP   = +(selDP?.querySelector('.top-select')?.value ?? 10);
        renderDelegacionesProm(nDP);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 7. Escuelas con Promedios Más Altos (barras horizontales)
    // ═══════════════════════════════════════════════════════════════════════
    const elEP = document.getElementById('chart-escuelas-promedio');
    if (elEP) {
        elEP.classList.remove('loading');
        const conProm = data.filter(d => d.PROMEDIO != null && d.PROMEDIO > 0 && d.ESCUELA);

        const promMap = {};
        const cntMap  = {};
        conProm.forEach(d => {
            const k = d.ESCUELA.charAt(0).toUpperCase() + d.ESCUELA.slice(1).toLowerCase();
            promMap[k] = (promMap[k] || 0) + d.PROMEDIO;
            cntMap[k]  = (cntMap[k]  || 0) + 1;
        });
        // Sólo escuelas con al menos 5 beneficiarios para minimizar sesgo
        const fullRank = Object.entries(promMap)
            .filter(([k]) => cntMap[k] >= 5)
            .map(([k, s]) => [k, +(s / cntMap[k]).toFixed(2)])
            .sort((a, b) => b[1] - a[1]);

        const renderEscuelasProm = (n) => {
            const ranking = fullRank.slice(0, n);
            const labels  = ranking.map(r => r[0]);
            const vals    = ranking.map(r => r[1]);
            const minProm = Math.max(0, Math.min(...vals) - 0.3);

            Plotly.newPlot(elEP, [{
                type: 'bar',
                orientation: 'h',
                x: vals,
                y: labels,
                marker: { color: vals.map((_, i) => C.paleta[i % C.paleta.length]) },
                text: vals.map(v => v.toFixed(2)),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 11 },
                cliponaxis: false,
                hovertemplate: '<b>%{y}</b><br>Promedio: %{x:.2f}<extra></extra>',
            }], getLayout(`Escuelas con Promedios Más Altos`, {
                xaxis: { title: null, range: [minProm, 10.4] },
                yaxis: { title: null, autorange: 'reversed' },
                margin: { t: 58, r: 60, b: 48, l: 300 },
            }), plotConfig);
        };

        elEP._renderTop = renderEscuelasProm;
        const selEP = document.querySelector('[data-chart="chart-escuelas-promedio"]');
        const nEP   = +(selEP?.querySelector('.top-select')?.value ?? 10);
        renderEscuelasProm(nEP);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 8. Escuelas con Mayor Número de Beneficiarios (barras horiz. — Top / Comparativa)
    // ═══════════════════════════════════════════════════════════════════════
    const elTE = document.getElementById('chart-top-escuelas');
    if (elTE) {
        elTE.classList.remove('loading');

        const conteo   = contarPor(data.filter(d => d.ESCUELA), 'ESCUELA');
        const fullRank = sortedDesc(conteo);

        const normEscuela = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

        // Todas las escuelas normalizadas, en orden descendente por beneficiarios
        const todasEscuelas = fullRank.map(r => normEscuela(r[0]));

        // ── Vista Top ────────────────────────────────────────────────────
        const renderTopEscuelas = (n) => {
            const ranking = fullRank.slice(0, n);
            const labels  = ranking.map(r => normEscuela(r[0]));
            const vals    = ranking.map(r => r[1]);
            const maxV    = Math.max(...vals, 1);

            Plotly.newPlot(elTE, [{
                type: 'bar',
                orientation: 'h',
                x: vals,
                y: labels,
                marker: { color: vals.map(v => v === maxV ? C.naranja : C.verde) },
                text: vals.map(v => v.toLocaleString('es-MX')),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 11 },
                cliponaxis: false,
                hovertemplate: '<b>%{y}</b><br>%{x:,} beneficiarios<extra></extra>',
            }], getLayout('Escuelas con Mayor Número de Beneficiarios', {
                xaxis: { title: null, tickformat: ',' },
                yaxis: { title: null, autorange: 'reversed' },
                margin: { t: 58, r: 80, b: 48, l: 340 },
            }), plotConfig);
        };

        // ── Vista Comparativa (selección de escuelas) ─────────────────────
        const renderComparativaEscuelas = (sel) => {
            // sel: array de nombres de escuelas normalizados ya seleccionados
            const displayed = sel.length > 0 ? sel : todasEscuelas;
            // Mantener orden descendente por beneficiarios
            const ranking = fullRank
                .filter(r => displayed.includes(normEscuela(r[0])))
                .slice();
            const labels = ranking.map(r => normEscuela(r[0]));
            const vals   = ranking.map(r => r[1]);
            const maxV   = Math.max(...vals, 1);

            Plotly.newPlot(elTE, [{
                type: 'bar',
                orientation: 'h',
                x: vals,
                y: labels,
                marker: { color: vals.map(v => v === maxV ? C.naranja : C.verde) },
                text: vals.map(v => v.toLocaleString('es-MX')),
                textposition: 'outside',
                textfont: { color: '#FFF', size: 11 },
                cliponaxis: false,
                hovertemplate: '<b>%{y}</b><br>%{x:,} beneficiarios<extra></extra>',
            }], getLayout('Escuelas con Mayor Número de Beneficiarios · Comparativa', {
                xaxis: { title: null, tickformat: ',' },
                yaxis: { title: null, autorange: 'reversed' },
                margin: { t: 58, r: 80, b: 48, l: 340 },
            }), plotConfig);
        };

        // ── Modal ────────────────────────────────────────────────────────
        const modal     = document.getElementById('modal-top-escuelas');
        const escChecks = document.getElementById('esc-checks');

        // Generar checkboxes dinámicamente con todas las escuelas
        if (escChecks) {
            todasEscuelas.forEach(esc => {
                const lbl = document.createElement('label');
                lbl.className = 'rng-opt';
                lbl.innerHTML = `<input type="checkbox" value="${esc}" checked><span>${esc}</span>`;
                escChecks.appendChild(lbl);
            });
        }

        // Selección persistida entre aperturas del modal
        let seleccionEscuelas = [...todasEscuelas];

        const abrirModal = () => {
            if (!modal) return;
            // Limpiar búsqueda y mostrar todas las opciones
            if (escSearch) { escSearch.value = ''; filterEscChecks(''); }
            escChecks?.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = seleccionEscuelas.includes(cb.value);
            });
            modal.hidden = false;
        };
        const cerrarModal = () => { if (modal) modal.hidden = true; };

        // ── Buscador ─────────────────────────────────────────────────────
        const escSearch = document.getElementById('esc-search');
        const filterEscChecks = (q) => {
            const term = q.trim().toLowerCase();
            escChecks?.querySelectorAll('label.rng-opt').forEach(lbl => {
                lbl.hidden = term !== '' && !lbl.querySelector('span').textContent.toLowerCase().includes(term);
            });
        };
        escSearch?.addEventListener('input', () => filterEscChecks(escSearch.value));

        document.getElementById('esc-all')?.addEventListener('click', () => {
            escChecks?.querySelectorAll('label.rng-opt:not([hidden]) input').forEach(cb => cb.checked = true);
        });
        document.getElementById('esc-none')?.addEventListener('click', () => {
            escChecks?.querySelectorAll('label.rng-opt:not([hidden]) input').forEach(cb => cb.checked = false);
        });
        document.getElementById('esc-close')?.addEventListener('click', cerrarModal);
        document.getElementById('esc-cancel-btn')?.addEventListener('click', cerrarModal);
        modal?.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });

        document.getElementById('esc-apply-btn')?.addEventListener('click', () => {
            const checked = [...(escChecks?.querySelectorAll('input:checked') ?? [])].map(cb => cb.value);
            seleccionEscuelas = checked.length > 0 ? checked : [...todasEscuelas];
            cerrarModal();
            renderComparativaEscuelas(seleccionEscuelas);
        });

        // ── Controles ────────────────────────────────────────────────────
        const vtTE   = document.getElementById('vt-top-escuelas');
        const selTE  = document.getElementById('top-escuelas-top-n');
        let   modeTE = 'top';
        let   nTE    = +(selTE?.value ?? 15);

        if (vtTE) {
            vtTE.querySelectorAll('.vt-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    vtTE.querySelectorAll('.vt-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    modeTE = btn.dataset.view;
                    if (modeTE === 'comparativa') {
                        if (selTE) selTE.hidden = true;
                        abrirModal();
                    } else {
                        if (selTE) selTE.hidden = false;
                        renderTopEscuelas(nTE);
                    }
                });
            });
        }

        if (selTE) {
            selTE.addEventListener('change', () => {
                nTE = +selTE.value;
                renderTopEscuelas(nTE);
            });
        }

        renderTopEscuelas(nTE);
    }
});
