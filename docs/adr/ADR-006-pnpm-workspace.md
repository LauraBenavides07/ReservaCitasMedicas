# ADR-006: pnpm Workspace como Gestor de Monorepo

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** pnpm Workspace con tres proyectos (backend, frontend, notification-service)

## Contexto

El proyecto tiene tres aplicaciones que comparten configuración y dependen de un paquete `shared/events`. Se necesita un gestor de monorepo que sea rápido, seguro y maneje correctamente las dependencias compartidas.

## Opciones Consideradas

1. **pnpm Workspace** — pnpm nativo con `pnpm-workspace.yaml`
2. **npm Workspaces** — npm 7+ built-in
3. **Nx** — Monorepo con cache distribuido y generación de código
4. **Turborepo** — Orquestación de tareas con caching

## Decisión

pnpm Workspace por simplicidad y velocidad:
- Tres workspaces: root, `backend/`, `frontend/`, `notification-service/`
- `shared/events` referenciado desde cada servicio via `"@piedrazul/events": "workspace:*"`
- Configuración `minimumReleaseAge: 0` para desarrollo (paquetes publicados localmente)

## Consecuencias

- ✅ Instalaciones más rápidas que npm (cacheadas globalmente)
- ✅ Estructura de `node_modules` estricta (evita dependencias fantasma)
- ✅ Dependencias compartidas a través del workspace
- ❌ Nx no disponible (cache distribuido, generación de código)
- ⚠️ Si el proyecto crece mucho, migrar a Nx o Turborepo para caching
