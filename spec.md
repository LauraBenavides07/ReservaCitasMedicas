# Especificación de Requisitos - Sistema de Gestión de Citas Médicas

## Prioridades de Implementación
1. **Requisitos 1 y 2** (funcionalidades base para agendadores)
2. **Requisitos 3 y 4** (autogestión del paciente y configuración del sistema)
3. **Requisitos adicionales** (bot de WhatsApp y recordatorios)

---

## Requisito 1: Listar citas por médico y fecha (Prioridad 1)

**Actor:** Agendador de citas

**Descripción:**  
El agendador necesita consultar las citas programadas para un médico o terapista específico en una fecha determinada. Los resultados deben presentarse en una tabla que muestre el detalle de cada cita y el número total de citas encontradas.

**Criterios de aceptación:**
- El sistema ofrece un selector de médico/terapista con los nombres de los profesionales disponibles.
- El sistema ofrece un selector de fecha (calendario visual) para elegir el día a consultar.
- Al realizar la búsqueda, se muestra una tabla con las siguientes columnas:
  - Hora de la cita
  - Nombre del paciente
  - Número de documento
  - Teléfono de contacto
  - Estado de la cita (agendada, confirmada, cancelada, etc.)
- Se muestra de forma destacada el total de citas encontradas para la combinación médico/fecha.
- Si no hay citas, se muestra un mensaje claro indicando que no hay resultados.
- La tabla permite ordenar por hora de forma ascendente/descendente (por defecto ascendente).
- Cada fila incluye acciones como ver detalle o cancelar la cita (con confirmación previa).

**Consideraciones de UX para adultos mayores:**
- Tamaño mínimo de texto: 18px.
- Área de clic mínima: 48x48 píxeles.
- Contraste WCAG AAA (7:1 para texto normal).
- Campos claramente etiquetados, sin depender de placeholders.

---

## Requisito 2: Crear cita desde contacto por WhatsApp (Prioridad 1)

**Actor:** Agendador de citas

**Descripción:**  
Cuando un paciente contacta al centro médico por WhatsApp solicitando una cita, el agendador debe poder registrar rápidamente al paciente y asignarle una cita con el médico o terapista correspondiente, respetando los intervalos de tiempo configurados para cada profesional.

**Datos a capturar:**

*Datos del paciente (obligatorios):*
- Número de documento de identidad
- Nombres
- Apellidos
- Celular
- Género (Hombre, Mujer, Otro)

*Datos del paciente (opcionales):*
- Fecha de nacimiento
- Correo electrónico

*Datos de la cita:*
- Médico/terapista
- Hora de la cita

**Criterios de aceptación:**
- El formulario de creación de cita presenta todos los campos requeridos con etiquetas visibles.
- El campo “Médico/terapista” es un selector que lista los profesionales disponibles.
- Al seleccionar un profesional, el campo “Hora” se habilita mostrando únicamente los horarios disponibles según:
  - El intervalo de tiempo configurado para ese profesional (ej. 30 minutos entre citas).
  - El horario laboral del profesional (inicio y fin de jornada).
  - Las citas ya reservadas en la fecha seleccionada.
- El sistema valida que no exista una cita ya asignada en el mismo horario para el mismo profesional.
- Una vez completado el formulario, el agendador confirma la creación. El sistema guarda los datos del paciente (si no existía previamente) y la cita.
- Se muestra una pantalla de confirmación con los datos de la cita registrada.
- Opcionalmente, se ofrece la posibilidad de enviar un mensaje de confirmación al paciente por WhatsApp desde el mismo sistema.

**Intervalos de tiempo:**
Cada médico/terapista debe tener una configuración que defina:
- Duración estándar por cita (en minutos).
- Horario de inicio y fin de jornada.
- Posibles bloques de descanso (ej. almuerzo).
- Días de atención.

El sistema calculará automáticamente los bloques disponibles en función de estas reglas y las citas ya existentes.

---

## Requisito 3: Autogestión de citas por parte del paciente vía web (Prioridad 2)

