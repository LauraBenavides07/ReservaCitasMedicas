# Piedrazul - Sistema de Gestión de Citas Médicas

Este proyecto es una aplicación web para la gestión de citas médicas, diseñada específicamente para ser accesible para adultos mayores. Cuenta con un backend en NestJS y un frontend SPA en Angular.

## Tecnologías

- **Frontend**: Angular 17/18+ (Standalone Components, Signals).
- **Backend**: NestJS (monolito en capas, TypeORM, SQLite).
- **Estilo**: CSS Vanilla enfocado en accesibilidad (WCAG AAA).

## Cómo iniciar el proyecto

### 1. Requisitos previos
- Node.js (versión 18 o superior)
- npm

### 2. Configuración del Backend
Accede a la carpeta del servidor e instala las dependencias:
```bash
cd backend
npm install
```

#### Inicializar Base de Datos (Seed)
Para tener datos de prueba (médicos y pacientes iniciales), ejecuta:
```bash
node manual_seed.js
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

## Características Clave
- **Accesibilidad**: Texto de 18px+, botones de 48px+, contraste WCAG AAA.
- **SPA**: Transiciones fluidas sin recarga de página.
- **Gestión Manual**: Registro rápido de citas desde contacto WhatsApp.
- **Arquitectura**: Preparada para evolucionar a microservicios/hexagonal.

---
© 2026 Piedrazul
