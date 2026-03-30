"""preparar_geocodificacion.py — DashboardBecasLocal

Cruza las claves sin coordenadas (sin_coordenadas_escuelas.csv) contra
el directorio oficial (PUB_DIRECTORIO SUPERIOR POR INSTITUCIÓN_250408.xlsx)
y genera un CSV listo para geocodificación manual con una columna DIRECCION
construida a partir de las columnas de ubicación del directorio.

Salida:
    DashboardBecasLocal/para_geocodificar.csv

Columnas del CSV:
    CLAVE_ESCUELA   — clave CCT de la institución
    NOMBRE          — nombre de la institución (del directorio)
    NIVEL           — nivel educativo
    MUNICIPIO       — municipio
    LOCALIDAD       — localidad
    ASENTAMIENTO    — colonia / asentamiento
    VIALIDAD        — vialidad principal
    NUM_EXT         — número exterior
    DIRECCION       — cadena concatenada lista para geocodificar
    EN_DIRECTORIO   — True/False, si la clave se encontró en el directorio
    NUM_REGISTROS   — cuántos registros en base_limpia2.json usan esta clave

Uso:
    cd d:\\Metrix\\DashboardBecasLocal
    python scripts/preparar_geocodificacion.py
"""

import csv
import pathlib
import sys

import pandas as pd

ROOT     = pathlib.Path(__file__).resolve().parent.parent
SIN_CSV  = ROOT / "sin_coordenadas_escuelas.csv"
XLSX     = ROOT / "data" / "PUB_DIRECTORIO SUPERIOR POR INSTITUCIÓN_250408.xlsx"
DST      = ROOT / "para_geocodificar.csv"

ESTADO   = "QUERÉTARO"   # se añade al final de la dirección para mejorar geocodificación


def _clean(val) -> str:
    """Convierte a str, elimina espacios extra y NaN/None."""
    if val is None or (isinstance(val, float) and str(val) == "nan"):
        return ""
    return " ".join(str(val).split())


