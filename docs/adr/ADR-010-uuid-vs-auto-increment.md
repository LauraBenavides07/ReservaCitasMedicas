# ADR-010: UUID como Primary Key

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** UUID v4 como primary key en todas las tablas

## Contexto

Se necesita definir el tipo de primary key para todas las entidades del sistema.

## Opciones Consideradas

1. **UUID v4** — `PrimaryGeneratedColumn('uuid')` — globalmente único, opaco
2. **Auto-increment BIGINT** — Secuencial, predecible, más rápido
3. **UUID v7** — Ordenado por tiempo, mejor rendimiento de índices

## Decisión

UUID v4 para todas las entidades. La seguridad (opacidad de IDs) es relevante en un sistema de salud donde los IDs de pacientes y citas no deben ser adivinables. Además facilita la migración futura a microservicios (IDs únicos globalmente sin coordinación).

## Consecuencias

- ✅ IDs imposibles de adivinar (seguridad por opacidad)
- ✅ Sin coordinación necesaria entre servicios para generar IDs únicos
- ✅ TypeORM soporta nativamente `PrimaryGeneratedColumn('uuid')`
- ❌ Índices UUID v4 son más lentos que BIGINT (inserción aleatoria)
- ❌ 16 bytes vs 8 bytes (doble de espacio)
- ⚠️ No se usa UUID v7 porque PostgreSQL 15 no lo soporta nativamente
