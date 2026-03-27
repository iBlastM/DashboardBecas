"""split_solicitantes.py — DashboardBecas

Divide data_solicitantes.json en dos archivos para cumplir el límite de
100 MB/archivo de GitHub:

  data_sol_a.json — datos demográficos, académicos, económicos, filtros y becas
  data_sol_b.json — escuela + territorial + familiar + electoral

Extiende split_data.py con los campos STATUS, ES_BENEFICIARIO y TOTAL_SOLICITUDES.

Uso:
    cd d:\\Metrix\\DashboardBecasLocal
    python split_solicitantes.py
"""

import json
import pathlib

ROOT  = pathlib.Path(__file__).resolve().parent.parent
SRC   = ROOT / "data_solicitantes.json"
DST_A = ROOT / "data_sol_a.json"
DST_B = ROOT / "data_sol_b.json"

COLS_A = ["CURP", "GENERO", "EDAD", "COLONIA", "SECTOR", "NIVEL_EDUCATIVO",
          "GRADO", "AÑO", "ETAPA", "TIPO_BECA", "IMPORTE",
          "NUM_BECAS", "AÑOS", "PERIODOS", "BECAS",
          "STATUS", "ES_BENEFICIARIO", "TOTAL_SOLICITUDES"]

COLS_B = ["MUNICIPIO", "ESCUELA", "DELEGACION", "EDAD_TUTOR", "GENERO_TUTOR",
          "SECCION_ELECTORAL", "DISTRITO_FEDERAL", "DISTRITO_LOCAL"]

INT_FIELDS = {"EDAD", "GRADO", "AÑO", "IMPORTE", "NUM_BECAS", "EDAD_TUTOR",
              "SECCION_ELECTORAL", "DISTRITO_FEDERAL", "DISTRITO_LOCAL",
              "TOTAL_SOLICITUDES"}

LIST_FIELDS = {"AÑOS", "PERIODOS", "BECAS"}


def compact(rec: dict, cols: list) -> dict:
    out = {}
    for k in cols:
        v = rec.get(k)
        if k in LIST_FIELDS:
            out[k] = v if v is not None else []
        elif k == "ES_BENEFICIARIO":
            out[k] = bool(v)
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
        raise FileNotFoundError(
            f"No se encontró: {SRC}\n"
            "Ejecuta primero: python preprocesar_solicitantes.py"
        )

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

    print(f"\nListo. {written:,} registros")
    for dst in (DST_A, DST_B):
        size_mb = dst.stat().st_size / 1_048_576
        print(f"  {dst.name:<20} {size_mb:.1f} MB")


if __name__ == "__main__":
    main()
