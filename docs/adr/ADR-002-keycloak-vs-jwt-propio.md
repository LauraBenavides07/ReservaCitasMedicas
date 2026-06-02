# ADR-002: Keycloak como Proveedor de Autenticación

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Keycloak (OpenID Connect) + JWT local como fallback

## Contexto

Se necesita autenticación para tres roles (admin, doctor, staff, patient) con registro de pacientes y login. Opciones: construir un sistema JWT propio, usar Passport con múltiples estrategias, o integrar un IdP externo.

## Opciones Consideradas

1. **Keycloak** — IdP completo con OIDC, auto-provisioning, manejo de sesiones
2. **JWT propio** — Firma local, manejo manual de refresh tokens
3. **Auth0/Firebase Auth** — SaaS de autenticación

## Decisión

Keycloak como fuente primaria de autenticación, con:
- JWT local firmado por NestJS como fallback (casos donde Keycloak no está disponible)
- `JwtStrategy` que intenta Keycloak primero, cae a BD local
- Auto-provisioning: al registrar paciente se crea usuario en Keycloak automáticamente
- `AuthService.register()` tolera fallo de Keycloak (log + continuar)

## Consecuencias

- ✅ Manejo robusto de sesiones, refresh tokens, y revocación
- ✅ Separación de concerns (autenticación fuera del dominio)
- ✅ Posibilidad de integrar SSO fácilmente
- ❌ Dependencia externa (Keycloak debe estar corriendo)
- ❌ Complejidad operativa (reino, clientes, config)
- ⚠️ En desarrollo se puede desactivar Keycloak y usar JWT local vía flag
