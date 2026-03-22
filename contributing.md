# Flujo de trabajo Git - Piedrazul

Este documento define la política de ramas, el formato de commits y el proceso de integración de cambios para el repositorio del sistema de gestión de citas médicas Piedrazul.

## Ramas

El repositorio utiliza el modelo [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/) simplificado.

### Rama principal
- `main`: Rama protegida. Contiene el código en producción. **No se permite hacer commits directos**. Solo se actualiza mediante Pull Requests (PR) aprobados.

### Ramas de desarrollo
- `develop`: Rama base para integración de nuevas funcionalidades. Los cambios se fusionan aquí antes de pasar a `main`.

### Ramas temporales (creadas a partir de `develop`)
- **Features**: Para nuevas funcionalidades.
  - Formato: `feature/<nombre-descriptivo>`
  - Ejemplos: `feature/appointment-list`, `feature/whatsapp-bot-integration`
- **Bugfixes**: Para corrección de errores en desarrollo.
  - Formato: `bugfix/<descripcion-del-error>`
  - Ejemplo: `bugfix/datepicker-initial-value`
- **Hotfixes**: Para correcciones urgentes en producción (creadas desde `main`).
  - Formato: `hotfix/<descripcion>`
  - Ejemplo: `hotfix/security-patch`

### Ramas de release (opcional, si se requiere versionado)
- `release/<version>`: Para preparar una versión antes de fusionar a `main` y `develop`.
  - Ejemplo: `release/v1.0.0`

## Formato de commits

Se utiliza [Conventional Commits](https://www.conventionalcommits.org/) para mantener un historial claro y facilitar la generación automática de changelogs.

Estructura:<tipo>[ámbito opcional]: <descripción corta>

[ cuerpo opcional con detalles ]

[ pie opcional con referencias a issues ]

### Tipos permitidos
- `feat`: Nueva funcionalidad (corresponde a un feature).
- `fix`: Corrección de un error (bug).
- `docs`: Cambios en documentación.
- `style`: Cambios de formato, espacios, puntos y coma, etc. (no afectan el funcionamiento).
- `refactor`: Cambios en el código que no corrigen errores ni añaden funcionalidades.
- `perf`: Mejoras de rendimiento.
- `test`: Añadir o corregir pruebas.
- `chore`: Tareas de mantenimiento, configuración, dependencias.

### Ámbitos sugeridos (opcional)
- `frontend`: Angular, componentes, estilos.
- `backend`: NestJS, controladores, servicios.
- `db`: Migraciones, modelos.
- `auth`: Autenticación y autorización.
- `appointments`: Módulo de citas.
- `patients`: Módulo de pacientes.
- `doctors`: Módulo de médicos.
- `config`: Variables de entorno, configuración del proyecto.
- `ci`: Integración continua.


## Proceso de Pull Request (PR)

1. **Crear rama** desde `develop` (o desde `main` si es hotfix) con el formato adecuado.
2. **Desarrollar** y hacer commits siguiendo el formato.
3. **Abrir Pull Request** hacia `develop` (o hacia `main` en caso de hotfix). El título del PR debe ser descriptivo y, si es posible, incluir el tipo y ámbito.
4. **Revisión**: Al menos un miembro del equipo debe aprobar los cambios.
5. **Validación automática**: El CI debe pasar (tests, lint, build).
6. **Merge**: Se realiza mediante merge commit o squash según la política del equipo. Se recomienda **squash** para mantener el historial limpio, pero siempre conservando el mensaje del commit principal con el formato convencional.
7. **Eliminar rama** después del merge (opcional).

### Protecciones en `main`
- Se debe configurar la rama `main` como protegida en GitHub/GitLab:
  - Requerir PR con al menos una aprobación.
  - Requerir que los checks de CI pasen.
  - No permitir pushes directos.

## Buenas prácticas adicionales

- **Commits atómicos**: Cada commit debe representar un cambio lógico y funcional.
- **Mensajes en presente imperativo**: Ej. "agrega", "corrige", no "agregó" ni "agregado".
- **Referencia a issues**: Si existe un issue asociado, incluir `Ref: #id` o `Closes #id`.
- **No mezclar cambios**: Separar cambios de estilo, refactor y funcionalidad en distintos commits.
- **Frecuencia**: Commitear frecuentemente con cambios pequeños facilita la revisión.

## Ejemplo de flujo completo

```bash
# 1. Actualizar develop
git checkout develop
git pull origin develop

# 2. Crear rama feature
git checkout -b feature/appointment-calendar-view

# 3. Desarrollar y commitear
git add .
git commit -m "feat(frontend): agregar vista de calendario mensual para citas"

# 4. Más commits
git commit -m "fix(frontend): ajustar tamaño de celdas a 48px para accesibilidad"

# 5. Subir rama
git push origin feature/appointment-calendar-view

# 6. Crear Pull Request en GitHub/GitLab hacia develop

# 7. Después de aprobación y merge, eliminar rama local
git checkout develop
git pull origin develop
git branch -d feature/appointment-calendar-view
