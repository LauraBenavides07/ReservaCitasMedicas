# ADR-028: Timezone UTC en Backend, Local en Frontend

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Backend opera en UTC, frontend convierte a zona horaria local del usuario

## Contexto

Las citas tienen fechas y horas que deben interpretarse correctamente independientemente de la zona horaria del servidor y del usuario. El backend usa `timestamptz` para timestamps y `date`/`time` para campos de citas.

## Opciones Consideradas

1. **Backend UTC + frontend local** — BD almacena en UTC, frontend convierte al navegador del usuario
2. **Todo en UTC** — Frontend también muestra en UTC (confuso para usuarios locales)
3. **Todo en zona local de la clínica** — Hardcodear zona horaria (ej: Bogotá UTC-5)

## Decisión

- Backend: operaciones y BD en UTC. `timestamptz` guarda la hora con zona.
- Frontend: `new Date(isoString)` convierte automáticamente a la zona horaria del navegador del usuario.
- Fechas de citas (`appointmentDate`): tipo `date` sin timezone, se interpretan como fecha local.
- Horas de citas (`appointmentTime`): tipo `time` sin timezone, se muestran tal cual.

## Consecuencias

- ✅ Consistencia internacional (cualquier clínica en cualquier zona horaria)
- ✅ `timestamptz` preserva la zona horaria original
- ✅ El frontend maneja la conversión automáticamente
- ❌ `formatDateTime()` en frontend depende del timezone del navegador (tests fallan en UTC-5)
- ❌ Citas programadas cerca del cambio de hora (DST) pueden tener ambigüedad
- ⚠️ Los tests de `formatDateTime` deben ser timezone-independent (comparar con `new Date()` local)
