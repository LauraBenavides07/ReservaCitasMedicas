# Matriz de Pruebas - Proyecto Piedrazul

Esta matriz define los casos de prueba críticos para asegurar la calidad del sistema de gestión de citas médicas, con enfoque en la accesibilidad para adultos mayores y la integridad de la arquitectura de microservicios.

## 1. Módulo de Citas (Agendador)

| ID | Funcionalidad | Nivel | Descripción del Caso de Prueba | Resultado Esperado |
|:---|:---|:---|:---|:---|
| CIT-01 | Listar citas | Unitaria | Consultar citas por médico y fecha válida. | Retorna lista de citas con datos del paciente. |
| CIT-02 | Crear cita | E2E | POST /appointments con paciente existente y slot libre. | Cita creada con status `agendada` y datos correctos. |
| CIT-03 | Validación | Unitaria | Intentar agendar con menos de 2 horas de antelación. | Error 400: "Debe agendar con al menos 2 horas". |
| CIT-04 | Slot ocupado | E2E | POST /appointments en un horario ya reservado. | Error 409: Conflicto de horario. |
| CIT-05 | Disponibilidad | E2E | GET /appointments/available-slots con doctorId y fecha. | Array de slots en formato `HH:mm`. |
| CIT-06 | Listar por doctor | E2E | GET /appointments?doctorId=&date= | Respuesta con `appointments[]` y `total`. |
| CIT-07 | Crear paciente automático | E2E | POST /appointments con documento nuevo. | Paciente creado en tabla `patients`. |
| CIT-08 | Listar todas | E2E | GET /appointments/all | Array de citas. |
| CIT-09 | Estadísticas | E2E | GET /appointments/stats | Respuesta con `stats` y `doctorStats`. |
| CIT-10 | Confirmar cita | E2E | PATCH /appointments/:id/confirm | Status cambia a `confirmada`. |

## 2. Búsqueda y Registro de Pacientes

| ID | Funcionalidad | Nivel | Descripción del Caso de Prueba | Resultado Esperado |
|:---|:---|:---|:---|:---|
| PAC-01 | Búsqueda | Unitaria | Buscar paciente por documento existente. | Retorna datos del paciente (Nombre, Teléfono). |
| PAC-02 | Autoregistro | E2E | Paciente se registra desde la web y el usuario se crea en Keycloak. | Usuario funcional en Keycloak y perfil en DB. |
| PAC-03 | Consistencia | Integración | Crear cita para paciente nuevo. | El paciente se crea automáticamente en la tabla `patients`. |

## 3. Microservicio de Notificaciones

| ID | Funcionalidad | Nivel | Descripción del Caso de Prueba | Resultado Esperado |
|:---|:---|:---|:---|:---|
| NOT-01 | Consumo RMQ | Integración | Enviar evento `appointment.created` desde el backend. | Microservicio recibe evento y genera log de envío. |
| NOT-02 | Template | Unitaria | Generar mensaje para adulto mayor. | Mensaje con texto claro, iconos y fecha en español. |
| NOT-03 | Persistencia | Integración | Verificar guardado de log en `notifications_db`. | Registro visible en la tabla `notificaciones` (puerto 5433). |

## 4. Accesibilidad (Adultos Mayores)

| ID | Funcionalidad | Nivel | Descripción del Caso de Prueba | Resultado Esperado |
|:---|:---|:---|:---|:---|
| ACC-01 | Visual | Manual/UI | Verificar tamaño de fuente en botones y textos. | Fuente ≥ 18px y contraste WCAG AAA. |
| ACC-02 | Touch | Manual/UI | Verificar áreas de toque en móviles. | Botones con altura mínima de 48px. |
| ACC-03 | Mensajes | Manual/UI | Verificar claridad de mensajes de error. | Lenguaje sencillo, no técnico, indicando qué hacer. |

---

## Estrategia de Ejecución

### Pruebas Unitarias (Backend)
- **Herramienta:** Jest
- **Comando:** `cd backend && npm test`
- **Foco:** Servicios de lógica de negocio y validaciones.

### Pruebas Unitarias/Componentes (Frontend)
- **Herramienta:** Vitest
- **Comando:** `cd frontend && npx vitest run`
- **Foco:** Signals de Angular, validación de formularios y visualización.

### Pruebas de Integración E2E (API REST)
- **Herramienta:** Supertest + PostgreSQL real
- **Comando:** `cd backend && npx jest --config test/jest-e2e.json`
- **Base de datos:** `piedrazul_test` (limpia antes de cada test via TRUNCATE CASCADE)
- **Foco:** Flujo completo de la API REST (doctores, citas, configuración)
- **DB:** `piedrazul_test`, PostgreSQL real, `synchronize: true` para esquema automático

## 5. API REST — Pruebas de Integración (E2E)

### Doctores CRUD
| ID | Funcionalidad | Ruta | Resultado Esperado |
|:---|:---|:---|:---|
| DOC-01 | Listar doctores | GET /doctors | Array con al menos 1 doctor |
| DOC-02 | Obtener doctor | GET /doctors/:id | Datos del doctor |
| DOC-03 | Doctor no existe | GET /doctors/:id | 404 |
| DOC-04 | Crear doctor | POST /doctors | 201, doctor creado con id |
| DOC-05 | Actualizar doctor | PATCH /doctors/:id | Especialidad actualizada en DB |
| DOC-06 | Eliminar doctor sin citas | DELETE /doctors/:id | 200, registro eliminado |
| DOC-07 | Eliminar doctor con citas | DELETE /doctors/:id | 400, error por citas activas |

### Excepciones de Doctor
| ID | Funcionalidad | Ruta | Resultado Esperado |
|:---|:---|:---|:---|
| EXC-01 | Agregar excepción | POST /doctors/:id/exceptions | 201 |
| EXC-02 | Listar excepciones | GET /doctors/:id/exceptions | Array con excepción creada |
| EXC-03 | Eliminar excepción | DELETE /doctors/exceptions/:excId | 200 |

### Configuración
| ID | Funcionalidad | Ruta | Resultado Esperado |
|:---|:---|:---|:---|
| CFG-01 | Obtener config | GET /configs | `{ minAdvanceHours: 2, appointmentWindowDays: 15 }` |
| CFG-02 | Actualizar config | PATCH /configs | Valores actualizados en respuesta |
