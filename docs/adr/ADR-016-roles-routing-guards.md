# ADR-016: Un Solo Guard JWT con Roles vs Múltiples Guards

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Un solo `JwtAuthGuard` que protege todas las rutas, con verificación de rol por ruta

## Contexto

El frontend tiene 13 rutas, cada una accesible por roles específicos:
- `/citas`, `/agendar` → staff/admin
- `/paciente/*` → patient
- `/medico/*` → doctor
- `/admin/*` → admin

## Opciones Consideradas

1. **Un guard con roles en data** — `JwtAuthGuard` que lee `route.data.roles` y verifica contra el token
2. **Múltiples guards** — `AdminGuard`, `DoctorGuard`, `PatientGuard`, `StaffGuard`
3. **Guards anidados** — `AuthGuard` + `RolesGuard` (Patrón NestJS recomendado)

## Decisión

Un solo `JwtAuthGuard` que:
- Verifica que el token JWT sea válido (via Passport)
- Extrae el usuario y su rol del token
- Las rutas definen roles permitidos en `data`: `{ roles: ['admin', 'staff'] }`
- El guard compara el rol del usuario contra los permitidos

## Consecuencias

- ✅ Menos código (un guard vs 4+)
- ✅ Fácil de mantener (cambiar lógica de auth en un solo lugar)
- ✅ Las rutas declaran explícitamente sus roles
- ❌ Un solo guard hace todo (viola principio de responsabilidad única)
- ❌ Si se necesita lógica diferente por rol, el condicional crece
