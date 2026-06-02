# ADR-009: TypeORM como ORM

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** TypeORM con patrón Data Mapper

## Contexto

El backend necesita un ORM para PostgreSQL con soporte para migraciones, relaciones y consultas complejas.

## Opciones Consideradas

1. **TypeORM** — ORM maduro, decoradores, Data Mapper + Active Record, query builder
2. **Prisma** — ORM moderno con schema declarativo, tipo seguro, migraciones automáticas
3. **MikroORM** — ORM rápido, unidad de trabajo, soporte nativo para unidades de trabajo
4. **Knex.js** — Query builder sin ORM

## Decisión

TypeORM por su madurez en el ecosistema NestJS, soporte nativo con `@nestjs/typeorm`, y la flexibilidad de `createQueryBuilder` para consultas complejas (ILIKE, joins). Se usa en modo Data Mapper (repositorios separados de las entidades), alineado con la arquitectura de puertos y adaptadores.

## Consecuencias

- ✅ Integración nativa con NestJS (`@nestjs/typeorm`, `@InjectRepository`)
- ✅ `createQueryBuilder` permite consultas complejas (ILIKE, joins dinámicos)
- ✅ Decoradores en entidades facilitan la legibilidad
- ❌ Migraciones requieren configuración manual (`data-source.ts`)
- ❌ Tipado no tan seguro como Prisma (TypeORM usa tipos genéricos)
- ❌ Rendimiento inferior a MikroORM en benchmarks
