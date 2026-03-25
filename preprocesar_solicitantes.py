"""preprocesar_solicitantes.py — DashboardBecas

Genera data_solicitantes.json desde base_limpia.json.

A diferencia de preprocesar.py (que filtra sólo CE-APROBADO), este script
incluye TODOS los estatus, para el componente de "Solicitantes".

Agrupa por CURP_BECARIO para producir SOLICITANTES ÚNICOS. Cada registro
de salida representa a un solicitante con:
  - STATUS           estatus del registro más reciente
  - ES_BENEFICIARIO  True si alguna vez tuvo STATUS == 'CE-APROBADO'
  - NUM_BECAS        número de becas CE-APROBADO obtenidas
  - TOTAL_SOLICITUDES número total de solicitudes (todos los estatus)
  - IMPORTE          importe total de becas CE-APROBADO
  - AÑOS             lista de años en que recibió al menos una beca aprobada
  - PERIODOS         lista de periodos de becas aprobadas
  - BECAS            detalle de cada beca aprobada
  - demás campos del registro más reciente (mayor ANIO_PROGRAMA)

Filtra:  ANIO_PROGRAMA en {2021, 2022, 2023, 2024, 2025}

Uso:
    cd d:\\Metrix\\DashboardBecasLocal
    python preprocesar_solicitantes.py

Nota: el archivo de origen pesa ~1 GB; el proceso tarda varios minutos.
"""

import json
import pathlib
import sys

SRC = pathlib.Path(__file__).parent / "base_limpia.json"
DST = pathlib.Path(__file__).parent / "data_solicitantes.json"

ANIOS_OK = {2021, 2022, 2023, 2024, 2025}


def derivar_genero_tutor(curp: str) -> str:
    """Posición 10 del CURP (0-index): H → HOMBRE, M → MUJER."""
    if isinstance(curp, str) and len(curp) >= 11:
        c = curp[10].upper()
        if c == "H":
            return "HOMBRE"
        if c == "M":
            return "MUJER"
    return "DESCONOCIDO"


def _etapa_code(etapa: str) -> str:
    if etapa == "1RA ETAPA":
        return "E1"
    if etapa == "2DA ETAPA":
        return "E2"
    return "EX"


