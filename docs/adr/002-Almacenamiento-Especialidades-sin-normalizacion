# ADR-002: Almacenamiento de especialidades sin normalización

### Fecha: 13 de abril de 2026
### Estado: En desarrollo

## Contexto
En la implementación actual del sistema, las especialidades de los médicos se almacenan como cadenas de texto libres en la entidad `Doctor`. No existe una estructura que limite o valide los valores posibles, como una lista predefinida, un catálogo o una entidad relacionada. Esto implica que cualquier valor ingresado es aceptado y persistido sin control, lo que puede generar variaciones en la forma en que se registran las especialidades.

## Decisión
Se decidió mantener las especialidades como valores de tipo string en la entidad `Doctor`, permitiendo mayor flexibilidad en la etapa inicial del desarrollo. No se implementaron validaciones ni estructuras adicionales, con el objetivo de simplificar el modelo de datos y priorizar el desarrollo de las funcionalidades principales.
Como parte de la evolución del sistema, se definió que en futuras iteraciones se implementarán mecanismos de validación y/o normalización de las especialidades, con el fin de garantizar mayor consistencia e integridad en los datos.

## Consecuencias

### Positivas
- Se simplifica la implementación al no requerir tablas adicionales, relaciones ni lógica de validación.
- Se permite registrar especialidades personalizadas sin necesidad de modificar la estructura del sistema.

### Negativas o Riesgos
- Existe riesgo de inconsistencias en los datos (por ejemplo, variaciones en la escritura de una misma especialidad).
- Se dificulta la implementación de filtros, búsquedas y reportes basados en especialidades.
- Se compromete la integridad y uniformidad de la información almacenada.
