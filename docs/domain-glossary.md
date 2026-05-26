# Glosario del Dominio — Piedrazul

| Término | Definición |
|---------|------------|
| **Agendada** | Estado inicial de una cita. Significa que el turno fue reservado pero aún no confirmado por el médico/staff. Puede cancelarse o reagendarse. |
| **Cita** | Turno médico que asigna un paciente a un doctor en una fecha y hora específicas. Es la entidad central del sistema. |
| **Confirmada** | Estado intermedio: el médico o staff validó la cita. Ya no puede ser modificada por el paciente, pero sí por staff. |
| **Completada** | Estado terminal: la cita se realizó. El médico puede registrar observaciones y diagnóstico. No admite más cambios. |
| **Cancelada** | Estado terminal: la cita fue anulada antes de realizarse. No admite más cambios. |
| **Slot** | Bloque de tiempo disponible en la agenda de un médico. Ej: si el médico trabaja 08:00–18:00 con slot de 30min, los slots son 08:00, 08:30, …, 17:30. |
| **Duración de Slot** | Minutos por turno (ej: 30, 20, 15). Configurable por médico. |
| **Días Activos** | Días de la semana en que el médico atiende. Array de enteros 1=lunes…7=domingo. Default: `[1,2,3,4,5]`. |
| **Excepción de Agenda** | Bloqueo manual de un día específico para un médico (vacaciones, capacitación, licencia). Anula todos los slots de esa fecha. |
| **Reagendar** | Cambiar la fecha y/o hora de una cita existente. Genera un registro en el historial con los valores anteriores y nuevos. |
| **Ventana de Tiempo** | Config global que define cuántas horas mínimo antes se puede agendar (`minAdvanceHours`) y cuántos días máximo hacia adelante (`appointmentWindowDays`). |
| **Auditoría** | Registro inmutable de todos los cambios sobre una cita: creación, confirmación, cancelación, reagendamiento, completado. Cada entrada guarda quién, cuándo, qué cambió (valor anterior → nuevo). |
| **Auto-Provisioning** | Proceso automático que crea un usuario en Keycloak cuando un paciente se registra en el sistema. Si Keycloak falla, el registro continúa igual (tolerancia a fallo). |
| **Paciente** | Persona que agenda citas. Se identifica por documento único. Puede registrarse y autogestionarse vía web. |
| **Médico** | Profesional de la salud que atiende citas. Tiene horarios configurables y especialidad. |
| **Staff** | Personal administrativo que agenda citas para pacientes, confirma, reagenda y cancela. |
| **Admin** | Rol con acceso total: CRUD de médicos, configuración global, auditoría. |
| **Agendador** (Staff) | Sinónimo de Staff. Persona que opera el sistema desde la clínica para gestionar turnos. |
| **Autogestión** | Capacidad del paciente de agendar, ver, reagendar y cancelar sus propias citas sin intervención de staff. |
| **JWT** | Token de autenticación firmado localmente por el backend (fallback cuando Keycloak no está disponible). |
| **OIDC** | OpenID Connect. Protocolo de autenticación usado por Keycloak. |
| **Top Layer** | Capa superior del navegador donde se renderizan los `<dialog>` nativos. Está por encima de cualquier `z-index` de CSS. |
| **Workspace** | Estructura de monorepo con pnpm que agrupa backend, frontend y notification-service. |
| **Notificación** | Mensaje enviado al paciente (email o WhatsApp) cuando ocurre un evento: cita creada, cancelada, recordatorio. |
| **Evento** | Mensaje publicado en RabbitMQ cuando ocurre una acción de negocio (cita creada, cancelada, recordatorio). El notification service lo consume. |
