# ADR-029: Sin Swagger/OpenAPI Automático

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** No usar @nestjs/swagger, documentación manual de API

## Contexto

NestJS tiene integración nativa con Swagger via `@nestjs/swagger` que genera OpenAPI automáticamente desde decoradores. El proyecto no lo usa.

## Opciones Consideradas

1. **Sin Swagger** — Documentación manual en `docs/back/api-guide.md`
2. **@nestjs/swagger** — Generación automática con decoradores @ApiTags, @ApiOperation, etc.
3. **Swagger + DTOs** — Usar DTOs como schemas OpenAPI con `@ApiProperty`

## Decisión

No usar Swagger para mantener los DTOs limpios sin decoradores extra. La API es pequeña (4 controladores, ~25 endpoints) y se documenta manualmente. El esfuerzo de agregar y mantener decoradores Swagger no se justifica frente a mantener un markdown.

## Consecuencias

- ✅ DTOs sin decoradores de documentación (más limpios)
- ✅ Control total sobre el contenido de la documentación
- ❌ Documentación manual (puede desactualizarse)
- ❌ Sin UI interactiva de Swagger (try-it-out)
- ❌ Sin generación automática de clientes OpenAPI
