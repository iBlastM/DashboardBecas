"""split_data.py — DashboardBecas

Divide data_dashboard.json en dos archivos para cumplir el límite de 100 MB/archivo de GitHub:

  data_a.json — datos demográficos, académicos, económicos, filtros y becas
  data_b.json — escuela + territorial + familiar + electoral

Elimina MUNICIPIO, LATITUD y LONGITUD (no se usan en ninguna gráfica).

Los campos NUM_BECAS, AÑOS, PERIODOS y BECAS (agregados por beneficiario único)
se incluyen en data_a.json.

Uso:
    cd d:\\Metrix\\DashboardBecasLocal
    python split_data.py
"""

import json
import pathlib

SRC   = pathlib.Path(__file__).parent / "data_dashboard.json"
DST_A = pathlib.Path(__file__).parent / "data_a.json"
DST_B = pathlib.Path(__file__).parent / "data_b.json"

# Columnas para cada archivo
# (MUNICIPIO, LATITUD y LONGITUD se descartan — no se usan en el dashboard)
COLS_A = ["GENERO", "EDAD", "COLONIA", "SECTOR", "NIVEL_EDUCATIVO",
          "GRADO", "AÑO", "ETAPA", "TIPO_BECA", "IMPORTE",
          "NUM_BECAS", "AÑOS", "PERIODOS", "BECAS"]

COLS_B = ["ESCUELA", "DELEGACION", "EDAD_TUTOR", "GENERO_TUTOR",
          "SECCION_ELECTORAL", "DISTRITO_FEDERAL", "DISTRITO_LOCAL"]

# Campos numéricos: se convierten a int cuando el valor es entero (17.0 → 17)
INT_FIELDS = {"EDAD", "GRADO", "AÑO", "IMPORTE", "NUM_BECAS", "EDAD_TUTOR",
              "SECCION_ELECTORAL", "DISTRITO_FEDERAL", "DISTRITO_LOCAL"}

# Campos que son listas/objetos — se copian tal cual sin conversión numérica
LIST_FIELDS = {"AÑOS", "PERIODOS", "BECAS"}


def compact(rec: dict, cols: list) -> dict:
    """Extrae 'cols' de rec, convirtiendo floats enteros a int."""
    out = {}
    for k in cols:
        v = rec.get(k)
        if k in LIST_FIELDS:
            # Listas y objetos se copian sin modificar
            out[k] = v if v is not None else []
        elif k in INT_FIELDS and v is not None:
            try:
                vi = int(v)
                out[k] = vi if float(vi) == float(v) else v
            except (TypeError, ValueError):
                out[k] = v
        else:
            out[k] = v
    return out


def main() -> None:
    if not SRC.exists():
        raise FileNotFoundError(f"No se encontró: {SRC}")

    written = 0
    with (SRC.open("r", encoding="utf-8") as fin,
          DST_A.open("w", encoding="utf-8") as fa,
          DST_B.open("w", encoding="utf-8") as fb):

        for line in fin:
            line = line.strip()
            if not line:
                continue
            rec = json.loads(line)
            fa.write(json.dumps(compact(rec, COLS_A), ensure_ascii=False) + "\n")
            fb.write(json.dumps(compact(rec, COLS_B), ensure_ascii=False) + "\n")
            written += 1

            if written % 50_000 == 0:
                print(f"  {written:,} registros procesados...", end="\r", flush=True)

    print(f"\nListo: {written:,} registros")
    for p in (DST_A, DST_B):
        print(f"  {p.name}: {p.stat().st_size / 1_048_576:.1f} MB")


if __name__ == "__main__":
    main()
