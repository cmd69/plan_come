# PlanCome
## Planificador Semanal de Comidas
### Documento Funcional

**v4.0 · Marzo 2026**

> v4.0: implementación completa. Se documenta el estado real de la aplicación.

---

## 1. Objetivo y contexto

PlanCome elimina la improvisación en la planificación de comidas. Permite saber siempre qué se va a comer y qué hay que comprar, evitando que se estropee comida.

Tres pilares:

- Planificación automática semanal.
- Inventario de productos del hogar con seguimiento por unidades.
- Lista de la compra generada a partir del inventario.

---

## 2. Rutina semanal

| Momento | Cuándo | Duración | Qué se hace |
|---|---|---|---|
| Planificación | Domingo noche | 5–10 min | La app genera el plan semanal. El usuario revisa y ajusta. |
| Preparar compra | Antes de salir al super | 5 min | Se seleccionan los productos que faltan por categoría. |
| Compra semanal | Lunes o martes | Lo que tarde | Se va al super con la lista y se tachan productos en el móvil. |
| Consulta diaria | Cada noche | 30 seg | Se mira qué toca comer al día siguiente. |
| Ajuste puntual | Cuando ocurra | 1 min | Se marca "comido fuera" o se cambia un plato. |

---

## 3. Planificación semanal

### 3.1 Estructura

| Aspecto | Detalle |
|---|---|
| Días planificados | Lunes a domingo (7 días) |
| Slots por día | Comida + Cena (14 slots en total) |
| Comensales | 2 personas, sin gestión de raciones |
| Ciclo | Semanal e independiente, sin memoria entre semanas |

### 3.2 Reglas de generación

- Generación automática con un toque.
- **No se repiten platos** en la misma semana.
- Solo se sugieren platos cuyos ingredientes principales estén disponibles en el inventario (simulación de stock virtual).
- Los ingredientes con grupo representan alternativas: al menos `groupMin` del grupo deben tener stock.
- Sábado y domingo se marcan como "fuera de casa" por defecto.

### 3.3 Gestión del día a día

- Cualquier slot se puede regenerar (nunca vuelve a salir el mismo plato) o cambiar manualmente con un picker de búsqueda.
- Marcar un slot como "comido fuera" libera el plato.
- Los slots vacíos se muestran diferenciados visualmente.
- Se puede navegar entre semanas y limpiar el plan completo.

---

## 4. Catálogo de platos

El usuario mantiene un listado de platos. Cada plato tiene:

- **Nombre** y **emoji**
- **Tipo**: Comida, Cena, Mixto o Acompañante
- **Ingredientes**: obligatorios u opcionales, individuales o en grupos alternativos
- **Acompañantes**: platos de tipo Acompañante enlazados como sides (con grupos)
- **Estado**: activo/inactivo (los inactivos se excluyen de la generación)
- **Notas** opcionales

Dos vistas: cuadrícula (con indicador de disponibilidad) y lista (agrupada por tipo).

---

## 5. Inventario de productos

### 5.1 Concepto

El inventario es la lista de todos los productos del hogar. Cada producto tiene unidades actuales, icono, categoría y prioridad (4 niveles: Sin, Baja, Media, Alta).

### 5.2 Categorías

Las categorías son dinámicas — el usuario las crea, edita, reordena y elimina desde Ajustes.

### 5.3 Comportamiento

- Dos vistas: lista (con ordenación y selección múltiple) y cuadrícula (por categoría).
- Controles +/− para ajustar unidades.
- Selección múltiple con long press para edición masiva (icono, categoría, prioridad).
- Indicador de prioridad `!`/`!!`/`!!!` con colores (azul, ámbar, rojo).
- Importación CSV masiva de productos.
- Reset de todas las unidades a 0.
- No hay alertas automáticas de stock: el usuario decide visualmente.

---

## 6. Lista de la compra

### 6.1 Preparar compra

Antes de ir al supermercado, el usuario navega un grid de categorías y selecciona los productos que necesita comprar. Los productos se muestran con su stock actual e indicador de prioridad.

### 6.2 Modo compra

Vista optimizada para usar en el supermercado con una mano:

- Productos agrupados por categoría con progreso por sección.
- Un toque marca el producto como cogido (tachado visual).
- Controles de cantidad por ítem.
- Barra de progreso global (X de Y).
- Se pueden añadir más productos a una sesión activa.
- **Finalizar**: actualiza el inventario con las cantidades de los productos marcados.
- **Descartar**: cierra la sesión sin modificar el inventario.

---

## 7. Autenticación

- Login single user con página completa (no popup).
- Credenciales en variables de entorno (`AUTH_USER`, `AUTH_PASSWORD`).
- Sesión de 30 días mediante cookie firmada con HMAC-SHA256.
- Middleware protege todas las rutas excepto `/login` y `/api/auth/*`.
- Redirect automático a `/login` cuando la sesión no existe o caduca.
- Cerrar sesión desde Ajustes.

---

## 8. Tema y diseño

### 8.1 Mobile first

- Interfaces simples: una acción principal por pantalla.
- Botones y áreas de toque ≥44px.
- Acciones destructivas requieren confirmación.
- Navegación predecible con bottom nav de 5 secciones.
- Modales como bottom sheets; el botón back del navegador los cierra.

### 8.2 Tema claro/oscuro

- Toggle en Ajustes, persistido en localStorage.
- Implementado con CSS custom properties en `globals.css` (fuente de verdad de colores).
- Componentes usan clases semánticas (`bg-surface`, `text-primary`, etc.), sin prefijos `dark:`.
- La clase `.dark` en `<html>` activa el tema oscuro.
- Script anti-FOUC en `<head>` aplica el tema antes del primer render.

---

## 9. Vistas de la aplicación

| Vista | Ruta | Descripción |
|---|---|---|
| Login | `/login` | Formulario de usuario y contraseña |
| Plan semanal | `/plan` | 14 slots por día con generación, edición y navegación entre semanas |
| Catálogo de platos | `/platos` | Grid/lista de platos con CRUD, ingredientes y disponibilidad |
| Inventario | `/inventario` | Lista/cuadrícula de productos con unidades, prioridad y edición masiva |
| Compra | `/compra` | Preparar compra (selección por categoría) + Modo compra (checklist en super) |
| Ajustes | `/ajustes` | Categorías, tema claro/oscuro, cerrar sesión |

---

## 10. Resumen de decisiones

| Aspecto | Decisión |
|---|---|
| Días planificados | 7 días (lunes a domingo) |
| Slots | Comida + cena = 14 slots semanales |
| Comensales | 2 personas, sin gestión de raciones |
| Generación del plan | Automática, sin repetir platos en la semana |
| Inventario | Unidades numéricas, 4 niveles de prioridad |
| Categorías | Dinámicas, gestionadas por el usuario |
| Flujo de compra | Seleccionar por categoría → modo compra en el super |
| Actualización inventario | Automática al finalizar modo compra |
| Auth | Single user, cookie firmada, sesión 30 días |
| Tema | Claro/oscuro con CSS tokens semánticos |
| Memoria entre semanas | No — cada semana es independiente |
| Restricciones pre-generación | Descartadas — el usuario ajusta manualmente |
| Lista maestra separada | Descartada — el inventario cumple esta función |
| Recetas detalladas | Fuera del alcance |
| Escáner código de barras | Descartado |

---

*— Fin del documento —*
