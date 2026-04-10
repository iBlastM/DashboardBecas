"""patch_promedio.py — DashboardBecasLocal

Agrega el campo PROMEDIO a data_dashboard.json sin re-ejecutar el pipeline completo.
Lee base_limpia.json, construye un mapa CURP → promedio del registro más reciente
(filtrando sólo CE-APROBADO), y lo aplica a data_dashboard.json en memoria.

Uso:
    cd d:\\Metrix\\DashboardBecasLocal
    python scripts/patch_promedio.py
"""

import json
import pathlib
import re
import sys

ROOT  = pathlib.Path(__file__).resolve().parent.parent
SRC_B = ROOT / "base_limpia.json"
DST   = ROOT / "data_dashboard.json"

ANIOS_OK = {2020, 2021, 2022, 2023, 2024, 2025}


def _extraer_anio(d: dict):
    anio_raw = d.get("ANIO_PROGRAMA")
    if anio_raw is not None:
        try:
            return int(anio_raw)
        except (TypeError, ValueError):
            pass
    for campo in ("PROGRAMA", "NOMBRE_PROGRAMA"):
        val = d.get(campo)
        if val:
            m = re.search(r"(20\d{2})", str(val))
            if m:
                return int(m.group(1))
    fecha = d.get("FECHA_REGISTRO") or d.get("FECHA REGISTRO")
    if fecha is not None:
        m = re.search(r"(20\d{2})", str(fecha))
        if m:
            return int(m.group(1))
    return None


def main() -> None:
    if not SRC_B.exists():
        sys.exit(f"ERROR: no se encontró {SRC_B}")
    if not DST.exists():
        sys.exit(f"ERROR: no se encontró {DST}")

    # ── Paso 1: construir CURP → {anio, promedio} del registro más reciente ──
    print(f"Leyendo promedios de: {SRC_B}")
    curp_promedio: dict = {}   # CURP → (latest_anio, promedio)
    leidos = 0

    with SRC_B.open("r", encoding="utf-8") as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue
            try:
                d = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if d.get("STATUS") != "CE-APROBADO":
                continue
            anio = _extraer_anio(d)
            if anio not in ANIOS_OK:
                continue

            curp = (d.get("CURP_BECARIO") or "").strip().upper()
            if not curp:
                continue

            prom_raw = d.get("PROMEDIO")
            try:
                prom = float(prom_raw) if prom_raw not in (None, "", 0) else None
            except (TypeError, ValueError):
                prom = None

            existing = curp_promedio.get(curp)
            if existing is None or anio > existing[0]:
                curp_promedio[curp] = (anio, prom)

            leidos += 1
            if leidos % 50_000 == 0:
                print(f"  {leidos:,} leídos...", end="\r", flush=True)

    print(f"\n  CURPs con promedio: {sum(1 for v in curp_promedio.values() if v[1] is not None):,}")

    # ── Paso 2: parchear data_dashboard.json en memoria ──────────────────────
    print(f"Parcheando: {DST}")
    lines_in = DST.read_text(encoding="utf-8").splitlines()
    lines_out = []
    patched = 0

    for line in lines_in:
        line = line.strip()
        if not line:
            continue
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            lines_out.append(line)
            continue

        curp = (rec.get("CURP") or "").strip().upper()
        entry = curp_promedio.get(curp)
        prom = entry[1] if entry else None
        rec["PROMEDIO"] = prom
        lines_out.append(json.dumps(rec, ensure_ascii=False))
        patched += 1

    DST.write_text("\n".join(lines_out) + "\n", encoding="utf-8")
    print(f"\nListo. {patched:,} registros parcheados.")


if __name__ == "__main__":
    main()
