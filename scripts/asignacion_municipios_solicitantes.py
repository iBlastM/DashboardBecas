"""
Asigna el municipio correcto a cada registro de data_solicitantes.json
usando un spatial join con el GeoJSON de municipios de Querétaro.
"""

import json
import math
from pathlib import Path
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point


def _sanitize(obj):
    """Recursively replace float NaN/Inf with None so json.dumps outputs null."""
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    return obj

BASE = Path(__file__).resolve().parent.parent

DATA_PATH    = BASE / "data_solicitantes.json"
GEOJSON_PATH = BASE / "GeoJsons" / "MUNICIPIOS QRO.geojson"
OUTPUT_PATH  = BASE / "data_solicitantes.json"

# ── 1. Leer el JSON (formato NDJSON: un objeto JSON por línea) ──────────────
print("Leyendo data_solicitantes.json ...")
records = []
with open(DATA_PATH, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line:
            records.append(json.loads(line))

df = pd.DataFrame(records)
print(f"  {len(df):,} registros cargados.")

# ── 2. Separar registros con y sin coordenadas ──────────────────────────────
mask_coords = df["LATITUD"].notna() & df["LONGITUD"].notna()
df_geo  = df[mask_coords].copy()
df_null = df[~mask_coords].copy()
print(f"  Con coordenadas: {len(df_geo):,}  |  Sin coordenadas: {len(df_null):,}")

# ── 3. Crear GeoDataFrame con los puntos ────────────────────────────────────
geometry = [Point(lon, lat) for lon, lat in zip(df_geo["LONGITUD"], df_geo["LATITUD"])]
gdf_points = gpd.GeoDataFrame(df_geo, geometry=geometry, crs="EPSG:4326")

# ── 4. Leer el GeoJSON de municipios ────────────────────────────────────────
print("Leyendo GeoJSON de municipios ...")
municipios = gpd.read_file(GEOJSON_PATH)[["NOM_MUN", "geometry"]]

# ── 5. Spatial join ─────────────────────────────────────────────────────────
print("Realizando spatial join ...")
joined = gpd.sjoin(gdf_points, municipios, how="left", predicate="within")

# NOM_MUN contendrá el municipio del polígono que contiene el punto;
# si el punto cae fuera de todos los polígonos quedará NaN → conservar el original.
joined["MUNICIPIO"] = joined["NOM_MUN"].fillna(joined["MUNICIPIO"])

# Eliminar columnas auxiliares del join
joined = joined.drop(columns=["geometry", "index_right", "NOM_MUN"])

# ── 6. Reunir registros con y sin coordenadas ───────────────────────────────
result = pd.concat([joined, df_null], ignore_index=True)

# ── 7. Guardar como NDJSON (mismo formato de origen) ────────────────────────
print(f"Guardando resultado en {OUTPUT_PATH} ...")
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    for record in result.to_dict(orient="records"):
        f.write(json.dumps(_sanitize(record), ensure_ascii=False) + "\n")

print(f"Listo. {len(result):,} registros escritos.")

# ── Resumen de municipios asignados ─────────────────────────────────────────
print("\nDistribución de municipios tras la corrección:")
print(result["MUNICIPIO"].value_counts().to_string())
