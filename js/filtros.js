// ── FILTROS.JS ── DashboardBecas ───────────────────────────────────────────────
// Barra de filtros: Nivel · Sector · Año · Etapa · Tipo de Beca · Escuela
// Actualiza window.dashData y re-dispara 'datosListos' para refrescar charts.

(function () {
    let _debounce = null;

    // ── Poblar dropdown de escuelas con valores únicos ───────────────────────
    function poblarEscuelas(data) {
        const sel = document.getElementById('filtro-escuela');
        if (!sel) return;
        const escuelas = [...new Set(data.map(d => d.ESCUELA))].filter(Boolean).sort();
        escuelas.forEach(e => {
            const opt = document.createElement('option');
            opt.value = e;
            opt.textContent = e.charAt(0).toUpperCase() + e.slice(1).toLowerCase();
            sel.appendChild(opt);
        });
    }

    // ── Leer valores actuales ────────────────────────────────────────────────
    function leerFiltros() {
        return {
            nivel:   document.getElementById('filtro-nivel')?.value   || '',
            sector:  document.getElementById('filtro-sector')?.value  || '',
            anio:    document.getElementById('filtro-anio')?.value    || '',
            etapa:   document.getElementById('filtro-etapa')?.value   || '',
            tipo:    document.getElementById('filtro-tipo')?.value    || '',
            escuela: document.getElementById('filtro-escuela')?.value || '',
        };
    }

    // ── Actualizar contador ──────────────────────────────────────────────────
    function actualizarEtiqueta(n) {
        const el = document.getElementById('filtro-count');
        if (el) el.textContent = n.toLocaleString('es-MX') + ' registros';
    }

    // ── Aplicar filtros y re-renderizar ──────────────────────────────────────
    function aplicar() {
        const f = leerFiltros();
        let filtered = window.dashDataFull;

        if (f.nivel)   filtered = filtered.filter(d => d.NIVEL_EDUCATIVO === f.nivel);
        if (f.sector)  filtered = filtered.filter(d => d.SECTOR          === f.sector);
        if (f.anio)    filtered = filtered.filter(d => d.AÑO             === f.anio);
        if (f.etapa)   filtered = filtered.filter(d => d.ETAPA           === f.etapa);
        if (f.tipo)    filtered = filtered.filter(d => d.TIPO_BECA       === f.tipo);
        if (f.escuela) filtered = filtered.filter(d => d.ESCUELA         === f.escuela);

        window.dashData = filtered;
        actualizarEtiqueta(filtered.length);

        document.querySelectorAll('.chart-container').forEach(el => el.classList.add('loading'));
        document.dispatchEvent(new Event('datosListos'));
    }

    // ── Limpiar todos los filtros ────────────────────────────────────────────
    function limpiarFiltros() {
        ['filtro-nivel','filtro-sector','filtro-anio','filtro-etapa','filtro-tipo','filtro-escuela']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        aplicar();
    }

    // ── Inicialización (una sola vez al recibir el primer datosListos) ────────
    document.addEventListener('datosListos', () => {
        if (window._filtrosInit) return;
        window._filtrosInit = true;

        poblarEscuelas(window.dashDataFull);
        actualizarEtiqueta(window.dashDataFull.length);

        ['filtro-nivel','filtro-sector','filtro-anio','filtro-etapa','filtro-tipo','filtro-escuela']
            .forEach(id => {
                document.getElementById(id)?.addEventListener('change', () => {
                    clearTimeout(_debounce);
                    _debounce = setTimeout(aplicar, 60);
                });
            });

        document.getElementById('filtro-limpiar')?.addEventListener('click', limpiarFiltros);
    }, { once: true });

})();
