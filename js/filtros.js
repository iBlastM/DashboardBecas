// ── FILTROS.JS ── DashboardBecas ───────────────────────────────────────────────
// Barra de filtros multi-selección: Tipo · Año · Etapa · Sector · Municipio · Escuela
// Oculta opciones sin resultados (faceted search) y aplica lógica AND entre grupos.
// Actualiza window.dashData y re-dispara 'datosListos' para refrescar charts.

(function () {
    let _debounce = null;

    // Municipios canónicos; cualquier otro se agrupa como 'Otro'
    const MUNICIPIOS_FIJOS = ['Corregidora', 'El Marqués', 'Huimilpan', 'Querétaro'];
    function normalizarMunicipio(m) {
        if (!m) return 'Otro';
        const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const found = MUNICIPIOS_FIJOS.find(f => slug(f) === slug(m));
        return found || 'Otro';
    }

    // ── Obtener valores seleccionados en un ms-wrap (solo visibles) ──────────
    function getSelected(wrapId) {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return [];
        return [...wrap.querySelectorAll('input[type="checkbox"]:checked')]
            .filter(cb => cb.closest('.ms-opt')?.style.display !== 'none')
            .map(cb => cb.value);
    }

    // ── Snapshot completo de selección activa ────────────────────────────────
    function getSeleccion() {
        const tipos      = getSelected('ms-tipo');
        const aniosStr   = getSelected('ms-anio');
        const etapaVals  = getSelected('ms-etapa');
        const sector     = getSelected('ms-sector');
        const municipios = getSelected('ms-municipio');
        const escuelas   = getSelected('ms-escuela');
        return {
            tipos,
            anios:      aniosStr.map(Number),
            etapaVals,
            etapaCodes: etapaVals.map(e =>
                e === '1RA ETAPA' ? 'E1' : e === '2DA ETAPA' ? 'E2' : 'EX'
            ),
            sector,
            municipios,
            escuelas,
        };
    }

    // ── Actualizar texto del botón trigger ───────────────────────────────────
    function updateTrigger(wrapId, placeholder) {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return;
        const vals = getSelected(wrapId);
        const span = wrap.querySelector('.ms-text');
        if (!span) return;
        if (vals.length === 0) {
            span.textContent = placeholder;
            span.style.color = '';
        } else {
            span.textContent = vals.length === 1
                ? wrap.querySelector(`input[value="${CSS.escape(vals[0])}"]`)
                      ?.closest('.ms-opt')?.textContent.trim() || vals[0]
                : vals.length + ' seleccionados';
            span.style.color = 'var(--accent-1)';
        }
    }

    // ── Inicializar un ms-wrap (toggle, cierre externo, change) ─────────────
    function initWrap(wrapId, placeholder, onChange) {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return;
        const btn   = wrap.querySelector('.ms-btn');
        const panel = wrap.querySelector('.ms-panel');
        if (!btn || !panel) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = wrap.classList.contains('open');
            document.querySelectorAll('.ms-wrap.open').forEach(w => {
                w.classList.remove('open');
                w.querySelector('.ms-panel')?.setAttribute('hidden', '');
            });
            if (!isOpen) {
                wrap.classList.add('open');
                panel.removeAttribute('hidden');
            }
        });

        panel.addEventListener('change', () => {
            updateTrigger(wrapId, placeholder);
            if (onChange) onChange();
        });
    }

    // Cerrar todos al hacer clic fuera
    document.addEventListener('click', () => {
        document.querySelectorAll('.ms-wrap.open').forEach(w => {
            w.classList.remove('open');
            w.querySelector('.ms-panel')?.setAttribute('hidden', '');
        });
    });

    // ── Comprobar si un registro pasa el filtro (año AND etapa AND tipo) ─────
    // Pasar null para omitir ese criterio.
    function becasMatchFilter(record, anios, etapaCodes, tipos) {
        if (Array.isArray(record.BECAS) && record.BECAS.length > 0) {
            return record.BECAS.some(b => {
                const okAnio  = anios      === null || (b.PERIODO && anios.some(a => b.PERIODO.startsWith(a + '-')));
                const okEtapa = etapaCodes === null || (b.PERIODO && etapaCodes.some(ec => b.PERIODO.endsWith('-' + ec)));
                const okTipo  = tipos      === null || tipos.includes(b.TIPO_BECA);
                return okAnio && okEtapa && okTipo;
            });
        }
        // Registro plano (sin array BECAS)
        const okAnio  = anios      === null || anios.includes(record.AÑO);
        const etCode = record.ETAPA === '1RA ETAPA' ? 'E1' : record.ETAPA === '2DA ETAPA' ? 'E2' : 'EX';
        const okEtapa = etapaCodes === null || etapaCodes.includes(etCode);
        const okTipo  = tipos      === null || tipos.includes(record.TIPO_BECA);
        return okAnio && okEtapa && okTipo;
    }

    // ── Aplicar todos los filtros activos EXCEPTO los grupos en 'skip' ───────
    function applyFiltersExcept(skip, sel) {
        let data = window.dashDataFull;

        const useTipo  = !skip.includes('tipo')  && sel.tipos.length > 0;
        const useAnio  = !skip.includes('anio')  && sel.anios.length > 0;
        const useEtapa = !skip.includes('etapa') && sel.etapaCodes.length > 0;

        if (useTipo || useAnio || useEtapa) {
            data = data.filter(r => becasMatchFilter(
                r,
                useAnio  ? sel.anios      : null,
                useEtapa ? sel.etapaCodes : null,
                useTipo  ? sel.tipos      : null
            ));
        }
        if (!skip.includes('sector')    && sel.sector.length)
            data = data.filter(r => sel.sector.includes(r.SECTOR));
        if (!skip.includes('municipio') && sel.municipios.length)
            data = data.filter(r => sel.municipios.includes(normalizarMunicipio(r.MUNICIPIO)));
        if (!skip.includes('escuela')   && sel.escuelas.length)
            data = data.filter(r => sel.escuelas.includes(r.ESCUELA));

        return data;
    }

    // ── Actualizar opciones visibles de TODOS los filtros (faceted search) ───
    // Oculta opciones que no producirían resultados con los filtros actuales.
    // Para dimensiones dentro de BECAS (tipo/año/etapa) filtra becas individualmente
    // con el resto de criterios activos para evitar contaminación cruzada.
    function actualizarOpcionesVisibles() {
        const sel = getSeleccion();

        // ── helper: ¿esta beca cumple los criterios dados? ───────────────────
        function becaOk(b, anios, etapaCodes, tipos) {
            const okAnio  = !anios.length      || (b.PERIODO && anios.some(a => b.PERIODO.startsWith(a + '-')));
            const okEtapa = !etapaCodes.length || (b.PERIODO && etapaCodes.some(ec => b.PERIODO.endsWith('-' + ec)));
            const okTipo  = !tipos.length      || tipos.includes(b.TIPO_BECA);
            return okAnio && okEtapa && okTipo;
        }

        // ── Tipos ─────────────────────────────────────────────────────────────
        // Restricción: de los registros que pasan año+etapa+sector+municipio+escuela,
        // contar solo las becas que también pasan año y etapa.
        const validTipos = new Set();
        applyFiltersExcept(['tipo'], sel).forEach(r => {
            if (Array.isArray(r.BECAS))
                r.BECAS.forEach(b => {
                    if (b.TIPO_BECA && becaOk(b, sel.anios, sel.etapaCodes, []))
                        validTipos.add(b.TIPO_BECA);
                });
            else if (r.TIPO_BECA) validTipos.add(r.TIPO_BECA);
        });
        document.querySelectorAll('#ms-tipo .ms-opt').forEach(opt => {
            const cb = opt.querySelector('input');
            if (!cb) return;
            const show = validTipos.has(cb.value);
            opt.style.display = show ? '' : 'none';
            if (!show) cb.checked = false;
        });
        updateTrigger('ms-tipo', 'Todos');

        // ── Años ──────────────────────────────────────────────────────────────
        // De los registros que pasan tipo+etapa+sector+municipio+escuela,
        // contar solo las becas que también pasan tipo y etapa.
        const validAnios = new Set();
        applyFiltersExcept(['anio'], sel).forEach(r => {
            if (Array.isArray(r.BECAS))
                r.BECAS.forEach(b => {
                    if (b.PERIODO && becaOk(b, [], sel.etapaCodes, sel.tipos))
                        validAnios.add(b.PERIODO.split('-')[0]);
                });
            else if (r.AÑO) validAnios.add(String(r.AÑO));
        });
        document.querySelectorAll('#ms-anio .ms-opt').forEach(opt => {
            const cb = opt.querySelector('input');
            if (!cb) return;
            const show = validAnios.has(cb.value);
            opt.style.display = show ? '' : 'none';
            if (!show) cb.checked = false;
        });
        updateTrigger('ms-anio', 'Todos');

        // ── Etapas ────────────────────────────────────────────────────────────
        // De los registros que pasan tipo+año+sector+municipio+escuela,
        // contar solo las becas que también pasan tipo y año.
        const validEtapas = new Set();
        applyFiltersExcept(['etapa'], sel).forEach(r => {
            if (Array.isArray(r.BECAS)) {
                r.BECAS.forEach(b => {
                    if (b.PERIODO && becaOk(b, sel.anios, [], sel.tipos)) {
                        const parts = b.PERIODO.split('-');
                        if (parts.length > 1) validEtapas.add(parts[1]);
                    }
                });
            } else if (r.ETAPA) {
                validEtapas.add(r.ETAPA === '1RA ETAPA' ? 'E1' : r.ETAPA === '2DA ETAPA' ? 'E2' : 'EX');
            }
        });
        document.querySelectorAll('#ms-etapa .ms-opt[data-etapa]').forEach(opt => {
            const show = validEtapas.has(opt.dataset.etapa);
            opt.style.display = show ? '' : 'none';
            if (!show) opt.querySelector('input').checked = false;
        });
        updateTrigger('ms-etapa', 'Todas');

        // ── Sectores ─────────────────────────────────────────────────────────
        const validSectores = new Set(
            applyFiltersExcept(['sector'], sel).map(r => r.SECTOR).filter(Boolean)
        );
        document.querySelectorAll('#ms-sector .ms-opt').forEach(opt => {
            const cb = opt.querySelector('input');
            if (!cb) return;
            const show = validSectores.has(cb.value);
            opt.style.display = show ? '' : 'none';
            if (!show) cb.checked = false;
        });
        updateTrigger('ms-sector', 'Todos');

        // ── Municipios ────────────────────────────────────────────────────────
        const validMunicipios = new Set(
            applyFiltersExcept(['municipio'], sel).map(r => normalizarMunicipio(r.MUNICIPIO))
        );
        document.querySelectorAll('#ms-municipio .ms-opt').forEach(opt => {
            const cb = opt.querySelector('input');
            if (!cb) return;
            const show = validMunicipios.has(cb.value);
            opt.style.display = show ? '' : 'none';
            if (!show) cb.checked = false;
        });
        updateTrigger('ms-municipio', 'Todos');

        // ── Escuelas ──────────────────────────────────────────────────────────
        // Usar ESCUELA a nivel de beca (si existe) para respetar el tipo/año/etapa
        const validEscuelas = new Set();
        applyFiltersExcept(['escuela'], sel).forEach(r => {
            if (Array.isArray(r.BECAS) && r.BECAS.length > 0) {
                r.BECAS.forEach(b => {
                    if (b.ESCUELA && becaOk(b, sel.anios, sel.etapaCodes, sel.tipos))
                        validEscuelas.add(b.ESCUELA);
                });
                // Fallback: si las becas no tienen ESCUELA individual (datos legacy)
                if (validEscuelas.size === 0 && r.ESCUELA) validEscuelas.add(r.ESCUELA);
            } else if (r.ESCUELA) {
                validEscuelas.add(r.ESCUELA);
            }
        });
        const q = (document.getElementById('escuela-search')?.value || '').trim().toLowerCase();
        document.querySelectorAll('#ms-escuela .ms-opt').forEach(opt => {
            const cb = opt.querySelector('input');
            if (!cb) return;
            const validByData   = validEscuelas.has(cb.value);
            const validBySearch = !q || opt.textContent.trim().toLowerCase().includes(q);
            const show = validByData && validBySearch;
            opt.style.display = show ? '' : 'none';
            if (!show) cb.checked = false;
        });
        updateTrigger('ms-escuela', 'Todas');
    }

    // ── Poblar dropdown de municipios ─────────────────────────────────────────
    function poblarMunicipios() {
        const panel = document.querySelector('#ms-municipio .ms-panel');
        if (!panel) return;
        panel.innerHTML = '';
        [...MUNICIPIOS_FIJOS, 'Otro'].forEach(m => {
            const lbl = document.createElement('label');
            lbl.className = 'ms-opt';
            const cb = document.createElement('input');
            cb.type  = 'checkbox';
            cb.value = m;
            lbl.appendChild(cb);
            lbl.append(' ' + m);
            panel.appendChild(lbl);
        });
        panel.addEventListener('change', () => {
            updateTrigger('ms-municipio', 'Todos');
            actualizarOpcionesVisibles();
            scheduleAplicar();
        });
    }

    // ── Poblar dropdown de escuelas ──────────────────────────────────────────
    function poblarEscuelas(data) {
        const checkboxes = document.querySelector('#ms-escuela .ms-checkboxes');
        if (!checkboxes) return;

        // Recoger escuelas desde BECAS individuales si tienen el campo (datos nuevos)
        // para que el listado sea preciso por tipo; fallback al campo raíz ESCUELA
        const escuelasSet = new Set();
        data.forEach(d => {
            if (Array.isArray(d.BECAS) && d.BECAS.some(b => b.ESCUELA)) {
                d.BECAS.forEach(b => { if (b.ESCUELA) escuelasSet.add(b.ESCUELA); });
            } else if (d.ESCUELA) {
                escuelasSet.add(d.ESCUELA);
            }
        });
        const escuelas = [...escuelasSet].filter(Boolean).sort();
        checkboxes.innerHTML = '';
        escuelas.forEach(e => {
            const lbl = document.createElement('label');
            lbl.className = 'ms-opt';
            const cb = document.createElement('input');
            cb.type  = 'checkbox';
            cb.value = e;
            lbl.appendChild(cb);
            lbl.append(' ' + e);
            checkboxes.appendChild(lbl);
        });
        checkboxes.addEventListener('change', () => {
            updateTrigger('ms-escuela', 'Todas');
            scheduleAplicar();
        });

        // Búsqueda en tiempo real
        const searchInput = document.getElementById('escuela-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                actualizarOpcionesVisibles();
            });
            searchInput.addEventListener('click', e => e.stopPropagation());
        }
    }

    function scheduleAplicar() {
        clearTimeout(_debounce);
        _debounce = setTimeout(aplicar, 60);
    }

    // ── Aplicar filtros y re-renderizar ──────────────────────────────────────
    function aplicar() {
        const sel = getSeleccion();

        let filtered = window.dashDataFull;

        if (sel.sector.length)     filtered = filtered.filter(d => sel.sector.includes(d.SECTOR));
        // Filtro combinado año + etapa + tipo (AND por beca)
        if (sel.anios.length || sel.etapaCodes.length || sel.tipos.length) {
            filtered = filtered.filter(d => becasMatchFilter(
                d,
                sel.anios.length      ? sel.anios      : null,
                sel.etapaCodes.length ? sel.etapaCodes : null,
                sel.tipos.length      ? sel.tipos      : null
            ));
        }
        if (sel.municipios.length) filtered = filtered.filter(d => sel.municipios.includes(normalizarMunicipio(d.MUNICIPIO)));
        // Filtrar por escuela: comparar contra ESCUELA del registro. Cuando hay filtro
        // de tipo/año/etapa, el deep filter posterior corregirá ESCUELA al nivel de beca.
        if (sel.escuelas.length)   filtered = filtered.filter(d => {
            if (Array.isArray(d.BECAS) && d.BECAS.some(b => b.ESCUELA))
                return d.BECAS.some(b => b.ESCUELA && sel.escuelas.includes(b.ESCUELA));
            return sel.escuelas.includes(d.ESCUELA);
        });

        // ── Filtro profundo: recortar BECAS y recalcular importes/escuela ─────
        if (sel.anios.length || sel.etapaCodes.length || sel.tipos.length) {
            filtered = filtered.map(d => {
                if (!Array.isArray(d.BECAS) || d.BECAS.length === 0) return d;
                let becas = d.BECAS;
                if (sel.anios.length)
                    becas = becas.filter(b => b.PERIODO && sel.anios.some(a => b.PERIODO.startsWith(a + '-')));
                if (sel.etapaCodes.length)
                    becas = becas.filter(b => b.PERIODO && sel.etapaCodes.some(ec => b.PERIODO.endsWith('-' + ec)));
                if (sel.tipos.length)
                    becas = becas.filter(b => sel.tipos.includes(b.TIPO_BECA));
                const periodos = [...new Set(becas.map(b => b.PERIODO).filter(Boolean))];
                const importe  = becas.reduce((s, b) => s + (b.IMPORTE || 0), 0);
                // Actualizar ESCUELA y SECTOR del registro al de la primera beca filtrada
                // (corrige el caso en que latest_rec es de un tipo/año diferente)
                const firstBeca = becas[0];
                const escuela = (firstBeca?.ESCUELA) || d.ESCUELA;
                const sector  = (firstBeca?.SECTOR)  || d.SECTOR;
                return { ...d, BECAS: becas, PERIODOS: periodos, NUM_BECAS: becas.length,
                         IMPORTE: importe, ESCUELA: escuela, SECTOR: sector };
            });
        }

        window.dashData = filtered;

        document.querySelectorAll('.chart-container').forEach(el => el.classList.add('loading'));
        document.dispatchEvent(new Event('datosListos'));
    }

    // ── Limpiar todos los filtros ────────────────────────────────────────────
    function limpiarFiltros() {
        ['ms-tipo','ms-anio','ms-etapa','ms-sector','ms-municipio','ms-escuela'].forEach(id => {
            document.querySelectorAll(`#${id} input[type="checkbox"]`).forEach(cb => {
                cb.checked = false;
            });
            document.querySelectorAll(`#${id} .ms-opt`).forEach(opt => {
                opt.style.display = '';
            });
            const placeholder = (id === 'ms-etapa' || id === 'ms-escuela') ? 'Todas' : 'Todos';
            updateTrigger(id, placeholder);
        });

        const searchInput = document.getElementById('escuela-search');
        if (searchInput) searchInput.value = '';

        actualizarOpcionesVisibles();
        aplicar();
    }

    // ── Inicialización (una sola vez al recibir el primer datosListos) ────────
    document.addEventListener('datosListos', () => {
        if (window._filtrosInit) return;
        window._filtrosInit = true;

        poblarMunicipios();
        poblarEscuelas(window.dashDataFull);

        // Filtros estáticos (Tipo, Año, Etapa, Sector)
        ['ms-tipo', 'ms-anio', 'ms-etapa', 'ms-sector'].forEach(id => {
            const placeholder = (id === 'ms-etapa') ? 'Todas' : 'Todos';
            initWrap(id, placeholder, () => {
                actualizarOpcionesVisibles();
                scheduleAplicar();
            });
        });

        // Toggle de botón para municipio y escuela (change listeners en poblar*)
        ['ms-municipio', 'ms-escuela'].forEach(wrapId => {
            const wrap = document.getElementById(wrapId);
            if (!wrap) return;
            const btn   = wrap.querySelector('.ms-btn');
            const panel = wrap.querySelector('.ms-panel');
            if (!btn || !panel) return;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = wrap.classList.contains('open');
                document.querySelectorAll('.ms-wrap.open').forEach(w => {
                    w.classList.remove('open');
                    w.querySelector('.ms-panel')?.setAttribute('hidden', '');
                });
                if (!isOpen) {
                    wrap.classList.add('open');
                    panel.removeAttribute('hidden');
                }
            });
        });

        document.getElementById('filtro-limpiar')?.addEventListener('click', limpiarFiltros);

        // Calcular opciones válidas con selección inicial vacía
        actualizarOpcionesVisibles();

    }, { once: true });

})();
