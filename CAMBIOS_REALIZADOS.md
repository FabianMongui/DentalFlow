# Cambios realizados en DentalFlow

## Enfoque recomendado
Se dejó la app con funcionalidades locales antes de conectar Supabase. Esto permite validar el flujo de usuario, pantallas, estados, filtros y responsive sin depender todavía de base de datos.

## Cambios principales
- Se creó un contexto local `DentalFlowContext` para simular datos reales.
- Se agregaron tipos en `src/types.ts`.
- Se agregaron datos demo en `src/data/mockData.ts`.
- El dashboard ahora calcula métricas desde los trabajos reales del contexto local.
- El listado de trabajos ahora tiene búsqueda, filtros y tarjetas móviles.
- El formulario de crear trabajo ahora guarda trabajos en localStorage y redirige al detalle.
- El detalle del trabajo ahora carga por ID real, permite cambiar estado, cambiar estado de pago y registrar correcciones.
- Clientes ahora calcula trabajos y saldos pendientes desde los datos locales.
- Se agregaron pantallas de Reportes y Configuración para que el menú no quede con rutas vacías.
- Se ajustó la interfaz para celulares: tarjetas en móvil, tablas en escritorio, botones más cómodos y navegación inferior.

## Validación
- `npm run lint` OK.
- `npm run build` OK.

## Siguiente paso sugerido
Conectar Supabase reemplazando el contexto local por servicios reales para:
- Auth/login.
- Tabla `clients`.
- Tabla `jobs`.
- Tabla `job_corrections`.
- Tabla `job_status_history`.
