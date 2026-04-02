// ── FILTROS.JS ── DashboardBecas ───────────────────────────────────────────────
// Barra de filtros multi-selección: Tipo · Sector · Año · Etapa · Municipio · Escuela
// Actualiza window.dashData y re-dispara 'datosListos' para refrescar charts.

(function () {
    let _debounce = null;

    // Mapas dinámicos año↔etapa (se construyen desde los datos reales)
    let _etapasPorAnio = new Map();  // 'YYYY' → Set<'E1'|'E2'|'EX'>
    let _aniosPorEtapa = new Map();  // 'E1'|'E2'|'EX' → Set<'YYYY'>

    // Municipios canónicos; cualquier otro se agrupa como 'Otro'
    const MUNICIPIOS_FIJOS = ['Corregidora', 'El Marqués', 'Huimilpan', 'Querétaro'];
    function normalizarMunicipio(m) {
        if (!m) return 'Otro';
        const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const found = MUNICIPIOS_FIJOS.find(f => slug(f) === slug(m));
        return found || 'Otro';
    }

    // ── Obtener valores seleccionados en un ms-wrap ──────────────────────────
    function getSelected(wrapId) {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return [];
        return [...wrap.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
    }

    // ── Actualizar texto del botón trigger ──────────────────────────────────
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
                ? wrap.querySelector(`input[value="${CSS.escape(vals[0])}"]`)?.closest('.ms-opt')?.textContent.trim() || vals[0]
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
            // Cerrar todos los otros abiertos
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
            scheduleAplicar();
        });
    }

    // Cerrar todos al hacer clic fuera
    document.addEventListener('click', () => {
        document.querySelectorAll('.ms-wrap.open').forEach(w => {
            w.classList.remove('open');
            w.querySelector('.ms-panel')?.setAttribute('hidden', '');
        });
    });

    // ── Construir mapas año↔etapa desde los datos completos ───────────────────
    function construirMapsAnioEtapa(data) {
        _etapasPorAnio = new Map();
        _aniosPorEtapa = new Map();
        data.forEach(d => {
            const periodos = new Set();
            if (Array.isArray(d.BECAS) && d.BECAS.length > 0)
                d.BECAS.forEach(b => { if (b.PERIODO) periodos.add(b.PERIODO); });
            else if (Array.isArray(d.PERIODOS) && d.PERIODOS.length > 0)
                d.PERIODOS.forEach(p => { if (p) periodos.add(p); });
            else if (d.PERIODO)
                periodos.add(d.PERIODO);

            periodos.forEach(p => {
                const m = p.match(/^(\d{4})-(\w+)$/);
                if (!m) return;
                const [, anio, ec] = m;
                if (!_etapasPorAnio.has(anio)) _etapasPorAnio.set(anio, new Set());
                _etapasPorAnio.get(anio).add(ec);
                if (!_aniosPorEtapa.has(ec)) _aniosPorEtapa.set(ec, new Set());
                _aniosPorEtapa.get(ec).add(anio);
            });
        });
    }

    // ── Actualizar opciones de Etapa según años seleccionados ───────────────
    function actualizarOpcionesEtapa() {
        const wrap = document.getElementById('ms-etapa');
        if (!wrap) return;
        const aniosSeleccionados = getSelected('ms-anio');

        // Unión de etapas válidas para los años seleccionados (null = todas)
        let etapasValidas = null;
        if (aniosSeleccionados.length > 0) {
            etapasValidas = new Set();
            aniosSeleccionados.forEach(a => {
                const ecs = _etapasPorAnio.get(a);
                if (ecs) ecs.forEach(ec => etapasValidas.add(ec));
            });
        }

        wrap.querySelectorAll('.ms-opt[data-etapa]').forEach(opt => {
            const ec = opt.dataset.etapa;
            const disabled = etapasValidas !== null && !etapasValidas.has(ec);
            if (disabled) {
                opt.classList.add('ms-disabled');
                opt.querySelector('input').checked = false;
            } else {
                opt.classList.remove('ms-disabled');
            }
        });

        updateTrigger('ms-etapa', 'Todas');
    }

    // ── Actualizar opciones de Año según etapas seleccionadas ───────────────
    function actualizarOpcionesAnio() {
        const wrap = document.getElementById('ms-anio');
        if (!wrap) return;
        const etapasSeleccionadas = getSelected('ms-etapa').map(e =>
            e === '1RA ETAPA' ? 'E1' : e === '2DA ETAPA' ? 'E2' : 'EX'
        );

        // Unión de años válidos para las etapas seleccionadas (null = todos)
        let aniosValidos = null;
        if (etapasSeleccionadas.length > 0) {
            aniosValidos = new Set();
            etapasSeleccionadas.forEach(ec => {
                const anios = _aniosPorEtapa.get(ec);
                if (anios) anios.forEach(a => aniosValidos.add(a));
            });
        }

        wrap.querySelectorAll('.ms-opt').forEach(opt => {
            const cb = opt.querySelector('input');
            if (!cb) return;
            const disabled = aniosValidos !== null && !aniosValidos.has(cb.value);
            if (disabled) {
                opt.classList.add('ms-disabled');
                cb.checked = false;
            } else {
                opt.classList.remove('ms-disabled');
            }
        });

        updateTrigger('ms-anio', 'Todos');
    }

    // ── Deshabilitar UNIVERSIDAD cuando Extraordinaria está seleccionada ────────
    function actualizarTipoPorEtapa() {
        const wrap = document.getElementById('ms-tipo');
        if (!wrap) return;
        const etapasSeleccionadas = getSelected('ms-etapa');
        const tieneEX = etapasSeleccionadas.includes('EXTRATEMPORANEA');
        wrap.querySelectorAll('.ms-opt').forEach(opt => {
            const cb = opt.querySelector('input');
            if (!cb || cb.value !== 'UNIVERSIDAD') return;
            if (tieneEX) {
                opt.classList.add('ms-disabled');
                cb.checked = false;
            } else {
                opt.classList.remove('ms-disabled');
            }
        });
        updateTrigger('ms-tipo', 'Todos');
    }

    // ── Deshabilitar Extraordinaria cuando UNIVERSIDAD está seleccionada ────────
    function actualizarEtapaPorTipo() {
        const wrap = document.getElementById('ms-etapa');
        if (!wrap) return;
        const tiposSeleccionados = getSelected('ms-tipo');
        const tieneUniversidad = tiposSeleccionados.includes('UNIVERSIDAD');
        wrap.querySelectorAll('.ms-opt[data-etapa="EX"]').forEach(opt => {
            const cb = opt.querySelector('input');
            if (!cb) return;
            if (tieneUniversidad) {
                opt.classList.add('ms-disabled');
                cb.checked = false;
            } else {
                opt.classList.remove('ms-disabled');
            }
        });
        updateTrigger('ms-etapa', 'Todas');
    }

    // ── Poblar dropdown de municipios ─────────────────────────────────────────
    function poblarMunicipios(data) {
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
            filtrarEscuelasSegunMunicipio();
            scheduleAplicar();
        });
    }

    // ── Poblar dropdown de escuelas ──────────────────────────────────────────
    function poblarEscuelas(data) {
        const checkboxes = document.querySelector('#ms-escuela .ms-checkboxes');
        if (!checkboxes) return;

        // Construir mapa escuela → municipio para el filtrado cruzado
        const munPorEscuela = {};
        data.forEach(d => {
            if (d.ESCUELA) munPorEscuela[d.ESCUELA] = d.MUNICIPIO || '';
        });

        const escuelas = [...new Set(data.map(d => d.ESCUELA))].filter(Boolean).sort();
        checkboxes.innerHTML = '';
        escuelas.forEach(e => {
            const lbl = document.createElement('label');
            lbl.className = 'ms-opt';
            lbl.dataset.municipio = munPorEscuela[e] || '';
            const cb = document.createElement('input');
            cb.type  = 'checkbox';
            cb.value = e;
            lbl.appendChild(cb);
            lbl.append(' ' + e.charAt(0).toUpperCase() + e.slice(1).toLowerCase());
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
                const q = searchInput.value.trim().toLowerCase();
                checkboxes.querySelectorAll('.ms-opt').forEach(opt => {
                    const txt = opt.textContent.trim().toLowerCase();
                    opt.style.display = txt.includes(q) ? '' : 'none';
                });
            });
            // Evitar que un clic en el input cierre el panel
            searchInput.addEventListener('click', e => e.stopPropagation());
        }
    }

    // ── Filtrar escuelas visibles según municipios seleccionados ─────────────
    function filtrarEscuelasSegunMunicipio() {
        const municipios = getSelected('ms-municipio');
        const checkboxes = document.querySelector('#ms-escuela .ms-checkboxes');
        if (!checkboxes) return;
        checkboxes.querySelectorAll('.ms-opt').forEach(opt => {
            if (municipios.length === 0) {
                opt.style.display = '';
            } else {
                const mun = normalizarMunicipio(opt.dataset.municipio || '');
                const visible = municipios.includes(mun);
                opt.style.display = visible ? '' : 'none';
                // Desmarcar opciones ocultas para no contaminar el filtro de escuelas
                if (!visible) opt.querySelector('input').checked = false;
            }
        });
        updateTrigger('ms-escuela', 'Todas');
    }

    function scheduleAplicar() {
        clearTimeout(_debounce);
        _debounce = setTimeout(aplicar, 60);
    }

    // ── Aplicar filtros y re-renderizar ──────────────────────────────────────
    function aplicar() {
        const sector   = getSelected('ms-sector');
        const anios    = getSelected('ms-anio').map(Number);
        const etapas   = getSelected('ms-etapa');
        const tipos    = getSelected('ms-tipo');
        const municipios = getSelected('ms-municipio');
        const escuelas = getSelected('ms-escuela');

        // Convertir etapa label → código interno
        const etapaCodes = etapas.map(e =>
            e === '1RA ETAPA' ? 'E1' : e === '2DA ETAPA' ? 'E2' : 'EX'
        );

        let filtered = window.dashDataFull;

        if (sector.length)     filtered = filtered.filter(d => sector.includes(d.SECTOR));
        // Filtro combinado: año + etapa + tipo con lógica AND por beca
        // (evita falsos positivos cuando un registro tiene becas en años/etapas distintas)
        if (anios.length || etapas.length || tipos.length) {
            filtered = filtered.filter(d => {
                if (Array.isArray(d.BECAS) && d.BECAS.length > 0) {
                    return d.BECAS.some(b => {
                        const okAnio  = !anios.length      || (b.PERIODO && anios.some(a => b.PERIODO.startsWith(a + '-')));
                        const okEtapa = !etapaCodes.length || (b.PERIODO && etapaCodes.some(ec => b.PERIODO.endsWith('-' + ec)));
                        const okTipo  = !tipos.length      || tipos.includes(b.TIPO_BECA);
                        return okAnio && okEtapa && okTipo;
                    });
                }
                // Registro plano (sin array BECAS)
                const okAnio  = !anios.length  || anios.includes(d.AÑO);
                const okEtapa = !etapas.length || etapas.includes(d.ETAPA);
                const okTipo  = !tipos.length  || tipos.includes(d.TIPO_BECA);
                return okAnio && okEtapa && okTipo;
            });
        }
        if (municipios.length) filtered = filtered.filter(d => municipios.includes(normalizarMunicipio(d.MUNICIPIO)));
        if (escuelas.length)   filtered = filtered.filter(d => escuelas.includes(d.ESCUELA));

        // ── Filtro profundo: recortar BECAS según año/etapa/tipo seleccionados ──
        if (anios.length || etapas.length || tipos.length) {
            filtered = filtered.map(d => {
                if (!Array.isArray(d.BECAS) || d.BECAS.length === 0) return d;
                let becas = d.BECAS;
                if (anios.length)
                    becas = becas.filter(b => b.PERIODO && anios.some(a => b.PERIODO.startsWith(a + '-')));
                if (etapaCodes.length)
                    becas = becas.filter(b => b.PERIODO && etapaCodes.some(ec => b.PERIODO.endsWith('-' + ec)));
                if (tipos.length)
                    becas = becas.filter(b => tipos.includes(b.TIPO_BECA));
                const periodos = [...new Set(becas.map(b => b.PERIODO).filter(Boolean))];
                return { ...d, BECAS: becas, PERIODOS: periodos, NUM_BECAS: becas.length };
            });
        }

        window.dashData = filtered;

        document.querySelectorAll('.chart-container').forEach(el => el.classList.add('loading'));
        document.dispatchEvent(new Event('datosListos'));
    }

    // ── Limpiar todos los filtros ────────────────────────────────────────────
    function limpiarFiltros() {
        ['ms-sector','ms-anio','ms-etapa','ms-tipo','ms-municipio','ms-escuela'].forEach(id => {
            document.querySelectorAll(`#${id} input[type="checkbox"]`).forEach(cb => {
                cb.checked = false;
            });
            const placeholder = (id === 'ms-etapa' || id === 'ms-escuela') ? 'Todas' : 'Todos';
            updateTrigger(id, placeholder);
        });
        // Limpiar búsqueda de escuela y mostrar todas las opciones
        const searchInput = document.getElementById('escuela-search');
        if (searchInput) {
            searchInput.value = '';
            document.querySelectorAll('#ms-escuela .ms-opt').forEach(opt => {
                opt.style.display = '';
            });
        }
        actualizarOpcionesEtapa();
        actualizarOpcionesAnio();
        actualizarTipoPorEtapa();
        actualizarEtapaPorTipo();
        filtrarEscuelasSegunMunicipio();
        aplicar();
    }

    // ── Inicialización (una sola vez al recibir el primer datosListos) ────────
    document.addEventListener('datosListos', () => {
        if (window._filtrosInit) return;
        window._filtrosInit = true;

        construirMapsAnioEtapa(window.dashDataFull);
        poblarMunicipios(window.dashDataFull);
        poblarEscuelas(window.dashDataFull);

        initWrap('ms-tipo',      'Todos', actualizarEtapaPorTipo);
        initWrap('ms-sector',    'Todos');
        initWrap('ms-anio',      'Todos', () => { actualizarOpcionesEtapa(); actualizarEtapaPorTipo(); });
        initWrap('ms-etapa',     'Todas', () => { actualizarOpcionesAnio(); actualizarTipoPorEtapa(); });
        // ms-municipio y ms-escuela se inicializan en sus funciones poblar*
        // pero sí necesitamos el toggle del botón
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
    }, { once: true });

})();