**Actor:** Paciente

**Descripción:**  
El paciente debe poder agendar, consultar y cancelar sus citas a través de una interfaz web, sin necesidad de usar WhatsApp. Para ello, debe registrarse en el sistema y autenticarse. El sistema mostrará las franjas horarias disponibles según la configuración de cada médico/terapista.

**Criterios de aceptación:**

### 3.1 Registro y autenticación
- El paciente puede crear una cuenta proporcionando:
  - Número de documento de identidad (obligatorio, único)
  - Nombres y apellidos
  - Celular
  - Género
  - Fecha de nacimiento (opcional)
  - Correo electrónico (opcional, usado para recuperación)
  - Contraseña (mínimo 8 caracteres, segura)
- Se valida que el documento no esté registrado previamente.
- Opcional: verificación de celular mediante código SMS/WhatsApp para confirmar identidad.
- El paciente inicia sesión con documento o correo y contraseña.
- La interfaz de autenticación mantiene los estándares de accesibilidad (texto grande, botones amplios).

### 3.2 Agendar cita autónoma
- Una vez autenticado, el paciente puede seleccionar “Agendar nueva cita”.
- Se muestra un flujo simplificado:
  1. Seleccionar médico/terapista de una lista.
  2. Seleccionar una fecha dentro de la ventana de tiempo configurada por el administrador (ver Requisito 4).
  3. El sistema muestra los horarios disponibles para ese médico/terapista en la fecha seleccionada, calculados según la configuración de jornada, intervalos y citas existentes.
  4. El paciente selecciona una hora y confirma.
- El sistema valida que el horario continúe disponible al momento de la confirmación (control de concurrencia).
- Una vez agendada, se muestra un resumen de la cita y se envía una confirmación por correo electrónico o WhatsApp (según preferencia del paciente).

### 3.3 Consulta y cancelación de citas
- El paciente puede ver en su panel las citas futuras y pasadas.
- Cada cita futura tiene la opción de cancelación. Al cancelar, se solicita confirmación y se libera el horario.
- Se registra la cancelación con motivo opcional.
- El paciente no puede cancelar citas dentro de un tiempo límite antes de la cita (ej. menos de 2 horas), debiendo contactar al centro por otros medios.

**Seguridad:**
- Las sesiones deben expirar por inactividad.
- La información personal del paciente debe estar protegida.

---

## Requisito 4: Configuración de parámetros del sistema (Prioridad 2)

**Actor:** Administrador del sistema

**Descripción:**  
El administrador debe poder configurar los parámetros que determinan la disponibilidad de los médicos y terapistas, permitiendo que el agendamiento autónomo (Requisito 3) y el manual (Requisito 2) funcionen correctamente según las reglas de negocio de Piedrazul.

**Criterios de aceptación:**

### 4.1 Ventana de tiempo para agendamiento
- El administrador define una “ventana de agendamiento” expresada en semanas (ej. 4 semanas).
- Los pacientes no pueden agendar citas más allá de la fecha límite = fecha actual + ventana de semanas.
- Los agendadores (Requisitos 1 y 2) pueden agendar sin restricción de ventana (o con una ventana mayor configurable).

### 4.2 Configuración por médico/terapista
- Para cada profesional, el administrador puede configurar:
  - **Días de atención**: selección de días de la semana (lunes a domingo).
  - **Franja horaria por día**: hora de inicio y hora de fin (ej. 08:00 – 12:00, 14:00 – 18:00). Pueden definirse múltiples bloques por día (mañana/tarde).
  - **Intervalo entre citas**: duración en minutos (ej. 30 min). Define la separación entre slots.
  - **Descansos**: bloques de tiempo dentro de la jornada donde no se agendan citas (ej. almuerzo de 12:00 a 14:00).
- La configuración puede aplicarse a días específicos o ser recurrente semanal.
- Opcionalmente, se pueden definir excepciones (días no laborables, horarios especiales) con prioridad sobre la configuración regular.

