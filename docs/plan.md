# Plan de desarrollo — PlanCome

> Seguimiento del estado de implementación. Marcar con `[x]` al completar cada ítem.
> Orden: de menor a mayor complejidad. Validar cada vista antes de pasar a la siguiente.

---

## Infraestructura base

- [x] Scaffold Next.js 15 + Prisma + Tailwind
- [x] docker-compose.dev.yml / docker-compose.prod.yml
- [x] Dockerfiles (dev hot-reload + prod standalone)
- [x] Esquema de BD (schema.prisma)
- [x] Layout raíz con navegación (bottom tab bar)
- [x] Primera migración de Prisma

---

## Vista 1 — Inventario `/inventario`

CRUD de productos con gestión de unidades. Base de todo el sistema.

### Modelo
- `Product` (name, category, units)

### Componentes
- [ ] `ProductList` — lista agrupada por categoría
- [ ] `ProductCard` — nombre + botones +/− + editar
- [ ] `ProductForm` — modal/sheet para añadir y editar

### Server Actions
- [ ] `createProduct`
- [ ] `updateUnits` (incremento / decremento)
- [ ] `updateProduct`
- [ ] `deleteProduct`

### Criterios de aceptación
- [ ] Se puede añadir un producto con nombre y categoría
- [ ] Los botones +/− cambian las unidades sin recargar la página
- [ ] Se puede editar nombre y categoría de un producto existente
- [ ] Se puede eliminar un producto (con confirmación)
- [ ] Los productos se muestran agrupados por categoría
- [ ] Los botones +/− son suficientemente grandes para uso con una mano (≥ 44px)

---

## Vista 2 — Catálogo de platos `/platos`

CRUD de platos con ingrediente principal vinculado al inventario.

### Modelo
- `Dish` + relación con `Product`

### Componentes
- [ ] `DishList` — lista con activos/inactivos, agrupada por categoría
- [ ] `DishCard` — nombre, categoría, ingrediente, toggle activo/inactivo
- [ ] `DishForm` — modal/sheet; selector de ingrediente principal (lista de productos)

### Server Actions
- [ ] `createDish`
- [ ] `updateDish`
- [ ] `toggleDishActive`
- [ ] `deleteDish`

### Criterios de aceptación
- [ ] Se puede añadir un plato con nombre, categoría e ingrediente principal opcional
- [ ] Se puede desactivar/activar un plato sin eliminarlo
- [ ] Los platos inactivos se muestran diferenciados visualmente
- [ ] Editar un plato actualiza todos sus campos incluido el ingrediente principal
- [ ] Se puede eliminar un plato (con confirmación)

---

## Vista 3 — Lista maestra + Preparar compra `/compra`

Revisión del inventario antes de salir al supermercado.

### Modelos
- `Product`, `ShoppingSession`, `ShoppingSessionItem`

### Componentes
- [ ] `MasterList` — todos los productos agrupados por categoría con unidades actuales
- [ ] `MasterListItem` — fila con nombre, unidades y checkbox "necesito comprar"
- [ ] `PrepareShoppingButton` — crea sesión con los marcados y navega a modo compra

### Server Actions
- [ ] `createShoppingSession` (recibe array de productId + quantityToBuy)

### Criterios de aceptación
- [ ] Se muestra todos los productos con sus unidades actuales
- [ ] El usuario puede marcar/desmarcar productos como "necesito comprar"
- [ ] Al confirmar se crea una sesión de compra con los productos marcados
- [ ] Si ya existe una sesión activa, avisa antes de crear otra

---

## Vista 4 — Modo compra `/compra/modo`

Vista ultra-simplificada para usar en el supermercado.

### Modelos
- `ShoppingSession`, `ShoppingSessionItem`, `Product`

### Componentes
- [ ] `ShoppingModeList` — ítems agrupados por categoría, solo los no tachados primero
- [ ] `ShoppingModeItem` — texto grande, tap para tachar
- [ ] `ShoppingProgress` — contador "X de Y productos"
- [ ] `FinishShoppingButton` — actualiza inventario y cierra sesión (con confirmación)

### Server Actions
- [ ] `toggleShoppingItem`
- [ ] `completeShoppingSession` (actualiza unidades + marca completedAt)

### Criterios de aceptación
- [ ] Solo se muestran los productos de la sesión activa
- [ ] Un tap marca el producto como cogido (tachado visual)
- [ ] El contador se actualiza en tiempo real
- [ ] "Finalizar compra" actualiza las unidades del inventario
- [ ] Tras finalizar, el inventario refleja las unidades compradas

---

## Vista 5 — Plan semanal `/plan`

Vista principal. 14 slots por semana (7 días × comida + cena).

### Modelos
- `WeekPlan`, `PlanSlot`, `Dish`, `Product`

### Componentes
- [ ] `WeekPlanView` — scroll vertical por días
- [ ] `DaySection` — cabecera de día con sus 2 slots
- [ ] `PlanSlotCard` — plato asignado o vacío; acciones contextuales
- [ ] `SlotActions` — cambiar plato / regenerar / comido fuera
- [ ] `GeneratePlanButton` — genera el plan de la semana actual

### Server Actions
- [ ] `getOrCreateWeekPlan` (crea plan vacío si no existe para la semana)
- [ ] `generateWeekPlan` (asigna platos aleatorios con ingrediente ≥ 1 unidad)
- [ ] `updateSlotDish` (asignar plato manualmente)
- [ ] `regenerateSlot` (nuevo plato aleatorio para un slot)
- [ ] `markSlotEatenOut`

### Lógica de generación
- Solo platos activos con `mainProduct.units >= 1`
- Sin restricciones de repetición — el usuario revisa y ajusta
- Los platos sin ingrediente principal siempre están disponibles

### Criterios de aceptación
- [ ] Se muestra el plan de la semana actual (lunes a domingo)
- [ ] Los slots vacíos se distinguen visualmente
- [ ] "Generar plan" rellena todos los slots con platos disponibles
- [ ] Se puede cambiar un slot manualmente
- [ ] Se puede regenerar un slot individual
- [ ] Marcar "comido fuera" vacía el slot con opción de reubicar el plato
- [ ] Los platos con ingrediente a 0 unidades muestran un aviso si se asignan

---

## Vista 6 — Restricciones (panel previo a generación)

Panel que aparece antes de generar el plan. Estado de sesión, sin persistir en BD.

### Componentes
- [ ] `RestrictionsPanel` — sheet/drawer sobre el plan semanal
- [ ] Tags de exclusión por categoría de plato
- [ ] Campo libre para excluir platos concretos

### Criterios de aceptación
- [ ] El usuario puede excluir categorías completas antes de generar
- [ ] Las exclusiones solo afectan a la generación actual
- [ ] Al cerrar el panel sin generar, las restricciones se descartan

---

## Vista pendiente — Configuración (futura)

> **Nota:** las categorías de productos y platos son actualmente fijas en código (`src/lib/constants.ts`).
> En una iteración futura se añadirá una vista `/configuracion` que permita gestionar las categorías
> desde la UI, persistiéndolas en BD. Pendiente de definir alcance antes de implementar.

---

## Estado global

| Vista | Estado |
|---|---|
| Infraestructura base | ✅ Completo |
| Inventario | En validación |
| Catálogo de platos | Pendiente |
| Lista maestra + Preparar compra | Pendiente |
| Modo compra | Pendiente |
| Plan semanal | Pendiente |
| Restricciones | Pendiente |
| Configuración (categorías) | Futura — pendiente de alcance |
