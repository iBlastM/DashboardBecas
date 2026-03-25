# Dashboard de Rechazos y Pendientes — Becas
## Propuesta de KPIs y Estructura

**Base analizada:** `base_limpia.csv` — 779,627 registros, 53 columnas  
**Universo de análisis:** registros con STATUS `CON RECHAZOS`, `CE-CON RECHAZO`, `CE-PENDIENTE`, `PENDIENTE`, `CANCELADO`  
**Fecha de análisis:** Marzo 2026

---

## Volumen Global

| Métrica | Valor |
|---------|-------|
| Total de solicitudes | 779,627 |
| Rechazadas / Pendientes / Canceladas | **49,765** |
| Tasa de problema | **6.38%** |
| CURP distintos afectados | **11,485** |
| Becarios con rechazo recurrente (>5 apariciones) | **3,833** |

Desglose por STATUS:

| STATUS | Registros |
|--------|-----------|
| CON RECHAZOS | 36,099 |
| CE-CON RECHAZO | 8,223 |
| CE-PENDIENTE | 3,601 |
| CANCELADO | 1,837 |
| PENDIENTE | 5 |

---

## KPIs Identificados

### KPI 1 — Tasa Global de Rechazo/Pendiente
- **Definición:** % de solicitudes con status de problema sobre el total.
- **Valor actual:** 6.38%
- **Uso en dashboard:** Tarjeta KPI principal con comparativa histórica.

---

### KPI 2 — Tasa de Rechazo por Tipo de Beca ⚠️
- **Definición:** % de rechazos dentro de cada categoría de beca.
- **Valores:**

| Tipo de Beca | Tasa de Rechazo |
|---|---|
| Universidad | **13.76%** |
| Secundaria | 6.32% |
| Primaria | 6.27% |
| Primaria Excelencia | 4.20% |
| Secundaria Excelencia | 3.99% |

- **Hallazgo clave:** Las becas universitarias tienen más del doble de rechazo que el resto. Las becas de Excelencia presentan los mejores resultados (~4%).
- **Uso en dashboard:** Gráfica de barras comparativas con semáforo de alerta.

---

### KPI 3 — Tendencia Anual de Rechazo ⚠️
- **Definición:** Tasa de rechazo por año del programa para detectar deterioro o mejora.
- **Valores:**

| Año | Tasa de Rechazo |
|-----|----------------|
| 2020 | 5.17% |
| 2021 | 6.48% |
| 2022 | 6.17% |
| 2023 | **3.93%** (mínimo histórico) |
| 2024 | 6.24% |
| 2025 | 5.36% |
| 2026 | **11.85%** ⚠️ |

- **Hallazgo clave:** 2026 casi duplica el promedio histórico (~5.8%). Puede deberse a solicitudes aún en proceso de validación, pero requiere monitoreo urgente.
- **Uso en dashboard:** Gráfica de línea con banda de referencia histórica y alerta para 2026.

---

### KPI 4 — Tasa de Rechazo por Sector Escolar
- **Definición:** % de rechazos según si la escuela es pública o privada.
- **Valores:**

| Sector | Tasa de Rechazo |
|--------|----------------|
| Privada | **7.73%** |
| Pública | 5.99% |

- **Hallazgo clave:** Escuelas privadas tienen 1.74 puntos porcentuales más de rechazo.
- **Uso en dashboard:** Donut chart o barras con comparativa público/privado.

---

### KPI 5 — Concentración Geográfica de Rechazos
- **Definición:** Tasa de rechazo por delegación para identificar zonas con mayor concentración de problemas.
- **Valores (top 15 delegaciones por volumen):**

| Delegación | Rechazados | Total | Tasa |
|---|---|---|---|
| Cabecera Municipal | 3,693 | 44,901 | **8.22%** |
| Emiliano Zapata | 7,790 | 100,734 | **7.73%** |
| San José de los Olvera | 3,717 | 51,278 | **7.25%** |
| Santa Bárbara | 4,243 | 61,340 | 6.92% |
| Candiles | 10,132 | 154,586 | 6.55% |
| La Negreta | 7,309 | 113,924 | 6.42% |
| Los Olvera | 3,342 | 55,315 | 6.04% |
| Los Ángeles | 2,560 | 42,731 | 5.99% |
| Lourdes | 955 | 19,160 | 4.98% |
| Charco Blanco | 639 | 18,258 | 3.50% |
| Presa de Bravo | 382 | 13,423 | 2.85% |
| El Jaral | 409 | 14,682 | **2.79%** (mínimo) |

- **Uso en dashboard:** Mapa coroplético por delegación/colonia con escala de color por tasa de rechazo.

---

### KPI 6 — Brecha de Promedio Académico
- **Definición:** Diferencia en promedio escolar entre becarios rechazados y aprobados.
- **Valores:**

| Grupo | Promedio |
|-------|---------|
| Aprobados (CE-APROBADO) | 8.709 |
| Rechazados / Pendientes | 8.091 |
| **Brecha** | **0.618 puntos** |

- **Casos especiales:**
  - 3,698 rechazados con **promedio = 0** (dato faltante o mal capturado)
  - 3,947 rechazados (7.93%) con **promedio < 7** (posible criterio de inelegibilidad)
