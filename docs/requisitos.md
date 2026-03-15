# PlanCome
## Planificador Semanal de Comidas
### Documento Funcional de Requisitos

**v3.0 · Marzo 2026**

> v3.0: se elimina la restricción automática de platos repetidos y se incorporan principios de diseño mobile first.

---

## 1. Objetivo y contexto

PlanCome nace de la necesidad de establecer una rutina fija y metódica de planificación de comidas. El objetivo real no es tener un recetario, sino eliminar la improvisación, evitar que se estropee comida y saber siempre con antelación qué se va a comer y qué hay que comprar.

El sistema se apoya en tres pilares:

- Planificación automática semanal generada cada domingo.
- Inventario de productos del hogar con seguimiento por unidades.
- Lista de la compra inteligente generada a partir del inventario y el plan.

---

## 2. Rutina semanal

La aplicación está diseñada para sostener una rutina fija de dos momentos clave a la semana:

| Momento | Cuándo | Duración | Qué se hace |
|---|---|---|---|
| Planificación | Domingo noche | 5–10 min | La app genera el plan semanal automáticamente. El usuario lo revisa y ajusta si quiere. |
| Preparar compra | Antes de salir al super | 5 min | Se recorre la lista maestra, se ajustan unidades y se genera la lista de lo que falta. |
| Compra semanal | Lunes o martes | Lo que tarde | Se va al supermercado con la lista generada y se tachan productos en el móvil. |
| Consulta diaria | Cada noche | 30 seg | Se mira qué toca comer al día siguiente. |
| Ajuste puntual | Cuando ocurra | 1 min | Se marca 'comido fuera' o se cambia un plato del plan. |

---

## 3. Planificación semanal

### 3.1 Estructura

El plan cubre los 7 días de la semana, con comida y cena por día (14 slots). Se genera automáticamente cada domingo y puede editarse en cualquier momento.

| Aspecto | Detalle |
|---|---|
| Días planificados | Lunes a domingo (7 días) |
| Slots por día | Comida + Cena (14 slots en total) |
| Comensales | 2 personas, sin gestión de raciones |
| Ciclo | Semanal e independiente, sin memoria entre semanas |

### 3.2 Reglas de generación

- La generación del plan es automática y no aplica restricciones de repetición de platos ni categorías.
- El usuario revisa el plan generado y modifica manualmente los slots que no le convenzan.
- Solo se sugieren platos cuyos ingredientes principales estén disponibles en el inventario.
- Se pueden indicar restricciones rápidas antes de generar el plan (ej: 'sin pescado esta semana').

### 3.3 Gestión del día a día

- Cualquier slot se puede regenerar o cambiar manualmente.
- Marcar un slot como 'comido fuera' ofrece la opción de reubicar el plato o descartarlo.
- Los slots vacíos se muestran claramente diferenciados en la vista semanal.

---

## 4. Catálogo de platos

El usuario mantiene su propio listado de platos disponibles. Cada plato tiene nombre, categoría (pasta, arroz, carne, pescado, legumbres, huevos, otro) e ingrediente principal asociado al inventario. No se almacenan recetas, ingredientes secundarios ni cantidades.

- El usuario puede añadir, editar y eliminar platos en cualquier momento.
- Un plato puede marcarse como inactivo para excluirlo temporalmente de las sugerencias.

---

## 5. Inventario de productos

### 5.1 Concepto

El inventario es la lista completa de todos los productos que el hogar suele tener. Cada producto tiene un número de unidades actuales. No hay distinción entre tipos de producto: unidades para todo, de forma uniforme y simple.

### 5.2 Categorías del inventario

Los productos se agrupan por categorías para facilitar su revisión y la compra en el supermercado:

| Categoría | Ejemplos |
|---|---|
| Carnes y proteínas | Alitas de pollo, muslo de pollo, filetes de magro, hamburguesas, huevos |
| Lácteos | Leche, yogures, mantequilla, queso |
| Frutas y verduras | Tomates, patatas, cebolla, pimientos, lechuga |
| Despensa | Arroz, pasta, legumbres, aceite, sal, especias |
| Bebidas | Agua (garrafas), refrescos, zumos |
| Higiene y limpieza | Papel de cocina, detergente, jabón |
| Otros | Cualquier producto habitual no categorizado |

### 5.3 Comportamiento del inventario

- Cada producto muestra sus unidades actuales.
- El usuario actualiza las unidades manualmente al llegar de la compra o al gastar algo.
- El sistema sugiere solo platos cuyos ingredientes principales tengan al menos 1 unidad disponible.
- Si el usuario asigna un plato con ingrediente a 0 unidades, la app muestra un aviso. Puede ignorarlo y continuar.
- No hay alertas automáticas de stock mínimo: el usuario decide visualmente qué comprar.

---

