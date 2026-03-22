# Especificación de Requisitos - Sistema de Gestión de Citas Médicas

## Objetivo
Desarrollar un sistema web para la gestión de citas médicas enfocado en agendadores y profesionales de la salud, con especial atención a la usabilidad para adultos mayores (texto grande, alto contraste, navegación sencilla). El sistema debe permitir listar citas por médico y fecha, crear citas manualmente a partir de solicitudes por WhatsApp, y automatizar la recepción de citas vía WhatsApp así como el envío de recordatorios a los pacientes.

---

## Requisito 1: Listar citas por médico y fecha

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
- El tamaño mínimo de texto en toda la interfaz será de 18px.
- Los selectores y botones tendrán un área de clic mínima de 48x48 píxeles.
- Los colores de la tabla y los botones deben cumplir con contraste WCAG AAA (7:1 para texto normal).
- Los campos de búsqueda estarán claramente etiquetados y no dependerán únicamente de placeholders.

---

## Requisito 2: Crear cita desde contacto por WhatsApp (manual)

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

## Requisito adicional: Automatización de citas vía WhatsApp (Bot)

**Actor:** Paciente (a través de WhatsApp)

**Descripción:**  
Para facilitar la tarea de los agendadores y reducir la carga manual, se implementará un bot de WhatsApp que permita a los pacientes solicitar, confirmar o cancelar citas de forma automatizada. El bot interactúa mediante un flujo conversacional sencillo, diseñado para ser usado también por adultos mayores.

**Criterios de aceptación:**
- El bot está asociado a un número de WhatsApp corporativo.
- El paciente inicia la conversación y el bot presenta un menú con opciones principales: “Agendar cita”, “Consultar mis citas”, “Cancelar cita”, “Ayuda”.
- Flujo para agendar cita:
  1. Solicitar identificación del paciente (documento de identidad o número de celular).
  2. Verificar existencia del paciente en el sistema; si no existe, solicitar los datos básicos (nombres, apellidos, celular, género).
  3. Mostrar lista de médicos/terapistas disponibles.
  4. Preguntar por la fecha deseada.
  5. Mostrar los horarios disponibles para ese médico en esa fecha, según los intervalos configurados.
  6. Confirmar los datos de la cita y crear el registro en el sistema.
  7. Enviar mensaje de confirmación con los detalles.
- El bot debe manejar entradas inválidas de forma amigable y ofrecer la opción de reiniciar el flujo o hablar con un agente humano.
- Toda la comunicación debe quedar registrada en el sistema para trazabilidad.
- El bot debe cumplir con políticas de privacidad y manejo de datos personales.

---

## Requisito adicional: Servicio de recordatorios (WhatsApp / SMS)

**Actor:** Sistema (tarea programada)

**Descripción:**  
Para reducir el ausentismo, el sistema enviará automáticamente recordatorios de citas a los pacientes a través de WhatsApp (prioritario) o SMS (como alternativa). Los recordatorios se enviarán con la antelación configurable (ej. 24 horas antes de la cita).

**Criterios de aceptación:**
- El sistema ejecuta diariamente una tarea que recorre las citas programadas para el día siguiente.
- Para cada cita, se determina el medio de contacto preferido del paciente (WhatsApp si está disponible, SMS en caso contrario).
- Se envía un mensaje personalizado que incluye:
  - Nombre del paciente
  - Fecha y hora de la cita
  - Nombre del médico/terapista
  - Dirección o enlace a la ubicación (si aplica)
  - Instrucciones para confirmar o cancelar la cita (opcional)
- El mensaje debe ser claro, con tipografía legible y un tono amigable.
- Se debe registrar el envío (fecha, medio, estado) para auditoría.
- En caso de fallo en el envío (WhatsApp no disponible), se intenta por SMS. Si ambos fallan, se registra el error para revisión manual.
- El horario de envío debe respetar las franjas horarias permitidas (por ejemplo, no antes de las 8:00 a.m. ni después de las 8:00 p.m.).

---

## Consideraciones de usabilidad para adultos mayores

- **Tipografía:** Texto base mínimo 18px, con posibilidad de aumentar aún más mediante configuración del navegador.
- **Contraste:** Cumplimiento de WCAG 2.1 nivel AAA en todos los elementos interactivos y de texto.
- **Navegación:** Estructura simple, con menos de 3 niveles de profundidad. Botones grandes con iconos y texto.
- **Formularios:** Un solo campo por línea, etiquetas visibles permanentemente, mensajes de error claros y con sugerencias de solución.
- **Ayuda:** Acceso visible a una sección de ayuda con instrucciones en lenguaje sencillo y números de contacto de soporte.
- **Feedback:** Todas las acciones deben tener una respuesta visual inmediata (spinners, mensajes de éxito/error) y confirmación para acciones críticas (cancelar cita).

---

## Consideraciones técnicas generales (sin código)

- **Arquitectura:** Aplicación web responsiva que funcione correctamente en dispositivos móviles y de escritorio.
- **Rendimiento:** Cumplir con Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1).
- **Seguridad:** Autenticación y autorización para agendadores y médicos. Protección de datos personales según normativa aplicable (Ley de Protección de Datos).
- **Integración con WhatsApp:** Se utilizará la API oficial de WhatsApp Business (Cloud API) o un proveedor autorizado para garantizar la estabilidad y cumplimiento de políticas.
- **Escalabilidad:** La solución debe permitir añadir nuevos médicos/terapistas y modificar intervalos de tiempo sin intervención de desarrollo.

---

## Criterios de aceptación generales

- [ ] Todos los requisitos funcionales documentados han sido implementados y probados.
- [ ] La interfaz cumple con los estándares de accesibilidad para adultos mayores (pruebas con usuarios reales).
- [ ] El bot de WhatsApp puede agendar citas completas con un mínimo de intervención humana.
- [ ] Los recordatorios se envían correctamente según la programación establecida.
- [ ] El sistema maneja correctamente los conflictos de horarios y previene dobles reservas.
- [ ] Se cuenta con documentación de usuario y guías de uso para agendadores y médicos.