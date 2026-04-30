# 🔑 Configuración de Keycloak - Proyecto Piedrazul

Este documento sirve de guía para que todo el equipo de desarrollo pueda configurar su entorno local de identidad de manera idéntica.

## 1. Requisitos Previos
- Tener **Docker** instalado y funcionando.

## 2. Iniciar el Servidor de Keycloak
Para asegurar que todos usemos la misma versión y configuración, ejecuta el siguiente comando en tu terminal:

```powershell
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

*   **Acceso**: [http://localhost:8080/admin](http://localhost:8080/admin)
*   **Usuario**: `admin`
*   **Contraseña**: `admin`

## 3. Configuración del Realm (Espacio de Trabajo)
1.  Haz clic en el selector de Realms (arriba a la izquierda, donde dice `master`).
2.  Haz clic en **Create Realm**.
3.  **Realm name**: `piedrazul` (debe ser exacto al nombre en el código de NestJS).
4.  Haz clic en **Create**.

## 4. Configuración del Client (Conexión con la App)
1.  Asegúrate de estar en el Realm `piedrazul`.
2.  Ve a **Clients** -> **Create client**.
3.  **General Settings**:
    *   **Client type**: `OpenID Connect`
    *   **Client ID**: `piedrazul-app`
4.  **Capability Config (MUY IMPORTANTE)**:
    *   **Client authentication**: `Off`
    *   **Authentication flow**: Activa **Direct access grants** (esto permite que el backend valide credenciales directamente).
5.  **Login Settings**:
    *   **Valid redirect URIs**: `*` (o `http://localhost:4200/*`)
    *   **Web origins**: `*` (o `http://localhost:4200`)
6.  Haz clic en **Save**.

## 5. Creación de Usuarios para Pruebas
1.  Ve a **Users** -> **Add user**.
2.  **Username**: Usa un identificador (ej: número de cédula del paciente).
3.  Haz clic en **Create**.
4.  Ve a la pestaña **Credentials**.
5.  Haz clic en **Set password**.
6.  **⚠️ CRÍTICO**: Desactiva el interruptor **Temporary**. 
    *   *Razón*: Si está activado, Keycloak marcará el token como "Acción Requerida" (cambio de clave), y nuestro flujo híbrido actual no procesará esa redirección, resultando en un error de login.
7.  Haz clic en **Save**.

---
*Nota: El backend de NestJS ya está configurado para buscar Keycloak en el puerto 8080. Si necesitas usar otro puerto, actualiza la variable `KEYCLOAK_URL` en el archivo `.env`.*
