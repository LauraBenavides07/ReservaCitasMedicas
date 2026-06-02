# Piedrazul - Backend

Este es el backend del sistema de gestión de citas médicas **Piedrazul**, construido con **NestJS**, **PostgreSQL** y **Keycloak**.

## Instalación y Configuración

> **Importante**: Este proyecto utiliza `pnpm`. No utilices `npm`.

```bash
# Instalar dependencias
pnpm install
```

## Levantar el proyecto

Para iniciar el servidor en modo desarrollo:

```bash
pnpm run start:dev
```

Para cargar datos iniciales en la base de datos (asegúrate de tener PostgreSQL y Keycloak corriendo, ver README principal):

```bash
npx ts-node seed.ts
```

## Pruebas

Para ejecutar las pruebas unitarias con **Jest**:

```bash
pnpm test
```

> Para más detalles sobre la configuración de Docker y Keycloak, por favor consulta el `README.md` principal en la raíz del proyecto.
