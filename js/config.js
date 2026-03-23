// ── CONFIG.JS ── DashboardBecas ────────────────────────────────────────────────
// Tema, helpers de layout y utilidades de datos compartidas.

const C = {
    plotBg:  '#18122B',
    paperBg: '#393053',

    naranja: 'rgb(229, 134, 6)',
    verde:   'rgb(82, 188, 163)',

    paleta: [
        'rgb(229, 134, 6)',
        'rgb(82, 188, 163)',
        '#A855F7',
        '#EC4899',
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#6366F1',
        '#14B8A6',
        '#F97316',
        '#8B5CF6',
        '#EF4444',
    ],

    fuente: "'Lato', 'Inter', sans-serif",
};

/** Layout base oscuro para Plotly. Mezcla extras si se pasan. */
function getLayout(titulo, extras) {
    const base = {
        title: {
            text: titulo,
            font: { size: 14, color: '#FFFFFF', family: C.fuente },
            x: 0.5,
            xanchor: 'center',
            pad: { t: 4 },
        },
        paper_bgcolor: C.paperBg,
        plot_bgcolor:  C.plotBg,
        font: { color: '#FFFFFF', family: C.fuente, size: 12 },
        margin: { t: 58, r: 18, b: 48, l: 18 },
        xaxis: {
            gridcolor:     'rgba(255,255,255,0.08)',
            linecolor:     'rgba(255,255,255,0.22)',
            zerolinecolor: 'rgba(255,255,255,0.12)',
            tickcolor:     'rgba(255,255,255,0.6)',
        },
        yaxis: {
            gridcolor:     'rgba(255,255,255,0.08)',
            linecolor:     'rgba(255,255,255,0.22)',
            zerolinecolor: 'rgba(255,255,255,0.12)',
            tickcolor:     'rgba(255,255,255,0.6)',
        },
        legend: {
            font:        { color: '#FFFFFF', size: 11 },
            bgcolor:     'rgba(0,0,0,0.22)',
            bordercolor: 'rgba(255,255,255,0.14)',
            borderwidth: 1,
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
