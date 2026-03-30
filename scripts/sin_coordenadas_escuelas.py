"""sin_coordenadas_escuelas.py — DashboardBecasLocal

Genera un reporte CSV con las CLAVE_ESCUELA que no pudieron ser
georreferenciadas en base_limpia2.json (LAT_ESCUELA / LONG_ESCUELA == null).

Salida:
    DashboardBecasLocal/sin_coordenadas_escuelas.csv

Columnas del CSV:
    CLAVE_ESCUELA   — clave del catálogo de la base de becas
    ESCUELA         — nombre de la escuela en la base de becas
    NIVEL_EDUCATIVO — nivel educativo
    NUM_REGISTROS   — cantidad de registros afectados en la base

Uso:
    cd d:\\Metrix\\DashboardBecasLocal
    python scripts/sin_coordenadas_escuelas.py
"""

import csv
import json
import pathlib
import sys
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC  = ROOT / "base_limpia2.json"
DST  = ROOT / "sin_coordenadas_escuelas.csv"


def main() -> None:
    if not SRC.exists():
        sys.exit(f"ERROR: no se encontró {SRC}")

    # clave → {ESCUELA, NIVEL_EDUCATIVO, count}
    sin_coords: dict[str, dict] = defaultdict(lambda: {"ESCUELA": "", "NIVEL_EDUCATIVO": "", "count": 0})

    total = 0
    with SRC.open("r", encoding="utf-8") as fin:
        for raw in fin:
            raw = raw.strip()
            if not raw:
                continue
            try:
                d = json.loads(raw)
            except json.JSONDecodeError:
                continue

            total += 1
            if total % 20_000 == 0:
                print(f"  {total:,} registros revisados...", end="\r", flush=True)

            # Sólo nos interesan los que no tienen coordenada de escuela
            if d.get("LAT_ESCUELA") is not None:
                continue

            clave = str(d.get("CLAVE_ESCUELA") or "").strip().upper() or "(SIN CLAVE)"
            entry = sin_coords[clave]
            entry["count"] += 1
            # Conservar el primer nombre/nivel que aparezca
            if not entry["ESCUELA"]:
                entry["ESCUELA"] = str(d.get("ESCUELA") or "").strip()
            if not entry["NIVEL_EDUCATIVO"]:
                entry["NIVEL_EDUCATIVO"] = str(d.get("NIVEL_EDUCATIVO") or d.get("NIVEL EDUCATIVO") or "").strip()

    print(f"\nTotal registros revisados : {total:,}")
    print(f"Claves sin coordenadas    : {len(sin_coords):,}")
    print(f"Registros afectados       : {sum(e['count'] for e in sin_coords.values()):,}")

    # Ordenar por cantidad de registros afectados (mayor primero)
    rows = sorted(
        [{"CLAVE_ESCUELA": k, **v} for k, v in sin_coords.items()],
        key=lambda r: r["count"],
        reverse=True,
    )

    with DST.open("w", encoding="utf-8-sig", newline="") as fout:
        writer = csv.DictWriter(
            fout,
            fieldnames=["CLAVE_ESCUELA", "ESCUELA", "NIVEL_EDUCATIVO", "NUM_REGISTROS"],
        )
        writer.writeheader()
        for r in rows:
            writer.writerow({
                "CLAVE_ESCUELA":   r["CLAVE_ESCUELA"],
                "ESCUELA":         r["ESCUELA"],
                "NIVEL_EDUCATIVO": r["NIVEL_EDUCATIVO"],
                "NUM_REGISTROS":   r["count"],
            })

    print(f"Reporte escrito           : {DST}")


if __name__ == "__main__":
    main()
