// ── CONFIG.JS ── DashboardBecas ────────────────────────────────────────────────
// Tema, helpers de layout y utilidades de datos compartidas.

const C = {
    plotBg:  '#060606',
    paperBg: '#0d0d0d',

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
            gridcolor:     'rgba(123,193,29,0.10)',
            linecolor:     'rgba(123,193,29,0.25)',
            zerolinecolor: 'rgba(123,193,29,0.18)',
            tickcolor:     'rgba(255,255,255,0.6)',
        },
        yaxis: {
            gridcolor:     'rgba(123,193,29,0.10)',
            linecolor:     'rgba(123,193,29,0.25)',
            zerolinecolor: 'rgba(123,193,29,0.18)',
            tickcolor:     'rgba(255,255,255,0.6)',
        },
        legend: {
            font:        { color: '#FFFFFF', size: 11 },
            bgcolor:     'rgba(0,0,0,0.45)',
            bordercolor: 'rgba(123,193,29,0.20)',
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
