# ADR-015: Global Exception Filter con Formato Estandarizado

- **Fecha:** 2026-05-25
- **Estado:** Aceptado
- **Decisión:** Filtro global de excepciones NestJS que estandariza todas las respuestas de error

## Contexto

El backend necesita manejar errores de forma consistente: errores de validación, errores HTTP conocidos y errores inesperados deben responder con el mismo formato JSON para que el frontend pueda procesarlos uniformemente.

## Opciones Consideradas

1. **Global Exception Filter** — Filtro NestJS que captura todas las excepciones
2. **Interceptors** — Interceptor de response para errores
3. **Middleware** — Middleware Express para errores
4. **Try-catch en cada controller** — Manejo individual por endpoint

## Decisión

Global exception filter (`AllExceptionsFilter`) que implementa `ExceptionFilter` y captura:
- `HttpException` (NestJS nativas) → devuelve `{ statusCode, message, timestamp, path }`
- `BadRequestException` (errores de validación class-validator) → devuelve array de errores
- Errores no controlados → `500 Internal Server Error` con log del error real (sin exponer detalles al cliente)

## Consecuencias

- ✅ Formato de error consistente en toda la API
- ✅ El frontend puede parsear errores con un solo patrón (`err.error.message`)
- ✅ Los errores inesperados se loguean pero no exponen internos al cliente
- ❌ Un solo filtro para todo: si se necesita comportamiento especial, hay que agregar lógica condicional
- ❌ No captura errores fuera del pipeline de NestJS (errores de middleware Express)