def _int_or_none(v):
    try:
        return int(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def main() -> None:
    if not SRC.exists():
        sys.exit(f"ERROR: no se encontró {SRC}")

    print(f"Leyendo: {SRC}")
    print("Agrupando por CURP_BECARIO (todos los estatus) — puede tardar varios minutos...\n")

    # Dict: CURP → {latest_anio, latest_rec, becas:[CE-APROBADO], solicitudes:int, es_beneficiario:bool}
    curp_map: dict = {}
    leidos = 0
    omitidos = 0

    with SRC.open("r", encoding="utf-8") as fin:
        for raw in fin:
            raw = raw.strip()
            if not raw:
                continue

            try:
                d = json.loads(raw)
            except json.JSONDecodeError:
                omitidos += 1
                continue

            # Filtro por año (sin filtrar por status)
            anio_raw = d.get("ANIO_PROGRAMA")
            try:
                anio = int(anio_raw) if anio_raw is not None else None
            except (TypeError, ValueError):
                anio = None

            if anio not in ANIOS_OK:
                omitidos += 1
                continue

            leidos += 1
            if leidos % 10_000 == 0:
                print(
                    f"  {leidos:,} leídos | {len(curp_map):,} únicos...",
                    end="\r", flush=True,
                )

            # Identificador único del solicitante
            curp = (d.get("CURP_BECARIO") or "").strip().upper()
            if not curp:
                curp = f"__NO_CURP_{d.get('ID_USUARIO') or leidos}"

            status  = (d.get("STATUS") or "").strip()
            etapa   = (d.get("ETAPA")     or "")
            tipo    = (d.get("TIPO_BECA") or "")
            importe = float(d.get("IMPORTE") or 0)
            periodo = f"{anio}-{_etapa_code(etapa)}"
            es_aprobado = status == "CE-APROBADO"

            # Registro representativo (se actualizará al encontrar un año mayor)
            rep = {
                "GENERO":            (d.get("GENERO_BECARIO") or ""),
                "EDAD":              d.get("EDAD_BECARIO"),
                "COLONIA":           (d.get("COLONIA") or ""),
                "ESCUELA":           (d.get("ESCUELA") or ""),
                "SECTOR":            (d.get("SECTOR") or ""),
                "NIVEL_EDUCATIVO":   (d.get("NIVEL_EDUCATIVO") or d.get("NIVEL EDUCATIVO") or ""),
                "GRADO":             d.get("GRADO"),
                "EDAD_TUTOR":        d.get("EDAD_TUTOR"),
                "GENERO_TUTOR":      derivar_genero_tutor(d.get("CURP_TUTOR") or ""),
                "AÑO":               anio,
                "ETAPA":             etapa,
                "TIPO_BECA":         tipo,
                "STATUS":            status,
                # Campos geográficos y electorales
                "MUNICIPIO":         (d.get("MUNICIPIO") or ""),
                "DELEGACION":        (d.get("DELEGACION") or ""),
                "LATITUD":           d.get("LATITUD"),
                "LONGITUD":          d.get("LONGITUD"),
                "SECCION_ELECTORAL": _int_or_none(
                    d.get("SECCION_ELECTORAL_2025") or d.get("SECCION_ELECTORAL_2024")
                ),
                "DISTRITO_FEDERAL":  _int_or_none(
                    d.get("DISTRITO_FEDERAL_2025") or d.get("DISTRITO_FEDERAL_2024")
                ),
                "DISTRITO_LOCAL":    _int_or_none(
                    d.get("DISTRITO_LOCAL_2025") or d.get("DISTRITO_LOCAL_2024")
                ),
            }

            beca_det = {"PERIODO": periodo, "IMPORTE": importe, "TIPO_BECA": tipo}

            if curp not in curp_map:
                curp_map[curp] = {
                    "latest_anio":    anio,
                    "latest_rec":     rep,
                    "becas":          [beca_det] if es_aprobado else [],
                    "solicitudes":    1,
                    "es_beneficiario": es_aprobado,
                }
            else:
                entry = curp_map[curp]
                entry["solicitudes"] += 1
                if es_aprobado:
                    entry["becas"].append(beca_det)
                    entry["es_beneficiario"] = True
                if anio > entry["latest_anio"]:
                    entry["latest_anio"] = anio
                    entry["latest_rec"]  = rep

    print(
        f"\n\nProcesado: {leidos:,} registros | "
        f"{len(curp_map):,} solicitantes únicos | {omitidos:,} omitidos"
    )
    print(f"Escribiendo: {DST}\n")

    written = 0
    with DST.open("w", encoding="utf-8") as fout:
        for curp, entry in curp_map.items():
            latest = entry["latest_rec"]
            becas  = entry["becas"]
            años    = sorted({int(b["PERIODO"].split("-")[0]) for b in becas}) if becas else []
            periodos = sorted({b["PERIODO"] for b in becas}) if becas else []

            rec = {
                **latest,
                "CURP":              curp,
                "ES_BENEFICIARIO":   entry["es_beneficiario"],
                "TOTAL_SOLICITUDES": entry["solicitudes"],
                "NUM_BECAS":         len(becas),
                "IMPORTE":           sum(b["IMPORTE"] for b in becas),
                "AÑOS":              años,
                "PERIODOS":          periodos,
                "BECAS":             becas,
            }

            fout.write(json.dumps(rec, ensure_ascii=False) + "\n")
            written += 1

            if written % 10_000 == 0:
                print(f"  {written:,} escritos...", end="\r", flush=True)

    print(f"\nListo.")
    print(f"  Solicitantes únicos  : {written:,}")
    print(f"  Archivo              : {DST}")
    size_mb = DST.stat().st_size / 1_048_576
    print(f"  Tamaño               : {size_mb:.1f} MB")


if __name__ == "__main__":
    main()
