# Guion de Presentación: Evolución del Sistema Piedrazul

Este documento sirve como guía para explicar las nuevas funcionalidades y la arquitectura del sistema de gestión de citas médicas.

---

## 1. Microservicio de Notificaciones (`notification-service`)
**Qué decir:**
> "Para garantizar la escalabilidad y confiabilidad, hemos separado las notificaciones en un microservicio independiente. Utilizamos una arquitectura dirigida por eventos (Event-Driven) con **RabbitMQ**. Esto significa que cuando se crea una cita, el backend principal no se detiene a enviar el mensaje; simplemente lanza un 'evento' a la cola y el servicio de notificaciones lo procesa de forma asíncrona."

**Qué mostrar y explicar:**
- **Configuración del Cliente:** [backend/src/infrastructure/messaging/notifications-client.module.ts](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/backend/src/infrastructure/messaging/notifications-client.module.ts)
  - *Explicación:* Aquí definimos la conexión con RabbitMQ y el nombre de la cola (`notifications_queue`). Es el "puente" que permite al backend hablar con el microservicio.
- **Emisión del Evento:** [backend/src/application/services/appointment.service.ts](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/backend/src/application/services/appointment.service.ts) (Método `create` y `cancelAppointment`).
  - *Explicación:* Muestra el uso de `this.notificationClient.emit('appointment.created', ...)`. Destaca que el backend lanza el evento y continúa su ejecución sin esperar, mejorando el tiempo de respuesta al usuario.
- **Lógica del Microservicio:** [notification-service/src/notifications/notifications.controller.ts](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/notification-service/src/notifications/notifications.controller.ts)
  - *Explicación:* Muestra el decorador `@EventPattern`. Aquí es donde el microservicio "escucha" y procesa los datos para, por ejemplo, enviar un mensaje de WhatsApp.

---

## 2. Exportación de Citas a Excel (CSV)
**Qué decir:**
> "Entendemos que los médicos necesitan gestionar su tiempo incluso fuera del sistema. Por ello, añadimos una funcionalidad para descargar la agenda del día en un formato compatible con Excel. Utilizamos la librería `json2csv` para generar archivos con codificación UTF-8, asegurando que los caracteres especiales se vean correctamente."

**Qué mostrar y explicar:**
- **Servicio de Exportación:** [backend/src/application/services/appointment.service.ts](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/backend/src/application/services/appointment.service.ts) (Método `exportAppointmentsByDateAndDoctor`).
  - *Explicación:* La lógica que transforma los objetos de la base de datos en filas de texto. Usamos un delimitador de punto y coma (`;`) porque es el estándar que Excel reconoce automáticamente en nuestra región.
- **Endpoint del Controlador:** [backend/src/presentation/controllers/doctor.controller.ts](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/backend/src/presentation/controllers/doctor.controller.ts).
  - *Explicación:* El endpoint que expone la funcionalidad. Se encarga de enviar el archivo con las cabeceras HTTP correctas para que el navegador lo descargue automáticamente.

---

## 3. Pruebas Unitarias y Calidad
**Qué decir:**
> "La estabilidad del sistema está respaldada por una suite de pruebas unitarias. Hemos cubierto reglas críticas como la anticipación mínima de 2 horas para citas y la prevención de cruces de horarios. Estas pruebas están integradas en nuestro flujo de CI/CD para asegurar que ningún cambio nuevo rompa lo que ya funciona."

**Qué mostrar y explicar:**
- **Suite de Pruebas:** [backend/src/application/services/appointment.service.spec.ts](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/backend/src/application/services/appointment.service.spec.ts).
  - *Explicación:* Muestra los casos de prueba (`it('debería...')`). Destaca que probamos escenarios de error (como intentar agendar con poca anticipación) para garantizar que las reglas de negocio se cumplan siempre.
- **Uso de Mocks:**
  - *Explicación:* Explica cómo "simulamos" la base de datos y el servicio de notificaciones. Esto permite probar la lógica del servicio de citas sin necesidad de tener una base de datos real encendida, lo que hace las pruebas extremadamente rápidas.

---

## 4. Integración con Keycloak
**Qué decir:**
> "Para la seguridad, implementamos **Keycloak**, un sistema de gestión de identidades de código abierto. Esto nos permite manejar el inicio de sesión de forma centralizada y segura. Además, realizamos un 'Identity Linking' para sincronizar los usuarios de Keycloak con nuestra base de datos local mediante el `keycloakId`."

**Qué mostrar y explicar:**
- **Lógica de Sincronización:** [backend/src/application/services/auth.service.ts](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/backend/src/application/services/auth.service.ts).
  - *Explicación:* Muestra cómo vinculamos el UUID de Keycloak con nuestra entidad de `User`/`Patient`. Esto permite que el usuario se autentique externamente pero conserve su historial médico internamente.
- **Documentación de Setup:** [docs/KEYCLOAK_SETUP.md](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/docs/KEYCLOAK_SETUP.md).
  - *Explicación:* Es nuestra "biblia" de configuración. Detalla los roles, clientes y flujos necesarios para que Keycloak funcione con Angular y NestJS.

---

## 5. UX Mobile-First y Accesibilidad
**Qué decir:**
> "Nuestra prioridad son los adultos mayores. Por eso, el diseño es 'Mobile-First' y cumple con estándares de accesibilidad WCAG. Hemos establecido una tipografía base de 18px para facilitar la lectura y aseguramos que todos los elementos interactivos tengan un área de contacto de al menos 48px, ideal para pantallas táctiles."

**Qué mostrar y explicar:**
- **Tokens de Diseño:** [frontend/src/styles.css](file:///d:/universidad/Software%20III/piedrazul/ReservaCitasMedicas/frontend/src/styles.css).
  - *Explicación:* Señala las variables CSS (`--primary-color`, etc.) y el tamaño de fuente global. Esto garantiza que toda la app se vea coherente y sea legible.
- **Accesibilidad en Botones:**
  - *Explicación:* Muestra la regla CSS que obliga a que los botones midan al menos 48px. Esto evita que los usuarios con dificultades motoras o dedos grandes pulsen el botón equivocado en el móvil.
