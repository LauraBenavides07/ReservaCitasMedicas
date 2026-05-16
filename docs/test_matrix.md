# Matriz de Pruebas - Proyecto Piedrazul

Esta matriz define los casos de prueba críticos para asegurar la calidad del sistema de gestión de citas médicas, con enfoque en la accesibilidad para adultos mayores y la integridad de la arquitectura de microservicios.

## 1. Módulo de Citas (Agendador)

| ID | Funcionalidad | Nivel | Descripción del Caso de Prueba | Resultado Esperado |
|:---|:---|:---|:---|:---|
| CIT-01 | Listar citas | Unitaria | Consultar citas por médico y fecha válida. | Retorna lista de citas con datos del paciente. |
| CIT-02 | Crear cita | Integración | Crear cita en horario disponible enviando evento a RabbitMQ. | Cita guardada en DB y evento emitido correctamente. |
| CIT-03 | Validación | Unitaria | Intentar agendar con menos de 2 horas de antelación. | Error 400: "Debe agendar con al menos 2 horas". |
| CIT-04 | Disponibilidad | Integración | Intentar agendar en un horario ya ocupado. | Error 409: "Horario ocupado". |

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

### Pruebas de Integración (Microservicios)
- **Herramienta:** Supertest + RabbitMQ Test Client
- **Foco:** Flujo Backend -> RabbitMQ -> Notification Service.
