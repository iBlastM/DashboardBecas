// ── TABS_SOL.JS ── DashboardBecas · Solicitantes ──────────────────────────────
// Sobrescribe las entradas de window.TABS para las secciones que tienen análisis
// específicos de Solicitantes, reemplazando los partials y etiquetas del
// dashboard de Beneficiarios.
// Debe ejecutarse DESPUES de tabs.js y ANTES de loaderSol.js.

(function () {
    if (!window.TABS) return;

    const overrides = {
        'demografico': { src: 'partials/demograficoSol.html' },
        'economico':   { src: 'partials/economicoSol.html',   label: 'Aprobación'   },
        'comparativo': { src: 'partials/comparativoSol.html', label: 'Temporal'      },
    };

    window.TABS = window.TABS.map(t =>
        overrides[t.id]
            ? Object.assign({}, t, overrides[t.id])
            : t
    );
})();