### 4.3 Visualización y validación
- El administrador puede ver una vista previa de los horarios disponibles para cada profesional tras aplicar la configuración.
- El sistema debe validar que no haya conflictos (ej. fin de jornada antes de inicio, duración negativa, intervalos inconsistentes).
- Todos los cambios deben registrarse en un log de auditoría.

---

## Requisitos adicionales (Posteriores a implementación de 1-4)

### Adicional A: Automatización de citas vía WhatsApp (Bot)

**Actor:** Paciente (a través de WhatsApp)

**Descripción:**  
Un bot de WhatsApp permitirá a los pacientes agendar, consultar y cancelar citas mediante conversación guiada, reduciendo la carga manual de los agendadores.

**Criterios de aceptación:**
- El bot está integrado con la API oficial de WhatsApp Business.
- Flujo conversacional con menú de opciones: agendar, consultar, cancelar, ayuda.
- Para agendar: identifica al paciente (documento o celular), verifica/registra datos básicos, selecciona médico, fecha y hora dentro de la ventana de agendamiento, y confirma.
- El bot respeta la configuración de disponibilidad (días, franjas, intervalos, ventana) y valida horarios ocupados.
- Maneja errores y ofrece opción de transferencia a agente humano.

### Adicional B: Servicio de recordatorios (WhatsApp / SMS)

**Actor:** Sistema (tarea programada)

**Descripción:**  
El sistema envía recordatorios automáticos a los pacientes antes de sus citas para reducir ausentismo.

**Criterios de aceptación:**
- Tarea diaria que envía recordatorios a citas del día siguiente (antelación configurable).
- Prioriza WhatsApp; si falla, usa SMS.
- Mensaje incluye: paciente, fecha, hora, médico, dirección.
- Registro de envíos para auditoría.
- No envía en horarios restringidos (ej. antes de 8:00 o después de 20:00).

---

## Consideraciones transversales de accesibilidad para adultos mayores

- **Tipografía:** Texto base mínimo 18px; posibilidad de aumentar mediante configuración del navegador.
- **Contraste:** Cumplir WCAG 2.1 nivel AAA en toda la interfaz.
- **Navegación:** Estructura simple, menos de 3 niveles de profundidad. Botones grandes con iconos y texto.
- **Formularios:** Un solo campo por línea, etiquetas visibles permanentemente, mensajes de error claros.
- **Ayuda:** Acceso visible a ayuda en lenguaje sencillo y número de contacto.
- **Feedback:** Indicadores visuales inmediatos para acciones (carga, éxito, error) y confirmación para acciones críticas.

---

## Consideraciones técnicas generales (sin código)

- **Arquitectura:** Aplicación web responsiva, funcional en móviles y escritorio.
- **Rendimiento:** Cumplir con Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1.
- **Seguridad:** Autenticación y autorización. Protección de datos personales según normativa.
- **Integración WhatsApp:** Usar API oficial de WhatsApp Business (Cloud API).
- **Escalabilidad:** Permitir agregar profesionales y modificar parámetros sin desarrollo.

---

## Criterios de aceptación generales por fase

### Fase 1 (Requisitos 1 y 2)
- [ ] El agendador puede listar citas por médico y fecha.
- [ ] El agendador puede crear citas manualmente desde formulario, respetando intervalos y evitando duplicados.
- [ ] La interfaz cumple con los estándares de accesibilidad para adultos mayores.

### Fase 2 (Requisitos 3 y 4)
- [ ] El paciente puede registrarse, autenticarse y agendar citas por web con horarios disponibles según configuración.
- [ ] El administrador puede configurar ventana de agendamiento, días, franjas e intervalos por profesional.
- [ ] Se mantiene la accesibilidad en todas las nuevas pantallas.

### Fase 3 (Requisitos adicionales)
- [ ] El bot de WhatsApp permite agendar citas completas.
- [ ] El sistema envía recordatorios automáticos de citas.
- [ ] Se registran interacciones y envíos para trazabilidad.