"""run_all.py — DashboardBecasLocal

Ejecuta el pipeline completo de preprocesamiento en el orden correcto.
Todos los archivos generados quedan en la raíz de DashboardBecasLocal/.

Uso:
    cd d:\\Metrix\\DashboardBecasLocal
    python run_all.py

Dependencias para asignacion_municipios.py:
    pip install geopandas pandas shapely
"""

import subprocess
import sys
import time
from pathlib import Path

ROOT    = Path(__file__).resolve().parent
SCRIPTS = ROOT / "scripts"
PY      = sys.executable   # mismo intérprete que lanzó este script


def run(script: str, desc: str) -> bool:
    path = SCRIPTS / script
    print(f"\n{'─' * 60}")
    print(f"▶  {desc}")
    print(f"   {path}")
    print(f"{'─' * 60}")
    t0 = time.time()
    result = subprocess.run([PY, str(path)], cwd=str(ROOT))
    elapsed = time.time() - t0
    if result.returncode != 0:
        print(f"\n✗  ERROR en {script} (código {result.returncode})")
        return False
    print(f"\n✔  {script} completado en {elapsed:.1f}s")
    return True


def main() -> None:
    print("=" * 60)
    print("  PIPELINE DE PREPROCESAMIENTO — DashboardBecasLocal")
    print("=" * 60)

    pasos = [
        # ── Vista Beneficiarios (index.html) ─────────────────────────
        ("preprocesar.py",
         "[1/5] Beneficiarios: base_limpia.json → data_dashboard.json"),

        ("asignacion_municipios.py",
         "[2/5] Beneficiarios: asignar municipios por spatial join"),

        ("split_data.py",
         "[3/5] Beneficiarios: data_dashboard.json → data_a.json + data_b.json"),

        # ── Vista Solicitantes (solicitantes.html) ────────────────────
        ("preprocesar_solicitantes.py",
         "[4/5] Solicitantes: base_limpia.json → data_solicitantes.json"),

        ("split_solicitantes.py",
         "[5/5] Solicitantes: data_solicitantes.json → data_sol_a.json + data_sol_b.json"),
    ]

    t_total = time.time()
    for script, desc in pasos:
        ok = run(script, desc)
        if not ok:
            print("\nPipeline interrumpido. Revisa el error anterior.")
            sys.exit(1)

    elapsed_total = time.time() - t_total
    print(f"\n{'=' * 60}")
    print(f"  PIPELINE COMPLETADO en {elapsed_total:.1f}s")
    print(f"  Archivos generados en:  {ROOT}")

if __name__ == "__main__":
    main()
