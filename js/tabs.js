// ── TABS.JS ── DashboardBecas ──────────────────────────────────────────────────
// Define las 7 pestañas, construye la barra de navegación y gestiona paneles.

window.TABS = [
    { id: 'demografico', label: 'Demográfico',  src: 'partials/demografico.html' },
    { id: 'familiar',    label: 'Familiar',      src: 'partials/familiar.html'    },
    { id: 'academico',   label: 'Académico',     src: 'partials/academico.html'   },
    { id: 'economico',   label: 'Económico',     src: 'partials/economico.html'   },
    { id: 'territorial', label: 'Territorial',   src: 'partials/territorial.html' },
    { id: 'electoral',   label: 'Electoral',     src: 'partials/electoral.html'   },
    { id: 'comparativo', label: 'Comparativo',   src: 'partials/comparativo.html' },
];

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('tabs-nav');
    if (!nav) return;

    window.TABS.forEach((tab, i) => {
        const btn = document.createElement('button');
        btn.className  = i === 0 ? 'tab-btn active' : 'tab-btn';
        btn.dataset.tab = tab.id;
        btn.textContent = tab.label;
        btn.addEventListener('click', () => activarTab(tab.id));
        nav.appendChild(btn);
    });
});

function activarTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.tab === tabId)
    );
    document.querySelectorAll('.tab-section').forEach(s => {
        s.hidden = s.id !== 'tab-' + tabId;
    });
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        // Treemaps don't always re-layout on window.resize alone; force explicit resize.
        const activeSection = document.getElementById('tab-' + tabId);
        if (activeSection && window.Plotly) {
            activeSection.querySelectorAll('.js-plotly-plot').forEach(gd => {
                Plotly.Plots.resize(gd);
            });
        }
    }, 80);
    window._tabActual = tabId;
}
