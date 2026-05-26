# ADR-014: QueryBuilder para Historial de Auditoría

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Usar `createQueryBuilder` para el historial de cambios en vez de `FindManyOptions`

## Contexto

El endpoint `GET /appointments/history/all` requiere filtros combinados: `changeType`, `doctorId`, `date`, `search` (ILIKE sobre nombre de paciente y documento). `FindOptionsWhere` de TypeORM no soporta ILIKE de forma nativa ni joins condicionales.

## Opciones Consideradas

1. **`createQueryBuilder`** — Query Builder SQL con `andWhere()`, `leftJoinAndSelect()`, ILIKE
2. **`FindManyOptions`** — API estándar de TypeORM con `where`
3. **SQL raw** — Consultas SQL con `entityManager.query()`
4. **PostgreSQL views** — Vista materializada pre-filtrada

## Decisión

`createQueryBuilder` por su flexibilidad para construir condiciones dinámicas:
```typescript
const qb = this.repo.createQueryBuilder('h')
  .leftJoinAndSelect('h.appointment', 'a')
  .orderBy('h.changedAt', 'DESC')
  .take(limit ?? 50);

if (changeType) qb.andWhere('h.changeType = :changeType', { changeType });
if (doctorId)   qb.andWhere('a.doctorId = :doctorId', { doctorId });
if (search)     qb.andWhere('(h.patientName ILIKE :search OR a.patientDocument ILIKE :search)', { search: `%${search}%` });
```

## Consecuencias

- ✅ ILIKE para búsqueda case-insensitive por nombre y documento
- ✅ Joins condicionales sin cargar relaciones innecesarias
- ✅ Filtros escalables (agregar nuevos sin reescribir)
- ❌ Mayor acoplamiento a SQL específico de PostgreSQL (ILIKE no es estándar)
- ❌ Tipado manual de parámetros (vs `FindOptionsWhere` que es tipo seguro)
- ❌ El test unitario requiere mockear todo el QueryBuilder (chain de métodos)