def main() -> None:
    if not SIN_CSV.exists():
        sys.exit(f"ERROR: no se encontró {SIN_CSV}\n"
                 "Ejecuta primero: python scripts/sin_coordenadas_escuelas.py")
    if not XLSX.exists():
        sys.exit(f"ERROR: no se encontró {XLSX}")

    # ── 1. Leer claves sin coordenadas ───────────────────────────────
    sin_coords: dict[str, int] = {}   # clave → NUM_REGISTROS
    with SIN_CSV.open(encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            clave = row["CLAVE_ESCUELA"].strip().upper()
            if clave and clave != "(SIN CLAVE)":
                sin_coords[clave] = int(row["NUM_REGISTROS"])

    print(f"Claves sin coordenadas a cruzar : {len(sin_coords):,}")

    # ── 2. Leer directorio (skiprows=10 para saltar encabezado múltiple)
    print(f"Leyendo directorio: {XLSX}")
    df = pd.read_excel(XLSX, sheet_name="Hoja1", skiprows=10, dtype=str)

    # Normalizar nombres de columna (quitar saltos de línea y espacios extras)
    df.columns = [" ".join(c.split()) for c in df.columns]

    # Mapeo explícito a nombres simples
    COL_MAP = {
        "CLAVE\n INSTITUCIÓN":  "CLAVE_ESCUELA",   # puede quedar normalizado como:
        "CLAVE  INSTITUCIÓN":   "CLAVE_ESCUELA",
        "CLAVE INSTITUCIÓN":    "CLAVE_ESCUELA",
        "NOMBRE  INSTITUCIÓN":  "NOMBRE",
        "NOMBRE INSTITUCIÓN":   "NOMBRE",
        "NIVEL":                "NIVEL",
        "MUNICIPIO":            "MUNICIPIO",
        "LOCALIDAD":            "LOCALIDAD",
        "ASENTAMIENTO":         "ASENTAMIENTO",
        "VIALIDAD  PRINCIPAL":  "VIALIDAD",
        "VIALIDAD PRINCIPAL":   "VIALIDAD",
        "NUM. EXT.":            "NUM_EXT",
    }
    df.rename(columns={c: COL_MAP[c] for c in df.columns if c in COL_MAP}, inplace=True)

    # Verificar que la columna clave exista
    if "CLAVE_ESCUELA" not in df.columns:
        # Intentar detección automática
        for c in df.columns:
            if "CLAVE" in c.upper() and "INSTIT" in c.upper():
                df.rename(columns={c: "CLAVE_ESCUELA"}, inplace=True)
                print(f"  Columna clave detectada como: '{c}'")
                break
    if "CLAVE_ESCUELA" not in df.columns:
        sys.exit(f"ERROR: no se encontró columna de clave en el directorio.\n"
                 f"Columnas disponibles: {df.columns.tolist()}")

    # Normalizar clave en directorio
    df["CLAVE_ESCUELA"] = df["CLAVE_ESCUELA"].apply(_clean).str.upper()
    df = df[df["CLAVE_ESCUELA"] != ""]

    # Construir lookup directorio → fila
    directorio: dict[str, dict] = {}
    for _, row in df.iterrows():
        clave = row["CLAVE_ESCUELA"]
        if clave and clave not in directorio:
            directorio[clave] = row.to_dict()

    print(f"Registros en directorio         : {len(directorio):,}")

    # ── 3. Cruzar y construir dirección ──────────────────────────────
    rows_out = []
    encontradas = 0

    for clave, num_regs in sorted(sin_coords.items(), key=lambda x: -x[1]):
        if clave in directorio:
            r = directorio[clave]
            vialidad    = _clean(r.get("VIALIDAD", ""))
            num_ext     = _clean(r.get("NUM_EXT", ""))
            asentamiento = _clean(r.get("ASENTAMIENTO", ""))
            localidad   = _clean(r.get("LOCALIDAD", ""))
            municipio   = _clean(r.get("MUNICIPIO", ""))
            nombre      = _clean(r.get("NOMBRE", ""))
            nivel       = _clean(r.get("NIVEL", ""))

            # Construir dirección: Vialidad #Num, Asentamiento, Localidad, Municipio, Estado
            partes = [p for p in [
                f"{vialidad} #{num_ext}".strip(" #") if vialidad else "",
                asentamiento,
                localidad,
                municipio,
                ESTADO,
            ] if p]
            direccion = ", ".join(partes)

            rows_out.append({
                "CLAVE_ESCUELA": clave,
                "NOMBRE":        nombre,
                "NIVEL":         nivel,
                "MUNICIPIO":     municipio,
                "LOCALIDAD":     localidad,
                "ASENTAMIENTO":  asentamiento,
                "VIALIDAD":      vialidad,
                "NUM_EXT":       num_ext,
                "DIRECCION":     direccion,
                "EN_DIRECTORIO": "SI",
                "NUM_REGISTROS": num_regs,
                "LAT":           "",
                "LONG":          "",
            })
            encontradas += 1
        else:
            # No está en el directorio; incluir igual para dejar constancia
            rows_out.append({
                "CLAVE_ESCUELA": clave,
                "NOMBRE":        "",
                "NIVEL":         "",
                "MUNICIPIO":     "",
                "LOCALIDAD":     "",
                "ASENTAMIENTO":  "",
                "VIALIDAD":      "",
                "NUM_EXT":       "",
                "DIRECCION":     "",
                "EN_DIRECTORIO": "NO",
                "NUM_REGISTROS": num_regs,
                "LAT":           "",
                "LONG":          "",
            })

    print(f"Encontradas en directorio       : {encontradas:,} / {len(sin_coords):,}")

    # ── 4. Escribir CSV ───────────────────────────────────────────────
    fieldnames = [
        "CLAVE_ESCUELA", "NOMBRE", "NIVEL", "MUNICIPIO", "LOCALIDAD",
        "ASENTAMIENTO", "VIALIDAD", "NUM_EXT", "DIRECCION",
        "EN_DIRECTORIO", "NUM_REGISTROS", "LAT", "LONG",
    ]
    with DST.open("w", encoding="utf-8-sig", newline="") as fout:
        writer = csv.DictWriter(fout, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows_out)

    print(f"\nArchivo generado                : {DST}")
    print(f"  Total filas                   : {len(rows_out):,}")
    print(f"  Con dirección (en directorio) : {encontradas:,}")
    print(f"  Sin datos (no en directorio)  : {len(rows_out) - encontradas:,}")
    print(f"\nPasos siguientes:")
    print(f"  1. Abre {DST.name} y rellena LAT/LONG mediante geocodificación")
    print(f"  2. Agrega las filas geocodificadas a data/Escuelas_Editar.xlsx (hoja GEORREFERENCIACION)")
    print(f"  3. Vuelve a ejecutar: python scripts/coordenadas_escuelas.py")


if __name__ == "__main__":
    main()
