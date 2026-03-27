// ── CONFIG.JS ── DashboardBecas ────────────────────────────────────────────────
// Tema, helpers de layout y utilidades de datos compartidas.

const C = {
    get plotBg()  { return document.documentElement.dataset.theme === 'light' ? '#f0f4ea' : '#060606'; },
    get paperBg() { return document.documentElement.dataset.theme === 'light' ? '#ffffff' : '#0d0d0d'; },

    naranja: '#7bc11d',
    verde:   '#3eb340',

    paleta: [
        '#7bc11d',
        '#3eb340',
        '#267e28',
        '#a8e063',
        '#56ab2f',
        '#1de954',
        '#4CAF50',
        '#8BC34A',
        '#CDDC39',
        '#b5e853',
        '#2ecc71',
        '#27ae60',
    ],

    fuente: "'Barlow', 'Inter', sans-serif",
};

/** Layout base para Plotly — adapta colores al tema activo. Mezcla extras si se pasan. */
function getLayout(titulo, extras) {
    const isLight = document.documentElement.dataset.theme === 'light';
    const textCol = isLight ? '#1a2e05'              : '#FFFFFF';
    const gridCol = isLight ? 'rgba(80,140,20,0.12)' : 'rgba(123,193,29,0.10)';
    const lineCol = isLight ? 'rgba(80,140,20,0.30)' : 'rgba(123,193,29,0.25)';
    const zeroCol = isLight ? 'rgba(80,140,20,0.22)' : 'rgba(123,193,29,0.18)';
    const tickCol = isLight ? 'rgba(30,60,10,0.60)'  : 'rgba(255,255,255,0.6)';
    const lgBg    = isLight ? 'rgba(240,248,230,0.85)': 'rgba(0,0,0,0.45)';
    const lgBrdr  = isLight ? 'rgba(80,140,20,0.25)' : 'rgba(123,193,29,0.20)';

    const base = {
        title: {
            text: titulo,
            font: { size: 14, color: textCol, family: C.fuente },
            x: 0.5,
            xanchor: 'center',
            pad: { t: 4 },
        },
        paper_bgcolor: C.paperBg,
        plot_bgcolor:  C.plotBg,
        font: { color: textCol, family: C.fuente, size: 12 },
        margin: { t: 58, r: 18, b: 48, l: 18 },
        xaxis: {
            gridcolor:     gridCol,
            linecolor:     lineCol,
            zerolinecolor: zeroCol,
            tickcolor:     tickCol,
        },
        yaxis: {
            gridcolor:     gridCol,
            linecolor:     lineCol,
            zerolinecolor: zeroCol,
            tickcolor:     tickCol,
        },
        legend: {
            font:        { color: textCol, size: 11 },
            bgcolor:     lgBg,
            bordercolor: lgBrdr,
            borderwidth: 1,
        },
        hoverlabel: {
            bgcolor:     '#FFFFFF',
            bordercolor: '#CCCCCC',
            font:        { color: '#000000', family: C.fuente, size: 12 },
        },
    };
    return Object.assign({}, base, extras || {});
}

// Config global de Plotly
const plotConfig = { responsive: true, displayModeBar: false };

// ── UTILIDADES DE DATOS ──────────────────────────────────────────────────────

/** Cuenta cuántas veces aparece cada valor de `campo`. */
function contarPor(data, campo) {
    return data.reduce((acc, row) => {
        const k = row[campo] != null ? row[campo] : 'Sin dato';
        acc[k] = (acc[k] || 0) + 1;
        return acc;
    }, {});
}

/** Suma los valores de `campoValor` agrupados por `campoClave`. */
function sumarPor(data, campoClave, campoValor) {
    return data.reduce((acc, row) => {
        const k = row[campoClave] != null ? row[campoClave] : 'Sin dato';
        acc[k] = (acc[k] || 0) + (Number(row[campoValor]) || 0);
        return acc;
    }, {});
}

/** Promedia los valores de `campoValor` agrupados por `campoClave`. */
function promediarPor(data, campoClave, campoValor) {
    const sumas = {}, ns = {};
    data.forEach(row => {
        const k = row[campoClave] != null ? row[campoClave] : 'Sin dato';
        sumas[k] = (sumas[k] || 0) + (Number(row[campoValor]) || 0);
        ns[k]    = (ns[k] || 0) + 1;
    });
    const result = {};
    Object.keys(sumas).forEach(k => { result[k] = sumas[k] / ns[k]; });
    return result;
}

/** Devuelve los N pares [clave, valor] con mayor valor. */
function topN(obj, n) {
    return Object.fromEntries(
        Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n)
    );
}

/** Entradas ordenadas descendente por valor. */
function sortedDesc(obj) {
    return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

/** Formatea número en es-MX. */
function fmt(v, opts) {
    return (v || 0).toLocaleString('es-MX', opts || {});
}

/** Formatea como pesos MX sin decimales. */
function fmtPeso(v) {
    return '$' + fmt(v, { maximumFractionDigits: 0 });
}

// ── DELEGADO GLOBAL: selector de Top N ──────────────────────────────────────
// Maneja clics en cualquier .top-btn dentro de .top-selector[data-chart].
// Cada gráfica expone su función de re-render en el elemento DOM como ._renderTop(n).
document.addEventListener('click', function (e) {
    const btn = e.target.closest('.top-btn[data-n]');
    if (!btn) return;
    const sel = btn.closest('.top-selector[data-chart]');
    if (!sel) return;
    sel.querySelectorAll('.top-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const el = document.getElementById(sel.dataset.chart);
    if (el && typeof el._renderTop === 'function') {
        el._renderTop(+btn.dataset.n);
    }
});
