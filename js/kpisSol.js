// ── KPIS_SOL.JS ── DashboardBecas · Solicitantes ─────────────────────────────
// Rellena las 8 tarjetas de KPI globales para la vista de Solicitantes.
// A diferencia de kpis.js, incluye métricas de tasa de aprobación y
// distingue entre el total de solicitantes y beneficiarios únicos.

document.addEventListener('datosListos', () => {
    const data  = window.dashData;
    const total = data.length;

    const ids = [
        'kpi-total-val','kpi-beneficiarios-val','kpi-tasa-val','kpi-inversion-val',
        'kpi-promedio-val','kpi-edad-val','kpi-publico-val','kpi-privado-val',
    ];

    if (!total) {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
        return;
    }

    // Cuenta registros con becas aprobadas en el rango filtrado
    // (d.BECAS ya fue recortado por el filtro profundo de año/etapa/tipo)
    const beneficiarios = data.filter(d => Array.isArray(d.BECAS) && d.BECAS.length > 0).length;
    const tasaAprobacion = total > 0 ? (beneficiarios / total) * 100 : 0;

    // Inversión e importe medio sólo sobre becas aprobadas
    const inversion = data.reduce((s, d) => s + (d.IMPORTE || 0), 0);
    const promedio   = beneficiarios > 0 ? inversion / beneficiarios : 0;

    const edadProm = data.reduce((s, d) => s + d.EDAD, 0) / total;

    const publico = data.filter(d =>
        d.SECTOR && d.SECTOR.toUpperCase().startsWith('PUBL')
    ).length;
    const privado = data.filter(d =>
        d.SECTOR && d.SECTOR.toUpperCase().startsWith('PRIV')
    ).length;

    const f = (v, opts) => (v || 0).toLocaleString('es-MX', opts || {});

    document.getElementById('kpi-total-val').textContent        = f(total);
    document.getElementById('kpi-beneficiarios-val').textContent = f(beneficiarios);
    document.getElementById('kpi-tasa-val').textContent          = f(tasaAprobacion, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
    document.getElementById('kpi-inversion-val').textContent     = '$' + f(inversion, { maximumFractionDigits: 0 });
    document.getElementById('kpi-promedio-val').textContent      = '$' + f(promedio,  { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('kpi-edad-val').textContent          = f(edadProm, { maximumFractionDigits: 1 }) + ' años';
    document.getElementById('kpi-publico-val').textContent       = f(publico) + ' (' + ((publico / total) * 100).toFixed(1) + '%)';
    document.getElementById('kpi-privado-val').textContent       = f(privado) + ' (' + ((privado / total) * 100).toFixed(1) + '%)';
});
