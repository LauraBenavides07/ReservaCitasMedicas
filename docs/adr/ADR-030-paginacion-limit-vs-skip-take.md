# ADR-030: Dos Estrategias de Paginación

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Skip/Take para listado de citas, Limit para historial de auditoría

## Contexto**

El sistema tiene dos endpoints paginados con necesidades diferentes:
1. `GET /appointments` — Listado de citas por médico/fecha, paginación clásica
2. `GET /appointments/history/all` — Historial de auditoría, carga de registros recientes

## Opciones Consideradas

1. **Skip/Take para ambos** — Paginación tradicional offset-based
2. **Limit para ambos** — Cursor-based (solo número de resultados)
3. **Skip/Take para listado + Limit para historial** — Híbrido

## Decisión

- `GET /appointments` usa `skip` y `take` (default: skip=0, take=100). El frontend necesita paginación con saltos (ir a página 3).
- `GET /appointments/history/all` usa `limit` (default: 50). El historial siempre carga los más recientes; no necesita paginación con saltos.

## Consecuencias

- ✅ Skip/take es más flexible para el listado de citas (paginación completa)
- ✅ Limit es más simple para el historial (solo recortar resultados)
- ❌ Skip/take tiene problemas de rendimiento con offsets grandes en PostgreSQL
- ❌ Dos patrones de paginación en la API (inconsistencia)
- ❌ El frontend de historial no tiene paginación (solo "cargar más")
