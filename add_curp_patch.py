"""add_curp_patch.py — Agrega el campo CURP a data_dashboard.json

Lee base_limpia.json y reconstruye la lista ordenada de CURPs únicos
(misma lógica que preprocesar.py), luego inyecta CURP en cada registro
de data_dashboard.json sin tener que reprocesar la base completa.

Uso:
    cd d:\\Metrix\\DashboardBecasLocal
    python add_curp_patch.py
    python split_data.py
"""

import json
import pathlib
import sys

SRC_BASE = pathlib.Path(__file__).parent / "base_limpia.json"
DST_DASH = pathlib.Path(__file__).parent / "data_dashboard.json"
TMP_PATCHED = pathlib.Path(__file__).parent / "data_dashboard_curp_tmp.json"

ANIOS_OK = {2021, 2022, 2023, 2024, 2025}


def main() -> None:
    if not SRC_BASE.exists():
        sys.exit(f"ERROR: no se encontró {SRC_BASE}")
    if not DST_DASH.exists():
        sys.exit(f"ERROR: no se encontró {DST_DASH}. Ejecuta primero preprocesar.py")

    # ── Paso 1: Reconstruir lista ordenada de CURPs desde base_limpia.json ──
    print(f"Leyendo CURPs desde {SRC_BASE} — puede tardar varios minutos...")
    seen: dict[str, int] = {}   # CURP → índice de primera aparición
    leidos = 0

    with SRC_BASE.open("r", encoding="utf-8") as fin:
        for raw in fin:
            raw = raw.strip()
            if not raw:
                continue
            try:
                d = json.loads(raw)
            except json.JSONDecodeError:
                continue

            # Mismo filtro que preprocesar.py
            if d.get("STATUS") != "CE-APROBADO":
                continue

            anio_raw = d.get("ANIO_PROGRAMA")
            try:
                anio = int(anio_raw) if anio_raw is not None else None
            except (TypeError, ValueError):
                anio = None
            if anio not in ANIOS_OK:
                continue

            leidos += 1
            if leidos % 50_000 == 0:
                print(f"  {leidos:,} registros aprobados | {len(seen):,} CURPs únicos...",
                      end="\r", flush=True)

            # Mismo fallback que preprocesar.py
            curp = (d.get("CURP_BECARIO") or "").strip().upper()
            if not curp:
                curp = f"__NO_CURP_{d.get('ID_USUARIO') or leidos}"

            if curp not in seen:
                seen[curp] = len(seen)

    print(f"\n  Total: {leidos:,} registros | {len(seen):,} CURPs únicos")

    # Lista ordenada por índice de inserción
    curps_ordered = [""] * len(seen)
    for curp, idx in seen.items():
        curps_ordered[idx] = curp

    # ── Paso 2: Leer data_dashboard.json ──
    lines = DST_DASH.read_text(encoding="utf-8").strip().split("\n")
    lines = [l for l in lines if l.strip()]

    if len(lines) != len(curps_ordered):
        sys.exit(
            f"ERROR: data_dashboard.json tiene {len(lines)} registros pero se "
            f"encontraron {len(curps_ordered)} CURPs únicos.\n"
            f"Asegúrate de que data_dashboard.json fue generado con los mismos "
            f"filtros de preprocesar.py (no fue modificado manualmente)."
        )

    # ── Paso 3: Inyectar CURP en cada registro ──
    print(f"\nInyectando CURP en {len(lines):,} registros...")
    with TMP_PATCHED.open("w", encoding="utf-8") as fout:
        for i, line in enumerate(lines):
            rec = json.loads(line)
            rec["CURP"] = curps_ordered[i]
            fout.write(json.dumps(rec, ensure_ascii=False) + "\n")
            if (i + 1) % 10_000 == 0:
                print(f"  {i+1:,} / {len(lines):,}...", end="\r", flush=True)

    # Reemplazar el original
    DST_DASH.unlink()
    TMP_PATCHED.rename(DST_DASH)
    print(f"\nListo: {DST_DASH} ahora incluye el campo CURP.")
    print("Ejecuta 'python split_data.py' para regenerar data_a.json y data_b.json.")


if __name__ == "__main__":
    main()
