# Especificación de Requisitos - Sistema de Gestión de Citas Médicas

## Entregables
Para el segundo corte, se trabajarán requisitos funcionales y no funcionales del Sistema de Reserva de
Citas de Piedrazul. Los requisitos 1 y 2, son los del primer corte, se pueden mejorar para la segunda
iteración, por ejemplo, implementar el autocompletado cuando se busque un paciente por cédula.

## Requisitos funcionales
Se deben implementar los siguientes requisitos funcionales de alto valor para el cliente:
1. Yo como agendador de citas necesito listar las citas médicas de un determinado médico/terapista
en una fecha determinada para visualizar el listado y la cantidad de citas. Contexto: Se sugiere
diseñar un sistema de búsqueda con resultados en una tabla.
2. Yo como agendador de citas necesito crear una nueva cita de un paciente que me ha contactado
por WhatsApp para hacer efectiva esa cita. Contexto: los datos que se deben capturar del paciente
son: Número de documento de identidad, nombres y apellidos, celular, género (Hombre, Mujer,
Otro), fecha de nacimiento (opcional) y correo electrónico (opcional); los datos de la cita son:
Médico/terapista, hora. Tener en cuenta el intervalo de tiempo de cada médico/terapista.
3. Yo como paciente necesito agendar una cita mediante la web para tener una cita de manera
sencilla y rápida sin tener que usar WhatsApp. Contexto: El paciente debe tener un registro de
usuario para poder agendar una cita. El sistema debe brindar un mecanismo para hacer la cita de
manera segura, usable y eficiente, mostrando las franjas disponibles para cada médico.
4. Yo como administrador necesito configurar los parámetros del sistema para que el
agendamiento de citas autónomo funcione acorde a la disponibilidad de los médicos y terapistas
de Piedrazul. Contexto: Se debe configurar la ventana de tiempo que se habilitarán las citas (en
semanas), los días de la semana que cada médico/terapista atiende, la franja horaria de cada
médico/terapista, el intervalo de tiempo (minutos) que cada médico/terapista tiene entre cita y
cita.
5. Yo como médico/terapista/agendador necesito exportar las citas correspondientes a una fecha
específica y a un médico o terapista determinado, en un formato de texto compatible con hojas
de cálculo (por ejemplo, CSV) para que durante la jornada de atención haya un listado que
organizar los pacientes y su ingreso a la consulta médica.

## Requisitos no funcionales
1. Implementar un sistema de autenticación y autorización basado en tokens JWT. Usar un sistema
externo como Keycloak. La gestión de usuarios y roles se puede hacer por Postman, no se requiere
aún una interfaz gráfica en el frontend.
2. Testear con OWASP ZAP al menos dos vulnerabilidades de la aplicación web acorde a la
especificación OWASP top 10. Generar un informe breve de las vulnerabilidades reportadas.