- **Uso en dashboard:** Histograma superpuesto rechazados vs aprobados + indicador de outliers con promedio=0.

---

### KPI 7 — Anomalías de Edad (Calidad de Datos)
- **Definición:** % de rechazados con edad fuera del rango esperado para su nivel educativo.
- **Rangos esperados:** Primaria 5-14, Secundaria 11-18, Universidad 17-30.
- **Valores:**

| Nivel | Registros fuera de rango | % |
|-------|--------------------------|---|
| Primaria | 9,419 | **28.2%** |
| Secundaria | 2,346 | **18.4%** |
| Universidad | 239 | 6.6% |

- **Hipótesis:** Alta probabilidad de que la fecha de nacimiento del tutor fue capturada en el campo del becario.
- **Uso en dashboard:** Tabla de anomalías con filtro por nivel y opción de exportar.

---

### KPI 8 — Tasa de Rechazo por Etapa
- **Definición:** % de rechazos en 1ª vs. 2ª etapa del programa.
- **Valores:**

| Etapa | Tasa |
|-------|------|
| 1ª Etapa | 6.75% |
| 2ª Etapa | 5.79% |

- **Uso en dashboard:** Indicador comparativo tipo gauge o barras.

---

### KPI 9 — Brecha de Género en Rechazos
- **Definición:** Tasa de rechazo por género del becario.
- **Valores:**

| Género | Tasa |
|--------|------|
| Hombre | 6.80% |
| Mujer  | 6.06% |

- **Nota:** Diferencia de 0.74 pp — menor, pero monitoreable ante posibles sesgos operativos.
- **Uso en dashboard:** Indicador de paridad con comparativa histórica.

---

### KPI 10 — Becarios con Rechazo Recurrente (Riesgo de Abandono)
- **Definición:** Número de becarios (por CURP) concentrados en múltiples apariciones de rechazo.
- **Valores:**

| Umbral | Becarios |
|--------|---------|
| ≥ 3 rechazos | **5,879** |
| ≥ 5 rechazos | **3,833** |
| ≥ 10 rechazos | **1,259** |
| ≥ 20 rechazos | 208 |
| Máximo por CURP | **48 apariciones** |

- **Uso en dashboard:** Ranking de CURP con más rechazos y detalle del historial por becario.

---

## Propuesta de Estructura del Dashboard

### Página 1 — Resumen Ejecutivo
- KPI cards: tasa global, # CURP afectados, tasa 2026 vs. promedio histórico (con alerta)
- Mini-gráfica de tendencia anual (sparkline)
- Desglose por STATUS en donut chart

### Página 2 — Análisis Geográfico
- Mapa coroplético de tasa de rechazo por delegación
- Mapa de calor de volumen de rechazos por colonia
- Tabla rankeada de delegaciones con mayor tasa

### Página 3 — Análisis por Perfil del Becario
- Barras de tasa de rechazo por: tipo de beca / nivel educativo / sector escolar / etapa
- Histograma de promedio académico: rechazados vs. aprobados
- Indicador de brecha de género

### Página 4 — Calidad de Datos y Anomalías
- Tabla de rechazados con promedio = 0 o promedio < 7
- Tabla de rechazados con edad fuera del rango esperado
- Conteo de campos críticos vacíos (COLONIA, FECHA_NACIMIENTO, CORREO)

### Página 5 — Becarios en Situación de Riesgo
- Ranking de CURP con mayor cantidad de rechazos acumulados
- Historial por becario (filtro por CURP)
- Segmentación por año, delegación y tipo de beca del grupo recurrente

---

## Análisis Profundo — Registros Pendientes (CE-PENDIENTE / PENDIENTE)

> **Universo:** 3,606 registros (3,601 `CE-PENDIENTE` + 5 `PENDIENTE`) — 570 CURP distintos.

### Hallazgo Principal: Son Registros Históricos Abandonados, No Casos Sin Resolver

El análisis cruzado demuestra que los pendientes **no representan becarios en espera de resolución activa**. Son registros de convocatorias antiguas que nunca recibieron un cierre formal en el sistema.

---

### 1. Antigüedad — Llevan años sin cerrarse

| Métrica | Valor |
|---------|-------|
| Antigüedad promedio | **~6.3 años** (~2,319 días) |
| Antigüedad mediana | ~6.5 años (~2,387 días) |
| Con más de 1 año sin cerrar | **3,606 (100%)** |
| Con más de 3 años sin cerrar | **3,589 (99.5%)** |
| Con más de 5 años sin cerrar | **3,582 (99.3%)** |
| Fecha de registro más antigua | Mayo 2019 |
| Fecha de registro más reciente | Febrero 2025 |

**Concentración temporal de origen:**
- **Septiembre 2019:** 2,119 registros (58.8% del total de pendientes)
- **Enero–Febrero 2021:** 552 registros (15.3%)
- Los demás años tienen volúmenes marginales (< 20 registros)

---

### 2. Cruce con Aprobados — El becario ya fue resuelto en otro ciclo

