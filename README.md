# Piedrazul - Sistema de Gestión de Citas Médicas

Este proyecto es una aplicación web para la gestión de citas médicas, diseñada específicamente para ser accesible para adultos mayores. Cuenta con un backend en NestJS y un frontend SPA en Angular.

## Tecnologías

- **Frontend**: Angular (Standalone Components, Signals, Vitest).
- **Backend**: NestJS (monolito en capas, TypeORM, PostgreSQL).
- **Estilo**: CSS Vanilla enfocado en accesibilidad (WCAG AAA).

## Cómo iniciar el proyecto

### 1. Requisitos previos
- Node.js (versión 18 o superior)
- npm (o pnpm)
- Docker + Docker Compose v2

### 1.1. Configuración inicial (solo una vez)

Antes de levantar Docker, configura las credenciales:

```bash
# 1. Copia la plantilla de secrets
cp .env.example .env

# 2. Edita .env con tus contraseñas (opcional, valores por defecto funcionan en dev)
```

> **⚠️ `.env` contiene passwords. NO se commitea** (está en `.gitignore`).

### 1.2. Levantar infraestructura con Docker

Todo el entorno (PostgreSQL, RabbitMQ, Keycloak, backend y frontend) se levanta con Docker. No necesitas PostgreSQL ni Node localmente.

#### Modo desarrollo (con puertos de infraestructura expuestos):
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```
Esto expone: PostgreSQL (5432), RabbitMQ UI (15672), Keycloak (8080) para herramientas como DBeaver, pgAdmin, etc.

#### Modo producción (mínimos puertos):
```bash
docker compose up -d
```
Solo expone `frontend:80` y `backend:3000`. La infraestructura queda aislada en la red interna.

> **Primera vez**: Keycloak requiere configuración inicial (realm, client). Sigue la [guía de Keycloak](docs/KEYCLOAK_SETUP.md).

#### Servicios incluidos:

| Servicio | Acceso interno | Puerto host (dev) |
|---|---|---|
| Frontend (Angular) | http://frontend:80 | 80 |
| Backend (NestJS) | http://backend:3000 | 3000 |
| PostgreSQL | postgres:5432 | 5432 |
| PostgreSQL Notificaciones | postgres-notifications:5432 | 5433 |
| RabbitMQ | rabbitmq:5672 | — |
| RabbitMQ Management | rabbitmq:15672 | 15672 |
| Keycloak | http://keycloak:8080 | 8080 |

#### Notas importantes:
- **Redes**: `frontend` (público), `backend` (internal — aislada). El backend se conecta a ambas.
- **Recursos**: Límites de CPU/memoria definidos para evitar agotamiento.
- **init-db.sql**: Solo crea la DB `keycloak`. Las DBs `piedrazul` y `notifications_db` se crean automáticamente vía `POSTGRES_DB`.
- **Keycloak**: Corre en modo producción (`start` en vez de `start-dev`) con HTTP habilitado internamente y healthcheck configurado.
- **Secrets**: Centralizados en `.env` — ningún password está hardcodeado en el compose.
- **Seed data**: Para cargar datos iniciales, ejecuta dentro del contenedor:
  ```bash
  docker compose exec backend npx ts-node seed.ts
  ```
### 2. Configuración del Backend (local, sin Docker)

Si prefieres ejecutar el backend fuera del contenedor:

```bash
cd backend
pnpm install
```

#### Configuración de Keycloak (Autenticación)
👉 **[Sigue la guía de configuración de Keycloak aquí](docs/KEYCLOAK_SETUP.md)**.

#### Variables de Entorno
Crea o edita `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=piedrazul

KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=piedrazul
KEYCLOAK_CLIENT_ID=piedrazul-app

RABBITMQ_URL=amqp://piedrazul:piedrazul_pass@localhost:5672

PORT=3000
```

#### Iniciar servidor
```bash
pnpm run start:dev
```
Servidor en `http://localhost:3000`.

### 3. Configuración del Frontend (local, sin Docker)

```bash
cd frontend
pnpm install
pnpm start
```
La aplicación se abrirá en `http://localhost:4200`.

## Pruebas (Testing)

### Backend (Jest)
Ejecutar todos los tests:
```bash
cd backend
pnpm test
```

### Frontend (Vitest)
Ejecutar todos los tests:
```bash
cd frontend
pnpm exec vitest run
```

## Docker — Cambios Recientes

Se incorporaron mejoras Docker basadas en la skill `docker-expert`. Archivos nuevos/modificados:

| Archivo | Descripción |
|---|---|
| `docker-compose.yml` | Refactorizado con servicios backend + frontend, redes aisladas, resource limits, secrets vía `.env` |
| `docker-compose.dev.yml` | Override de desarrollo con puertos de infraestructura |
| `.env` | Secrets centralizados (gitignored) |
| `.env.example` | Plantilla para `.env` |
| `backend/Dockerfile` | Multi-stage (deps → build → runtime), usuario no-root, healthcheck |
| `frontend/Dockerfile` | Multi-stage (build Angular → Nginx), usuario no-root, healthcheck |
| `frontend/nginx.conf` | Proxy reverso: SPA + `/api/` al backend |
| `backend/.dockerignore` | Excluye node_modules, dist, .env, etc. |
| `frontend/.dockerignore` | Excluye node_modules, dist, .angular, etc. |
| `init-db.sql` | Simplificado: solo crea DB `keycloak` |

### Pendiente (próximos sprints)
- Nada — los 10 items están completados ✅

## Características Clave
- **Accesibilidad**: Texto de 18px+, botones de 48px+, contraste WCAG AAA.
- **Búsqueda de Pacientes**: En el dashboard de admin, puedes buscar pacientes existentes por documento para agilizar el agendamiento.
- **Gestión de Especialidades**: Al crear un médico, puedes seleccionar la especialidad de una lista predefinida (Quiropraxia, Fisioterapia, etc.).
- **Alineación de Formularios**: Los formularios de agendamiento y registro están sincronizados (mismos campos de género y eliminación de fecha de nacimiento).
- **Arquitectura**: Preparada para evolucionar a microservicios/hexagonal.

---
© 2026 Piedrazul
