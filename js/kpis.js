// ── KPIS.JS ── DashboardBecas ──────────────────────────────────────────────────
// Rellena las 8 tarjetas de KPI globales en cuanto los datos están listos.

document.addEventListener('datosListos', () => {
    const data  = window.dashData;
    const total = data.length;

    const ids = [
        'kpi-total-val','kpi-inversion-val','kpi-promedio-val','kpi-edad-val',
        'kpi-total-becas-val','kpi-prom-becas-val','kpi-publico-val','kpi-privado-val',
    ];

    if (!total) {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
        return;
    }

    const inversion  = data.reduce((s, d) => s + d.IMPORTE, 0);
    const promedio    = inversion / total;
    const edadProm    = data.reduce((s, d) => s + d.EDAD, 0) / total;

    // Total de becas individuales (un beneficiario único puede tener varias)
    const totalBecas  = data.reduce((s, d) => s + (d.NUM_BECAS || 1), 0);
    const promBecas   = total > 0 ? totalBecas / total : 0;

    const publico = data.filter(d =>
        d.SECTOR && d.SECTOR.toUpperCase().startsWith('PUBL')
    ).length;
    const privado = data.filter(d =>
        d.SECTOR && d.SECTOR.toUpperCase().startsWith('PRIV')
    ).length;

    const f = (v, opts) => (v || 0).toLocaleString('es-MX', opts || {});

    document.getElementById('kpi-total-val').textContent      = f(total);
    document.getElementById('kpi-inversion-val').textContent  = '$' + f(inversion, { maximumFractionDigits: 0 });
    document.getElementById('kpi-promedio-val').textContent   = '$' + f(promedio,  { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('kpi-edad-val').textContent       = f(edadProm, { maximumFractionDigits: 1 }) + ' años';
    document.getElementById('kpi-total-becas-val').textContent  = f(totalBecas);
    document.getElementById('kpi-prom-becas-val').textContent   = f(promBecas, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' becas/persona';
    document.getElementById('kpi-publico-val').textContent    = f(publico) + ' (' + ((publico / total) * 100).toFixed(1) + '%)';
    document.getElementById('kpi-privado-val').textContent    = f(privado) + ' (' + ((privado / total) * 100).toFixed(1) + '%)';
});