Este es el hallazgo más relevante. Se analizó para cada registro pendiente si el mismo CURP tiene aprobaciones **posteriores en el mismo tipo/programa de beca**:

| Escenario | Registros | % |
|-----------|-----------|---|
| Con aprobación del **mismo tipo de beca** en fecha posterior | **3,568** | **99.4%** |
| Con aprobación del **mismo programa exacto** en fecha posterior | **3,408** | **95.0%** |
| Con aprobación de cualquier tipo en fecha **anterior** al pendiente | 2,273 | 63.4% |
| Sin ninguna aprobación posterior del mismo tipo | 20 | 0.6% |

**Secuencia típica confirmada con datos reales:**
```
Sep 2019 → BECA ACADEMICA SEGUNDA ETAPA  → CE-PENDIENTE  ← registro congelado en sistema
Feb 2020 → BECA ACADEMICA               → CE-APROBADO   ← nueva solicitud, aprobada
Oct 2020 → BECA ACADEMICA SEGUNDA ETAPA → CE-APROBADO
Ene 2021 → BECA ACADEMICA               → CE-APROBADO
...el becario continúa recibiendo su beca normalmente
```

**Interpretación:** cuando una solicitud quedaba en `CE-PENDIENTE`, el sistema no la resolvía — generaba un nuevo registro en el siguiente ciclo. El becario siguió recibiendo su beca, pero el registro pendiente anterior quedó huérfano de forma permanente.

---

### 3. Distribución por Tipo y Programa

| Tipo de Beca | Pendientes |
|---|---|
| Primaria | 1,894 (52.5%) |
| Secundaria | 1,292 (35.8%) |
| Primaria Excelencia | 178 (4.9%) |
| Universidad | 156 (4.3%) |
| Secundaria Excelencia | 86 (2.4%) |

| Programa | Pendientes |
|---|---|
| Beca Académica Segunda Etapa | 2,135 (59.2%) |
| Beca Académica | 1,309 (36.3%) |
| Beca Universitario Avanza | 156 (4.3%) |
| Beca Académica Extemporánea | 6 (0.2%) |

---

### 4. Anomalías de Edad (Indicador de Calidad de Datos en Origen)

| Nivel | Fuera de rango esperado | % |
|-------|------------------------|---|
| Primaria (rango 5–14) | **996 de 2,072** | **48.1%** |
| Secundaria (rango 11–18) | datos disponibles | — |
| Universidad (rango 17–30) | datos disponibles | — |

**Hipótesis:** la alta tasa de anomalía de edad en primaria (~48%) sugiere que errores de captura en el campo de fecha de nacimiento fueron la causa original del bloqueo en `CE-PENDIENTE`. El sistema no pudo validar la solicitud y la dejó suspendida.

---

### 5. Campos Críticos Vacíos

| Campo | Vacíos | % |
|-------|--------|---|
| CELULAR | 391 | **10.84%** |
| COLONIA_GEO | 189 | 5.24% |
| FECHA_NACIMIENTO_BECARIO | 13 | 0.36% |
| COLONIA | 11 | 0.31% |
| DELEGACION | 7 | 0.19% |

---

### 6. Promedio Académico

| Métrica | Valor |
|---------|-------|
| Promedio medio | 8.567 |
| Con promedio = 0 | 157 (4.4%) |
| Con promedio < 7 | 163 (4.5%) |

El promedio de los pendientes (8.57) es **más alto** que el de los rechazados generales (8.09) y se acerca al de aprobados (8.71), lo que refuerza que el bloqueo no fue académico sino operativo/de captura.

---

### 7. Concentración Geográfica

**Top 5 delegaciones por volumen de pendientes:**

| Delegación | Pendientes |
|---|---|
| Candiles | 818 |
| Emiliano Zapata | 658 |
| La Negreta | 596 |
| Cabecera Municipal | 317 |
| Santa Bárbara | 289 |

---

### Conclusión y Acción Recomendada

Los 3,606 registros `CE-PENDIENTE`/`PENDIENTE` **no requieren intervención operativa individual**. Son registros de 2019–2021 que quedaron bloqueados por errores de captura (principalmente anomalías de edad y datos de domicilio) en una época temprana del sistema, antes de que existieran mecanismos de corrección.

**El 99.4% de los becarios ya fue resuelto posteriormente en el mismo tipo de beca.**

| Acción | Descripción |
|--------|-------------|
| **Archivado masivo** | Marcar los 3,606 registros como "cerrado histórico" sin afectar al becario |
| **Separación en dashboard** | Mostrarlos como "pendientes históricos no activos" — KPI diferenciado del rechazo operativo |
| **No incluir en tasa de rechazo activa** | Distorsionan la métrica: su causa es sistémica, no operativa actual |
| **Los 20 sin resolución posterior** | Único subgrupo que merece revisión individual (0.6% — todos en Primaria/Secundaria) |

---

## Filtros Globales Recomendados

- Año del programa (`ANIO_PROGRAMA`)
- Tipo de beca / Nivel educativo
- Sector escolar (Pública / Privada)
- Delegación / Colonia
- Etapa (1ª / 2ª)
- Género
- STATUS específico
