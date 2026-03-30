"""coordenadas_escuelas.py — DashboardBecasLocal

Lee la hoja GEORREFERENCIACION de data/Escuelas_Editar.xlsx y enriquece
base_limpia2.json añadiendo LAT_ESCUELA y LONG_ESCUELA a cada registro
mediante join por CLAVE_ESCUELA == CLAVE.

Modifica base_limpia2.json en el lugar (escribe a un temporal y luego
reemplaza el original para evitar corrupción ante errores).

Uso:
    cd d:\\Metrix\\DashboardBecasLocal
    python scripts/coordenadas_escuelas.py
"""

import json
import os
import pathlib
import sys

import pandas as pd

ROOT      = pathlib.Path(__file__).resolve().parent.parent
XLSX      = ROOT / "data" / "Escuelas_Editar.xlsx"
GEO_CSV   = ROOT / "data" / "escuelasGeo.csv"
SRC       = ROOT / "base_limpia2.json"
TMP       = ROOT / "base_limpia2_tmp.json"


def main() -> None:
    if not XLSX.exists():
        sys.exit(f"ERROR: no se encontró {XLSX}")
    if not SRC.exists():
        sys.exit(f"ERROR: no se encontró {SRC}")

    # ── 1. Leer coordenadas del catálogo principal ───────────────────
    print(f"Leyendo coordenadas: {XLSX}  (hoja GEORREFERENCIACION)")
    df = pd.read_excel(XLSX, sheet_name="GEORREFERENCIACION", dtype=str)

    # Normalizar nombres de columnas
    df.columns = [c.strip().upper() for c in df.columns]

    # Construir lookup  CLAVE → (lat, long)
    coords: dict[str, tuple] = {}
    for _, row in df.iterrows():
        clave = str(row.get("CLAVE", "") or "").strip().upper()
        if not clave:
            continue
        try:
            lat  = float(row["LAT"])
            long = float(row["LONG"])
        except (ValueError, TypeError):
            continue
        coords[clave] = (lat, long)

    print(f"  Escuelas del catálogo principal  : {len(coords):,}")

    # ── 2. Enriquecer con escuelasGeo.csv (geocodificación manual) ───
    if GEO_CSV.exists():
        import csv as _csv
        geo_added = 0
        with GEO_CSV.open(encoding="utf-8-sig") as f:
            for row in _csv.DictReader(f):
                clave = str(row.get("CLAVE_ESCUELA") or "").strip().upper()
                if not clave or clave in coords:
                    continue
                # Las coordenadas geocodificadas están en LATITUD / LONGITUD
                lat_raw  = row.get("LATITUD")  or row.get("LAT")  or ""
                long_raw = row.get("LONGITUD") or row.get("LONG") or ""
                try:
                    lat  = float(lat_raw)
                    long = float(long_raw)
                except (ValueError, TypeError):
                    continue
                coords[clave] = (lat, long)
                geo_added += 1
        print(f"  Escuelas añadidas desde GEO CSV  : {geo_added:,}")
    else:
        print(f"  (no se encontró {GEO_CSV.name}, se omite)")

    print(f"  Total lookup combinado           : {len(coords):,}")

    # ── 2. Enriquecer base_limpia2.json ──────────────────────────────
    print(f"\nEnriqueciendo: {SRC}")
    total   = 0
    matched = 0
    blank   = 0

    with SRC.open("r", encoding="utf-8") as fin, \
         TMP.open("w", encoding="utf-8") as fout:
        for raw in fin:
            raw = raw.strip()
            if not raw:
                continue
            try:
                d = json.loads(raw)
            except json.JSONDecodeError:
                fout.write(raw + "\n")
                total += 1
                continue

            clave = str(d.get("CLAVE_ESCUELA") or "").strip().upper()
            if clave and clave in coords:
                d["LAT_ESCUELA"]  = coords[clave][0]
                d["LONG_ESCUELA"] = coords[clave][1]
                matched += 1
            else:
                d["LAT_ESCUELA"]  = None
                d["LONG_ESCUELA"] = None
                if not clave:
                    blank += 1

            fout.write(json.dumps(d, ensure_ascii=False) + "\n")
            total += 1

            if total % 20_000 == 0:
                print(f"  {total:,} registros procesados...", end="\r", flush=True)

    # ── 3. Reemplazar original ────────────────────────────────────────
    os.replace(TMP, SRC)

    unmatched = total - matched - blank
    print(f"\nListo.")
    print(f"  Total registros procesados : {total:,}")
    print(f"  Con coordenadas asignadas  : {matched:,}")
    print(f"  Sin CLAVE_ESCUELA          : {blank:,}")
    print(f"  CLAVE no encontrada        : {unmatched:,}")
    print(f"  Archivo actualizado        : {SRC}")


if __name__ == "__main__":
    main()
