// ── FILTROS_SOL.JS ── DashboardBecas · Solicitantes ──────────────────────────
// Barra de filtros multi-selección para la vista de Solicitantes.
// Extiende los filtros de Beneficiarios con dos filtros adicionales:
//   • Registro  — Beneficiarios / No Beneficiarios
//   • Estatus   — todos los valores únicos de STATUS presentes en los datos

(function () {
    let _debounce = null;

    // Años que sólo tienen datos de Etapa Extraordinaria
    const SOLO_EX = new Set(['2021', '2024']);

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

    // ── Actualizar opciones de Etapa según años seleccionados ───────────────
    function actualizarOpcionesEtapa() {
        const aniosSeleccionados = getSelected('ms-anio');
        const wrap = document.getElementById('ms-etapa');
        if (!wrap) return;

        const tieneE1E2 = aniosSeleccionados.length === 0
            || aniosSeleccionados.some(a => !SOLO_EX.has(a));

        wrap.querySelectorAll('.ms-opt[data-etapa="E1"], .ms-opt[data-etapa="E2"]')
            .forEach(opt => {
                if (!tieneE1E2) {
                    opt.classList.add('ms-disabled');
                    opt.querySelector('input').checked = false;
                } else {
                    opt.classList.remove('ms-disabled');
                }
            });

        updateTrigger('ms-etapa', 'Todas');
    }

    // ── Poblar dropdown de estatus (dinámico) ────────────────────────────────
    function poblarEstatus(data) {
        const panel = document.querySelector('#ms-estatus .ms-panel');
        if (!panel) return;
        const statuses = [...new Set(data.map(d => d.STATUS))].filter(Boolean).sort();
        panel.innerHTML = '';
        statuses.forEach(s => {
            const lbl = document.createElement('label');
            lbl.className = 'ms-opt';
            const cb = document.createElement('input');
            cb.type  = 'checkbox';
            cb.value = s;
            lbl.appendChild(cb);
            lbl.append(' ' + s);
            panel.appendChild(lbl);
        });
        panel.addEventListener('change', () => {
            updateTrigger('ms-estatus', 'Todos');
            scheduleAplicar();
        });

        const wrap  = document.getElementById('ms-estatus');
        const btn   = wrap?.querySelector('.ms-btn');
        if (wrap && btn) {
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
        }
    }

    // ── Poblar dropdown de escuelas (dinámico) ───────────────────────────────
    function poblarEscuelas(data) {
        const panel = document.querySelector('#ms-escuela .ms-panel');
        if (!panel) return;
        const escuelas = [...new Set(data.map(d => d.ESCUELA))].filter(Boolean).sort();
        panel.innerHTML = '';
        escuelas.forEach(e => {
            const lbl = document.createElement('label');
            lbl.className = 'ms-opt';
            const cb = document.createElement('input');
            cb.type  = 'checkbox';
            cb.value = e;
            lbl.appendChild(cb);
            lbl.append(' ' + e.charAt(0).toUpperCase() + e.slice(1).toLowerCase());
            panel.appendChild(lbl);
        });
        panel.addEventListener('change', () => {
            updateTrigger('ms-escuela', 'Todas');
            scheduleAplicar();
        });
    }

    // ── Actualizar contador ──────────────────────────────────────────────────
    function actualizarEtiqueta(n) {
        const el = document.getElementById('filtro-count');
        if (el) el.textContent = n.toLocaleString('es-MX') + ' registros';
    }

    function scheduleAplicar() {
        clearTimeout(_debounce);
        _debounce = setTimeout(aplicar, 60);
    }

    // ── Aplicar filtros y re-renderizar ──────────────────────────────────────
    function aplicar() {
        const registro = getSelected('ms-registro');
        const estatuses = getSelected('ms-estatus');
        const nivel   = getSelected('ms-nivel');
        const sector  = getSelected('ms-sector');
        const anios   = getSelected('ms-anio').map(Number);
        const etapas  = getSelected('ms-etapa');
        const tipos   = getSelected('ms-tipo');
        const escuelas = getSelected('ms-escuela');

        const etapaCodes = etapas.map(e =>
            e === '1RA ETAPA' ? 'E1' : e === '2DA ETAPA' ? 'E2' : 'EX'
        );

        let filtered = window.dashDataFull;

        // Filtro por Registro (Beneficiarios / No Beneficiarios)
        if (registro.length) {
            const soloBenef  = registro.includes('BENEFICIARIOS')  && !registro.includes('NO_BENEFICIARIOS');
            const soloNoB    = registro.includes('NO_BENEFICIARIOS') && !registro.includes('BENEFICIARIOS');
            if (soloBenef) {
                filtered = filtered.filter(d => d.ES_BENEFICIARIO === true);
            } else if (soloNoB) {
                filtered = filtered.filter(d => d.ES_BENEFICIARIO !== true);
            }
            // ambos seleccionados = todos → sin filtro adicional
        }

        // Filtro por Estatus
        if (estatuses.length) {
            filtered = filtered.filter(d => estatuses.includes(d.STATUS));
        }

        if (nivel.length)    filtered = filtered.filter(d => nivel.includes(d.NIVEL_EDUCATIVO));
        if (sector.length)   filtered = filtered.filter(d => sector.includes(d.SECTOR));
        if (anios.length)    filtered = filtered.filter(d =>
            Array.isArray(d.AÑOS)
                ? d.AÑOS.some(a => anios.includes(a))
                : anios.includes(Number(d.AÑO))
        );
        if (etapas.length)   filtered = filtered.filter(d =>
            Array.isArray(d.BECAS) && d.BECAS.length > 0
                ? d.BECAS.some(b => b.PERIODO && etapaCodes.some(ec => b.PERIODO.endsWith('-' + ec)))
                : etapas.includes(d.ETAPA)
        );
        if (tipos.length)    filtered = filtered.filter(d =>
            Array.isArray(d.BECAS) && d.BECAS.length > 0
                ? d.BECAS.some(b => tipos.includes(b.TIPO_BECA))
                : tipos.includes(d.TIPO_BECA)
        );
        if (escuelas.length) filtered = filtered.filter(d => escuelas.includes(d.ESCUELA));

        // Filtro profundo: recortar BECAS según año/etapa/tipo seleccionados
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
                return { ...d, BECAS: becas, PERIODOS: periodos };
            });
        }

        window.dashData = filtered;
        actualizarEtiqueta(filtered.length);

        document.querySelectorAll('.chart-container').forEach(el => el.classList.add('loading'));
        document.dispatchEvent(new Event('datosListos'));
    }

    // ── Limpiar todos los filtros ────────────────────────────────────────────
    function limpiarFiltros() {
        ['ms-registro','ms-estatus','ms-nivel','ms-sector','ms-anio','ms-etapa','ms-tipo','ms-escuela']
            .forEach(id => {
                document.querySelectorAll(`#${id} input[type="checkbox"]`).forEach(cb => {
                    cb.checked = false;
                });
                const placeholder =
                    id === 'ms-etapa' || id === 'ms-escuela' ? 'Todas' : 'Todos';
                updateTrigger(id, placeholder);
            });
        actualizarOpcionesEtapa();
        aplicar();
    }

    // ── Inicialización (una sola vez al recibir el primer datosListos) ────────
    document.addEventListener('datosListos', () => {
        if (window._filtrosInit) return;
        window._filtrosInit = true;

        poblarEstatus(window.dashDataFull);
        poblarEscuelas(window.dashDataFull);
        actualizarEtiqueta(window.dashDataFull.length);

        initWrap('ms-registro', 'Todos');
        initWrap('ms-nivel',   'Todos');
        initWrap('ms-sector',  'Todos');
        initWrap('ms-anio',    'Todos', actualizarOpcionesEtapa);
        initWrap('ms-etapa',   'Todas');
        initWrap('ms-tipo',    'Todos');

        // ms-escuela y ms-estatus se inicializan en sus respectivos poblar*()
        const escWrap = document.getElementById('ms-escuela');
        if (escWrap) {
            const escBtn   = escWrap.querySelector('.ms-btn');
            const escPanel = escWrap.querySelector('.ms-panel');
            if (escBtn && escPanel) {
                escBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = escWrap.classList.contains('open');
                    document.querySelectorAll('.ms-wrap.open').forEach(w => {
                        w.classList.remove('open');
                        w.querySelector('.ms-panel')?.setAttribute('hidden', '');
                    });
                    if (!isOpen) {
                        escWrap.classList.add('open');
                        escPanel.removeAttribute('hidden');
                    }
                });
            }
        }

        document.getElementById('filtro-limpiar')?.addEventListener('click', limpiarFiltros);
    }, { once: true });

})();
