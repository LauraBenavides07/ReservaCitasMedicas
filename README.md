# Piedrazul - Sistema de Gestión de Citas Médicas

Este proyecto es una aplicación web para la gestión de citas médicas, diseñada específicamente para ser accesible para adultos mayores. Cuenta con un backend en NestJS y un frontend SPA en Angular.

## Tecnologías

- **Frontend**: Angular (Standalone Components, Signals, Vitest).
- **Backend**: NestJS (monolito en capas, TypeORM, PostgreSQL).
- **Estilo**: CSS Vanilla enfocado en accesibilidad (WCAG AAA).

## Cómo iniciar el proyecto

### 1. Requisitos previos
- Node.js (versión 18 o superior)
- npm
- PostgreSQL corriendo localmente (Puerto 5432)
- Docker (para ejecutar Keycloak)
### 1.1. Levantamiento docker 

Levanta todos los servicios, Se debe realizar solo 1 vez la configuracion delservicio de Keycloak

```bash
docker-compose up -d 
```
### 2. Configuración del Backend
Accede a la carpeta del servidor e instala las dependencias:

```bash
cd backend
pnpm install
```

#### Configuración de Keycloak (Autenticación)
Para la gestión de identidades, utilizamos Keycloak. Es **obligatorio** configurar Keycloak antes de iniciar el backend. 
👉 **[Sigue la guía de configuración de Keycloak aquí](docs/KEYCLOAK_SETUP.md)**.

#### Configuración de Variables de Entorno
Crea o edita el archivo `.env` en la carpeta `backend` con los datos de tu PostgreSQL y Keycloak:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña
DB_DATABASE=piedrazul

# Keycloak

KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=piedrazul
KEYCLOAK_CLIENT_ID=piedrazul-app
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin

# ─ RabbitMQ 

RABBITMQ_URL=amqp://piedrazul:piedrazul_pass@localhost:5672

# ── Server 
PORT=3000
```

Para tener datos de prueba (médicos y pacientes iniciales), ejecuta:
```bash
npx ts-node seed.ts  #  Este comando reinicia la base de datos (borra datos existentes). Si usas Docker, elimina el volumen o ejecuta `docker-compose down -v` antes si deseas un clean start.
```

#### Iniciar el servidor
```bash
pnpm run start:dev
```
El servidor estará disponible en `http://localhost:3000`.

### 3. Configuración del Frontend
Accede a la carpeta de la aplicación cliente e instala las dependencias:
```bash
cd frontend
pnpm install
```

#### Iniciar la aplicación
```bash
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

## Correos de prueba para microservicio-Notificacines
pacientep26@gmail.com


## Características Clave
- **Accesibilidad**: Texto de 18px+, botones de 48px+, contraste WCAG AAA.
- **Búsqueda de Pacientes**: En el dashboard de admin, puedes buscar pacientes existentes por documento para agilizar el agendamiento.
- **Gestión de Especialidades**: Al crear un médico, puedes seleccionar la especialidad de una lista predefinida (Quiropraxia, Fisioterapia, etc.).
- **Alineación de Formularios**: Los formularios de agendamiento y registro están sincronizados (mismos campos de género y eliminación de fecha de nacimiento).
- **Arquitectura**: Preparada para evolucionar a microservicios/hexagonal.

---
© 2026 Piedrazul
