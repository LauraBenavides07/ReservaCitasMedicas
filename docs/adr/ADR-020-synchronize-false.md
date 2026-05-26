# ADR-020: synchronize: false con Migraciones

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** TypeORM con `synchronize: false` y migraciones explícitas

## Contexto

TypeORM permite `synchronize: true` que sincroniza automáticamente el esquema de BD con las entidades. Esto es conveniente en desarrollo pero peligroso en producción (pérdida de datos, cambios no controlados).

## Opciones Consideradas

1. **synchronize: false + migraciones** — Control explícito de cambios de esquema
2. **synchronize: true** — Auto-sincronización en todos los entornos
3. **synchronize: true solo en desarrollo** — Híbrido según variable de entorno

## Decisión

`synchronize: false` en todas las configuraciones. Los cambios de esquema se gestionan con migraciones TypeORM:
```bash
pnpm migration:generate src/migrations/NombreMigracion
pnpm migration:run
```
El seed.ts ejecuta `dataSource.runMigrations()` antes de insertar datos.

## Consecuencias

- ✅ Control total sobre cambios de esquema (sin sorpresas en producción)
- ✅ Las migraciones son versionadas y revisables en code review
- ✅ Rollback posible (`migration:revert`)
- ❌ Desarrollo más lento (hay que generar migraciones manualmente)
- ❌ Las migraciones generadas por TypeORM no siempre son correctas (hay que revisarlas)
