# ADR-004: Configuración Global en JSONB

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Almacenar configuración global en columna JSONB con GIN index

## Contexto

El sistema necesita persistir configuración global (minAdvanceHours, appointmentWindowDays). Es un conjunto pequeño de valores que puede crecer. Opciones: columnas separadas, tabla EAV, o JSONB.

## Opciones Consideradas

1. **JSONB** — Una tabla `configs(key, value)` con value en JSONB
2. **Columnas separadas** — Tabla `config` con columnas `min_advance_hours`, `appointment_window_days`
3. **Tabla EAV** — Entity-Attribute-Value (key → value en texto)

## Decisión

Se eligió JSONB con estructura:
```sql
CREATE TABLE configs (
  id UUID PK,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL CHECK (jsonb_typeof(value) = 'object'),
  description TEXT,
  updated_at TIMESTAMPTZ
);
```

Valor típico:
```json
{ "minAdvanceHours": 2, "appointmentWindowDays": 15 }
```

## Consecuencias

- ✅ Flexible: agregar nuevas propiedades no requiere migración
- ✅ Indexable con GIN para consultas de contención
- ✅ Validado con CHECK constraint (jsonb_typeof = 'object')
- ❌ Sin tipos estáticos fuertes en la BD (se validan en TypeScript con `GlobalConfig`)
- ❌ No se pueden hacer FK desde otras tablas a campos dentro del JSONB
- ⚠️ El `ConfigService` tipa el value como `GlobalConfig` para seguridad en tiempo de compilación
