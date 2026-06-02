# Reporte de Cobertura - Notification Service

**Fecha:** 2026-05-16  
**Estado Global:** 🟢 **~90% Cobertura**

## 📬 Estado de los Módulos

### 1. Generación de Mensajes (Templates) - 🟢 100%
*   **Cubierto**: Pruebas unitarias exhaustivas para cada tipo de mensaje (Creación, Cancelación, Recordatorio, Reprogramación) tanto para WhatsApp como para Email (HTML).
*   **Garantía**: El formato en español y la legibilidad para adultos mayores están verificados.

### 2. Controlador de Eventos (RabbitMQ) - 🟢 90%
*   **Cubierto**: Consumo de eventos desde el Backend principal, lógica de `ack/nack` para asegurar que ningún mensaje se pierda, y mapeo de datos.
*   **Garantía**: Si el microservicio falla al enviar un correo, RabbitMQ reintentará la entrega automáticamente.

### 3. Servicios de Envío (Email/WhatsApp) - 🟡 Parcial
*   **Cubierto**: Lógica de envío y manejo de errores internos.
*   **No Cubierto**: Pruebas de integración real con proveedores (Twilio/SMTP). Se asume que las APIs externas responden según sus contratos de mock.

---
## 🚩 Riesgos y Pendientes
*   **Riesgo**: El sistema depende de que las variables de entorno de los proveedores estén correctamente configuradas. No hay un "test de humo" automático que verifique la conexión real con el servidor SMTP al arrancar.
