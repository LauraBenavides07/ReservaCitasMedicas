# ADR-024: Formato de Fechas con Locale `en-CA`

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Usar `en-CA` para formato ISO local (YYYY-MM-DD) sin librerías externas

## Contexto

El sistema maneja fechas en múltiples lugares: selección de fecha en formularios, visualización en tablas, comunicación con la API. Se necesita un formato consistente sin agregar dependencias pesadas.

## Opciones Consideradas

1. **`en-CA` locale** — `new Date().toLocaleDateString('en-CA')` produce `2026-05-25` exactamente
2. **date-fns** — Librería liviana con formato explícito
3. **moment.js** — Librería legacy, pesada, en desuso
4. **Intl.DateTimeFormat** — API nativa, configurable pero verbosa
5. **Angular DatePipe** — Propio de Angular, configurable vía locale

## Decisión

`en-CA` locale nativo de JavaScript porque produce exactamente `YYYY-MM-DD` sin necesidad de manipulación de strings. Es el formato ISO 8601 que espera el backend y el input `type="date"` de HTML. `new Date().toLocaleDateString('en-CA')` asigna el valor default del date picker. No se usa date-fns ni moment.js para mantener el bundle pequeño.

## Consecuencias

- ✅ Sin dependencias externas para formato básico de fechas
- ✅ `en-CA` = `YYYY-MM-DD` = ISO 8601 = compatible con backend y HTML date input
- ✅ API nativa, zero-dependency
- ❌ No hay formateo avanzado (días relativos, diferencia entre fechas)
- ❌ Dependencia del locale del navegador (en-CA hardcodeado)
- ✅ Para formatos de visualización (DD/MM/YYYY) se hace manualmente con `padStart()`
