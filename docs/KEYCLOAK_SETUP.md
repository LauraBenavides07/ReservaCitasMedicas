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
5.  **Ajustes de Accesibilidad (Opcional pero recomendado para pacientes)**:
    *   Ve a **Realm Settings** -> pestaña **Login**.
    *   Asegúrate de que **Email as username** esté en **OFF**.
    *   Activa **Login with email** en **ON** (esto permite usar CC o Email indistintamente).
    *   *Si deseas que el Email no sea obligatorio:*
        *   Ve a **User Profile** (en el menú lateral).
        *   Haz clic en el atributo **email**.
        *   En la sección **Required**, desmarca las casillas o ponlo en **Off**.

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
2.  **Username**: Usa el número de cédula del paciente o el email del admin/médico.
    *   *Paciente*: `123456789`
    *   *Doctor*: `medico@piedrazul.com`
    *   *Admin*: `admin@piedrazul.com`
    La constraseña de todos es `123456`
3.  **Email, First Name, Last Name**: Rellena estos campos. El email es opcional para pacientes si seguiste el paso anterior, pero recomendado para administradores.
4.  Haz clic en **Create**.
5.  Ve a la pestaña **Credentials**.
6.  Haz clic en **Set password**.
7.  **⚠️ CRÍTICO**: Desactiva el interruptor **Temporary**. 
    *   *Razón*: Si está activado, Keycloak marcará el token como "Acción Requerida" (cambio de clave), y nuestro flujo híbrido actual no procesará esa redirección.
8.  Haz clic en **Save**.

---
## 6. Arquitectura de Integración (Identity Linking)
Para lograr una integración profesional y a prueba de errores de sincronización, el sistema implementa:

1. **Auto-Provisioning**: Cuando un paciente se registra desde el formulario de Angular, el backend utiliza la API de Administración de Keycloak (usando las credenciales de `master`) para crear el usuario en Keycloak de manera invisible.
2. **Lazy Identity Linking**: Una vez que el usuario ingresa (ya sea creado por el registro o a mano por el admin), el backend extrae el UUID (`sub`) proporcionado por Keycloak y lo guarda en la base de datos PostgreSQL en la columna `keycloak_id`.
3. **Validación Estricta**: Todas las consultas protegidas (como "Mis Citas") resuelven la identidad usando estrictamente el `keycloak_id`, garantizando que el cruce de datos sea 100% exacto.

---
*Nota: El backend de NestJS ya está configurado para buscar Keycloak en el puerto 8080. Si necesitas usar otro puerto, actualiza la variable `KEYCLOAK_URL` en el archivo `.env`.*
