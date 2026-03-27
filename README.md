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

### 2. Configuración del Backend
Accede a la carpeta del servidor e instala las dependencias:
```bash
cd backend
npm install
```

#### Configuración de Variables de Entorno
Crea o edita el archivo `.env` en la carpeta `backend` con los datos de tu PostgreSQL:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña
DB_DATABASE=piedrazul
```

#### Inicializar Base de Datos (Seed)
Para tener datos de prueba (médicos y pacientes iniciales), ejecuta:
```bash
npx ts-node seed.ts
```

#### Iniciar el servidor
```bash
npm run start:dev
```
El servidor estará disponible en `http://localhost:3000`.

### 3. Configuración del Frontend
Accede a la carpeta de la aplicación cliente e instala las dependencias:
```bash
cd frontend
npm install
```

#### Iniciar la aplicación
```bash
npm start
```
La aplicación se abrirá en `http://localhost:4200`.

## Pruebas (Testing)

### Backend (Jest)
Ejecutar todos los tests:
```bash
cd backend
npm test
```

### Frontend (Vitest)
Ejecutar todos los tests:
```bash
cd frontend
npx vitest run
```

## Características Clave
- **Accesibilidad**: Texto de 18px+, botones de 48px+, contraste WCAG AAA.
- **Búsqueda de Pacientes**: En el dashboard de admin, puedes buscar pacientes existentes por documento para agilizar el agendamiento.
- **Gestión de Especialidades**: Al crear un médico, puedes seleccionar la especialidad de una lista predefinida (Quiropraxia, Fisioterapia, etc.).
- **Alineación de Formularios**: Los formularios de agendamiento y registro están sincronizados (mismos campos de género y eliminación de fecha de nacimiento).
- **Arquitectura**: Preparada para evolucionar a microservicios/hexagonal.

---
© 2026 Piedrazul
