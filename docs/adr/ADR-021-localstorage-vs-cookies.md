# ADR-021: Token JWT en localStorage

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Almacenar el token JWT en localStorage en lugar de httpOnly cookies

## Contexto**

El frontend necesita persistir el token JWT entre sesiones para mantener la autenticación.

## Opciones Consideradas

1. **localStorage** — Fácil de implementar, accesible desde JavaScript, persiste al cerrar el navegador
2. **httpOnly cookie** — Más seguro (no accesible desde JS), pero requiere configuración de backend y CORS
3. **SessionStorage** — Similar a localStorage pero se limpia al cerrar el navegador
4. **Memory (variable)** — No persiste, se pierde al recargar la página

## Decisión

localStorage por simplicidad: es un sistema interno para clínicas (no expuesto al público general), el riesgo XSS es bajo. El token se almacena en la key `piedrazul_token` y se lee en el `AuthInterceptor` para agregarlo al header `Authorization: Bearer <token>`.

## Consecuencias

- ✅ Implementación simple (getItem/setItem/removeItem)
- ✅ Persiste entre pestañas y sesiones del navegador
- ✅ El interceptor HTTP lo lee directamente
- ❌ Vulnerable a XSS (si un atacante inyecta JS, puede robar el token)
- ❌ No se puede revocar del lado del servidor fácilmente
- ✅ En un sistema clínico interno, el riesgo es asumible
