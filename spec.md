# Especificación de Requisitos - Sistema de Gestión de Citas Médicas

## Prioridades de Implementación
1. **Requisitos 1 y 2** (funcionalidades base para agendadores)
2. **Requisitos 3, 4 y 5** (autogestión, configuración y exportación)
3. **Requisitos adicionales** (bot de WhatsApp y recordatorios)

---

## Requisito 1: Listar citas por médico y fecha (Prioridad 1)

**Actor:** Agendador de citas

**Descripción:**  
El agendador necesita consultar las citas programadas para un médico o terapista específico en una fecha determinada.

**Criterios de aceptación:**
- Selector de médico/terapista.
- Selector de fecha.
- Tabla con:
  - Hora
  - Nombre del paciente
  - Documento
  - Teléfono
  - Estado
- Total de citas.
- Mensaje si no hay resultados.
- Ordenamiento por hora.
- Acciones: ver detalle, cancelar.
- Mejora: autocompletado por documento del paciente.

**UX:**
- Texto mínimo 18px.
- Botones grandes.
- Alto contraste.

---

## Requisito 2: Crear cita desde contacto por WhatsApp (Prioridad 1)

**Actor:** Agendador de citas

**Descripción:**  
Registrar pacientes y crear citas manualmente respetando disponibilidad.

**Datos:**

*Paciente:*
- Documento
- Nombres
- Apellidos
- Celular
- Género
- (Opcional) Fecha nacimiento, correo

*Cita:*
- Médico
- Hora

**Criterios:**
- Formulario completo.
- Selector de médico.
- Horarios dinámicos según:
  - Intervalos
  - Jornada
  - Citas existentes
- Validación de duplicados.
- Confirmación de cita.
- Envío opcional por WhatsApp.
- Mejora: autocompletado de paciente por cédula.

---

## Requisito 3: Autogestión de citas por parte del paciente vía web (Prioridad 2)

**Actor:** Paciente

### 3.1 Registro y autenticación
- Registro con:
  - Documento único
  - Datos personales
  - Contraseña segura
- Login con documento o correo.
- Verificación opcional (SMS/WhatsApp).

### 3.2 Agendar cita
- Flujo:
  1. Elegir médico
  2. Elegir fecha
  3. Ver horarios disponibles
  4. Confirmar
- Validación de concurrencia.
- Confirmación por correo o WhatsApp.

### 3.3 Consulta y cancelación
- Ver citas.
- Cancelar con confirmación.
- Restricción de cancelación (ej. 2 horas antes).

**Seguridad:**
- Expiración de sesión.
- Protección de datos.

---

## Requisito 4: Configuración de parámetros del sistema (Prioridad 2)

**Actor:** Administrador

### 4.1 Ventana de agendamiento
- Definir semanas disponibles.
- Restricción para pacientes.
- Configuración diferente para agendadores.

### 4.2 Configuración por médico
- Días de atención.
- Horarios (inicio/fin).
- Intervalos.
- Descansos.
- Excepciones.

### 4.3 Validación
- Vista previa.
- Validación de errores.
- Auditoría de cambios.

---

## Requisito 5: Exportar citas (Prioridad 2)

**Actor:** Médico / Agendador

**Descripción:**  
Permite exportar citas de un médico en una fecha específica a un archivo compatible con hojas de cálculo.

**Criterios de aceptación:**
- Selección de médico/terapista.
- Selección de fecha.
- Exportación en formato **CSV**.
- Archivo incluye:
  - Hora
  - Paciente
  - Documento
  - Estado
- Descarga directa del archivo.

---

## Requisitos adicionales (Posteriores a implementación de 1-5)

### Adicional A: Bot de WhatsApp
- Agendar, consultar y cancelar citas.
- Integración con API oficial.
- Flujo conversacional.
- Validación de disponibilidad.
- Transferencia a humano.

### Adicional B: Recordatorios
- Envío automático (WhatsApp/SMS).
- Citas del día siguiente.
- Registro de envíos.
- Restricción de horario.

---

## Requisitos no funcionales

### Seguridad
- Autenticación con JWT.
- Integración con Keycloak.
- Autorización basada en roles.

### Seguridad (pruebas)
- Evaluación con OWASP ZAP.
- Identificación de al menos 2 vulnerabilidades.
- Informe de resultados.

### Rendimiento
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

### Arquitectura
- Aplicación web responsiva.
- Escalable.
- Separación frontend/backend.

---

## Consideraciones transversales de accesibilidad

- Texto mínimo 18px.
- Alto contraste.
- Navegación simple.
- Formularios claros.
- Mensajes comprensibles.
- Feedback visual inmediato.

---

## Consideraciones técnicas generales

- Uso de API de WhatsApp Business.
- Base de datos escalable.
- Arquitectura modular.
- Integración backend/frontend.

---

## Criterios de aceptación por fase

### Fase 1
- [ ] Listar citas
- [ ] Crear citas manuales
- [ ] Accesibilidad

### Fase 2
- [ ] Autogestión paciente
- [ ] Configuración del sistema
- [ ] Exportación de citas (CSV)

### Fase 3
- [ ] Bot WhatsApp
- [ ] Recordatorios automáticos
- [ ] Auditoría y trazabilidad

---