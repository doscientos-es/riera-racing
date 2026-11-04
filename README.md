# Riera Racing · demo de gestión de taller

Prototipo comercial con datos ficticios. No usa servidor ni cuentas: los cambios se
guardan únicamente en `localStorage` del navegador, bajo una clave propia. No introducir
datos reales ni usarlo para gestionar el taller de producción.

## Recorrido de demostración

Al entrar, selecciona **Administración** o **Àlex Ferrer** en `/login`. El perfil se guarda
en este navegador y puede cambiarse desde la aplicación sin borrar los datos del taller.

1. En **Proyectos**, abrir un vehículo o crear uno y añadir o editar partidas del presupuesto.
2. Aprobar el presupuesto, asignar tareas y registrar en **Partes de taller** horas, gastos y piezas.
3. En **Inventario**, revisar existencias y ubicación. En **Compras**, recibir un pedido y confirmar cualquier diferencia; la recepción aumenta el stock una sola vez.
4. Volver al proyecto para consultar los costes registrados y crear un borrador en **Facturación**.
5. En **Asistente IA**, dictar o escribir una de las frases de ejemplo, revisar la propuesta, completar los campos faltantes y confirmar. También se puede seleccionar una acción manualmente.
6. En **Planificación** consultar y completar tareas; registrar imprevistos en **Incidencias**. **Clientes**, **Gastos**, **Contabilidad** e **Informes** muestran información obtenida de los mismos proyectos, partes y borradores.
7. El botón flotante inicia el dictado cuando el navegador lo permite; muestra el texto en directo y procesa una acción al terminar. Por ejemplo, «Aprobar presupuesto del Porsche 911 GT3» se ejecuta automáticamente si pasa las validaciones. Otras frases requieren revisión y confirmación.
8. Con el perfil de trabajador, un ejemplo de parte automático sin piezas es «Registrar parte en BMW M3 E36 2 horas trabajo montar frenos coste por hora 24 gastos 0». Solo se permite en proyectos asignados al trabajador de ejemplo.

## Límites

- El asistente **no está conectado a IA**: usa reglas limitadas para detectar una acción por nota; no interpreta lenguaje libre. Permite proponer proyectos, partidas, aprobación y cierre, partes, tareas, pedidos, recepciones, borradores y vacaciones. El asistente flotante ejecuta automáticamente solo órdenes exactas de aprobación, cierre, borrador y determinados partes propios; las demás deben revisarse y confirmarse. Los datos no detectados deben completarse manualmente.
- El acceso por perfiles es una simulación local: administración puede usar todas las acciones del asistente; el trabajador de ejemplo solo puede registrar sus propios partes en proyectos asignados y sus vacaciones. No protege el resto de la aplicación ni sustituye autenticación o autorización en el servidor.
- El dictado usa el reconocimiento del navegador, si está disponible y con permiso de micrófono. Según el navegador, el audio puede enviarse a su proveedor; no utilizar datos reales. También se puede escribir. El ejemplo de PDF no lee, guarda ni sube el archivo.
- Los presupuestos no se envían; la aprobación es local. Los borradores no son facturas fiscales y el cobro es simulado. El CSV es de ejemplo, no un formato validado por la asesoría.
- No hay autenticación, permisos, datos compartidos, copias de seguridad, e-commerce, integraciones ni fichaje de jornada. Los pedidos no se envían al proveedor; solo admiten una pieza y una recepción cerrada.
- El inventario no implementa reservas y los presupuestos no generan consumos automáticamente. El coste refleja únicamente los partes registrados, no un margen contable.
- Clientes se agrupan por nombre escrito en los proyectos, sin fichas independientes. La planificación no incluye fechas de tareas ni validación automática de ausencias. Gastos solo recoge los importes de los partes; contabilidad e informes son resúmenes orientativos, no contabilidad fiscal.
- Actividad registra cambios genéricos desde la incorporación del módulo, sin usuario ni detalle de los cambios anteriores. Incidencias permite registrar, resolver y reabrir incidencias por proyecto.
- La copia conserva código y documentación forestal heredados que no participan en la demo de Riera Racing. No son funcionalidades del taller.

## Desarrollo

Requiere Node.js 22.18+ y pnpm. Instalar con `pnpm install --frozen-lockfile` y arrancar con `pnpm dev`.

El punto de entrada es `src/main.tsx`; el dominio, datos ficticios y pantallas están en
`src/features/racing`. La opción **Restablecer datos de ejemplo** elimina únicamente
la clave de esta demo del navegador, previa confirmación.

Ejecutar `pnpm quality` para formato, lint, estructura, tipos y pruebas; `pnpm build`
genera la aplicación. El paso a producción requiere un diseño y validación propios:
el documento forestal heredado no describe este dominio.
