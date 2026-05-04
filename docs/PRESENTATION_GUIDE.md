# Guion de Presentación: Evolución del Sistema Piedrazul

Este documento sirve como guía para explicar las nuevas funcionalidades y la arquitectura del sistema de gestión de citas médicas.

---

## 1. Microservicio de Notificaciones (`notification-service`)
**Qué decir:**
> "Para garantizar la escalabilidad y confiabilidad, hemos separado las notificaciones en un microservicio independiente. Utilizamos una arquitectura dirigida por eventos (Event-Driven) con **RabbitMQ**. Esto significa que cuando se crea una cita, el backend principal no se detiene a enviar el mensaje; simplemente lanza un 'evento' a la cola y el servicio de notificaciones lo procesa de forma asíncrona."

**Qué mostrar:**
- **Configuración del Cliente:** [backend/src/infrastructure/messaging/notifications-client.module.ts](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/backend/src/infrastructure/messaging/notifications-client.module.ts)
- **Emisión del Evento:** [backend/src/application/services/appointment.service.ts](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/backend/src/application/services/appointment.service.ts) (Línea ~150, método `create`).
- **Lógica del Microservicio:** Carpeta `notification-service/src/notifications/`. Muestra cómo el `notifications.controller.ts` escucha los eventos.

---

## 2. Exportación de Citas a Excel (CSV)
**Qué decir:**
> "Entendemos que los médicos necesitan gestionar su tiempo incluso fuera del sistema. Por ello, añadimos una funcionalidad para descargar la agenda del día en un formato compatible con Excel. Utilizamos la librería `json2csv` para generar archivos con codificación UTF-8, asegurando que los caracteres especiales se vean correctamente."

**Qué mostrar:**
- **Servicio de Exportación:** [backend/src/application/services/appointment.service.ts](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/backend/src/application/services/appointment.service.ts) (Método `exportAppointmentsByDateAndDoctor`).
- **Endpoint del Controlador:** [backend/src/presentation/controllers/doctor.controller.ts](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/backend/src/presentation/controllers/doctor.controller.ts).

---

## 3. Pruebas Unitarias y Calidad
**Qué decir:**
> "La estabilidad del sistema está respaldada por una suite de pruebas unitarias. Hemos cubierto reglas críticas como la anticipación mínima de 2 horas para citas y la prevención de cruces de horarios. Estas pruebas están integradas en nuestro flujo de CI/CD para asegurar que ningún cambio nuevo rompa lo que ya funciona."

**Qué mostrar:**
- **Suite de Pruebas:** [backend/src/application/services/appointment.service.spec.ts](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/backend/src/application/services/appointment.service.spec.ts).
- **Mocks Profesionales:** Señala cómo simulamos los repositorios y el servicio de notificaciones para probar la lógica en aislamiento.

---

## 4. Integración con Keycloak
**Qué decir:**
> "Para la seguridad, implementamos **Keycloak**, un sistema de gestión de identidades de código abierto. Esto nos permite manejar el inicio de sesión de forma centralizada y segura. Además, realizamos un 'Identity Linking' para sincronizar los usuarios de Keycloak con nuestra base de datos local mediante el `keycloakId`."

**Qué mostrar:**
- **Lógica de Sincronización:** [backend/src/application/services/auth.service.ts](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/backend/src/application/services/auth.service.ts) (Busca el uso de `keycloakId`).
- **Documentación de Setup:** [docs/KEYCLOAK_SETUP.md](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/docs/KEYCLOAK_SETUP.md).

---

## 5. UX Mobile-First y Accesibilidad
**Qué decir:**
> "Nuestra prioridad son los adultos mayores. Por eso, el diseño es 'Mobile-First' y cumple con estándares de accesibilidad WCAG. Hemos establecido una tipografía base de 18px para facilitar la lectura y aseguramos que todos los elementos interactivos tengan un área de contacto de al menos 48px, ideal para pantallas táctiles."

**Qué mostrar:**
- **Tokens de Diseño:** [frontend/src/styles.css](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/frontend/src/styles.css) (Líneas 21 y 40).
- **Layout Responsivo:** Muestra el uso de variables CSS para mantener la consistencia en toda la aplicación.