## 6. Lista de la compra

### 6.1 Lista maestra

La lista maestra es el catálogo completo de todos los productos que el hogar suele comprar. Es independiente del inventario actual: representa el universo de productos posibles, no el estado actual del stock.

- Cada producto de la lista maestra está vinculado a su entrada en el inventario.
- El usuario puede añadir, editar y eliminar productos de la lista maestra en cualquier momento.
- Los productos se agrupan por categoría, igual que en el inventario.

### 6.2 Flujo de preparación de la compra

Antes de salir al supermercado, el usuario abre la lista maestra y revisa producto a producto. Para cada uno decide si necesita comprarlo o no basándose en las unidades que le quedan. Los productos que marca como 'necesito comprar' pasan automáticamente a la lista activa de la compra.

### 6.3 Modo compra

El modo compra es una vista simplificada, optimizada para usar con el móvil en mano en el supermercado. Muestra únicamente los productos que hay que comprar, agrupados por categoría. El usuario los tacha conforme los mete en el carrito.

- Vista limpia sin elementos de configuración ni edición.
- Productos agrupados por categoría (coincide con la organización del supermercado).
- Un toque marca el producto como cogido (tachado visualmente).
- Contador de progreso visible: 'X de Y productos'.
- Al finalizar la compra, las unidades del inventario se actualizan automáticamente con lo comprado.

---

## 7. Principios de diseño: mobile first

La aplicación está diseñada prioritariamente para su uso desde el móvil. El objetivo es reducir al mínimo la fricción: cada interacción debe poder completarse con una sola mano, en segundos, sin necesidad de pensar.

### 7.1 Criterios generales

- Interfaces simples y despejadas: una acción principal por pantalla, sin elementos innecesarios.
- Botones y áreas de toque generosas: tamaños mínimos de 44px de alto para evitar pulsaciones erróneas.
- Acciones destructivas o irreversibles siempre requieren confirmación explícita.
- Controles críticos separados visualmente de los adyacentes para evitar errores por proximidad.
- Jerarquía visual clara: lo importante grande, lo secundario pequeño o fuera del flujo principal.
- Navegación predecible: el usuario siempre sabe dónde está y cómo volver.

### 7.2 Aplicación por vista

| Vista | Criterio específico |
|---|---|
| Plan semanal | Scroll vertical por días. Cada slot ocupa el ancho completo con zona de toque amplia. |
| Modo compra | Texto grande, checkboxes generosos, sin distracciones. Uso con una mano mientras se lleva el carrito. |
| Inventario | Botones +/− de tamaño generoso y bien separados para evitar pulsaciones erróneas. |
| Catálogo | Filas altas con zona de toque amplia. Acción de edición claramente separada de activar/desactivar. |

---

## 8. Vistas de la aplicación

| Vista | Descripción |
|---|---|
| Plan semanal | Vista principal con los 14 slots organizados por día. Acceso rápido a todas las acciones. |
| Catálogo de platos | Listado de platos con categoría e ingrediente principal. Gestión completa (añadir, editar, activar/desactivar). |
| Inventario | Lista de productos con unidades actuales. Organizados por categoría. |
| Lista maestra | Catálogo de todos los productos habituales de compra. Punto de partida para preparar la compra semanal. |
| Preparar compra | Revisión del inventario antes de salir. El usuario marca qué necesita comprar. |
| Modo compra | Vista ultra-simplificada para usar en el supermercado. Solo productos pendientes, tachado con un toque. |
| Restricciones | Panel previo a la generación del plan para indicar exclusiones rápidas de la semana. |

---

## 9. Resumen de decisiones de diseño

| Aspecto | Decisión |
|---|---|
| Días planificados | 7 días (lunes a domingo) |
| Slots | Comida + cena = 14 slots semanales |
| Comensales | 2 personas, sin gestión de raciones |
| Generación del plan | Automática con edición posterior |
| Variedad / repetición | Sin restricciones automáticas — el usuario revisa y ajusta manualmente |
| Inventario | Unidades numéricas para todos los productos |
| Alertas de stock | No — el usuario decide visualmente al revisar |
| Lista maestra | Catálogo completo de productos habituales |
| Flujo de compra | Revisar en casa → marcar lo que falta → modo compra en el super |
| Actualización inventario | Manual al llegar de la compra, o automática al finalizar modo compra |
| Escáner código de barras | Descartado por ahora — añadir solo si surge necesidad real |
| Restricciones | Rápidas, por sesión, antes de generar el plan |
| Memoria entre semanas | No — cada semana es independiente |
| Comido fuera | Marca el slot y decide si reubicar o descartar |
| Diseño | Mobile first: interfaces simples, botones generosos, mínima fricción |
| Recetas detalladas | No — fuera del alcance de la app |

---

*— Fin del documento —*
