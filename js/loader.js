// ── LOADER.JS ── DashboardBecas ────────────────────────────────────────────────
// Carga en paralelo los 7 partials HTML, los inyecta en el DOM y
// sólo entonces arranca cargarDatos() para que todos los divs de gráficas
// ya existan cuando se dispare el evento 'datosListos'.

async function cargarPartials() {
    const container = document.getElementById('tab-panels');
    if (!container) { cargarDatos(); return; }

    const tabs = window.TABS || [];

    const htmls = await Promise.all(
        tabs.map(t =>
            fetch(t.src, { cache: 'no-store' })
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status} — ${t.src}`);
                    return r.text();
                })
                .catch(err => {
                    console.error('[Loader]', err);
                    return `<p style="color:#fca5a5;padding:2rem">Error cargando ${t.src}</p>`;
                })
        )
    );

    htmls.forEach((html, i) => {
        const section = document.createElement('section');
        section.id        = 'tab-' + tabs[i].id;
        section.className = 'tab-section section';
        if (i !== 0) section.hidden = true;
        section.innerHTML = html;
        container.appendChild(section);
    });

    cargarDatos();
}

cargarPartials();
