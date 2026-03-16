# PlanCome

## Descripción

Planificador semanal de comidas para 2 personas. Genera planes automáticos, gestiona inventario de productos y lista de la compra inteligente. Mobile-first con tema claro/oscuro.

**Estado:** implementación completa — solo tweaks y ajustes menores de aquí en adelante.

## Stack

- **Lenguaje:** TypeScript
- **Framework:** Next.js 15 (App Router, Server Actions, Turbopack)
- **Base de datos:** SQLite (Prisma ORM)
- **UI:** Tailwind CSS 3.4 con tokens semánticos CSS (sin shadcn/ui)
- **Auth:** Cookie firmada HMAC-SHA256 (single user, 30 días)
- **Deploy:** Docker Compose (contenedor único)
- **Tipo:** dev — código fuente + hot-reload

## Relación prod/dev

- **Repo prod:** `~/homelab/docker/plancome/`
- **Repo dev:** `~/homelab/docker/plancome-dev/` ← código fuente aquí

## Arrancar el proyecto

```bash
make up-dev       # Levantar en modo desarrollo
make down-dev     # Parar
make logs-dev     # Logs
make build-dev    # Rebuild
make shell-app    # Shell dentro del contenedor
```

## Estructura

```
plancome-dev/
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.example
├── .env
├── Makefile
├── CLAUDE.md
├── docs/
│   └── requisitos.md
├── frontend/
│   ├── Dockerfile / Dockerfile.dev
│   ├── package.json
│   ├── tailwind.config.ts         # darkMode: "class" + tokens semánticos
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── middleware.ts           # Auth middleware (Edge Runtime, Web Crypto)
│       ├── app/
│       │   ├── globals.css         # CSS variables light/dark (fuente de verdad)
│       │   ├── layout.tsx          # Script anti-FOUC + NavWrapper
│       │   ├── login/page.tsx
│       │   ├── plan/page.tsx
│       │   ├── platos/page.tsx
│       │   ├── inventario/page.tsx
│       │   ├── compra/page.tsx
│       │   ├── ajustes/page.tsx
│       │   └── api/auth/{login,logout}/route.ts
│       ├── actions/                # Server Actions
│       │   ├── plan.ts
│       │   ├── dishes.ts
│       │   ├── products.ts
│       │   ├── shopping.ts
│       │   ├── categories.ts
│       │   └── import-products.ts
│       ├── components/
│       │   ├── nav/                # BottomNav, NavWrapper
│       │   ├── plan/               # WeekPlanView, PlanSlotCard, SlotPicker
│       │   ├── platos/             # DishList, DishCard, DishForm, DishDetailSheet, IngredientPicker
│       │   ├── inventario/         # ProductList, ProductGrid, ProductCard, ProductForm, BulkEditForm, ImportProducts
│       │   ├── compra/             # ShoppingView, ShoppingPrepare, ShoppingMode
│       │   └── ajustes/            # CategoryManager, CategoryForm, ThemeToggle, LogoutButton
│       └── lib/
│           ├── auth.ts             # Funciones de sesión (cookie firmada)
│           ├── prisma.ts
│           ├── constants.ts        # Enums, labels, prioridades, categorías
│           ├── utils.ts            # cn() helper
│           ├── useTheme.ts         # Hook tema claro/oscuro
│           └── useModalHistory.ts  # Hook para back del navegador en modales
└── scripts/
```

## Variables de entorno

Ver `.env.example`:

```env
DATABASE_URL=file:/data/plancome.db
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=development
APP_PORT=3040
AUTH_USER=admin
AUTH_PASSWORD=admin
AUTH_SECRET=cambiar-este-secreto-en-produccion
```

## Puertos

| Entorno | Puerto host |
|---|---|
| Dev | 3040 |
| Prod | 3041 |

## Ejecución de comandos

**Siempre dentro del contenedor:**

```bash
# Prisma
docker compose -f docker-compose.dev.yml exec app npx prisma migrate dev
docker compose -f docker-compose.dev.yml exec app npx prisma studio

# TypeScript check
docker compose -f docker-compose.dev.yml exec app npx tsc --noEmit
```

## Arquitectura / decisiones

- **Fullstack Next.js** — CRUD + generación de plan, no justifica backend separado
- **SQLite** — 2 usuarios fijos, sin concurrencia real, datos ligeros. Archivo en volumen Docker
- **Auth single user** — cookie firmada con HMAC-SHA256, sesión de 30 días. Middleware en Edge Runtime usa Web Crypto API (no Node crypto)
- **Server Actions** — mutaciones directas sin API REST intermedia
- **Prisma** — migraciones, tipado, fácil migración a PostgreSQL si fuera necesario
- **Mobile-first** — uso principal desde móvil (modo compra, consulta diaria)
- **Tema con CSS tokens** — colores definidos una sola vez en `globals.css` como CSS custom properties. Los componentes usan clases semánticas (`bg-surface`, `text-primary`, etc.), nunca `dark:`. La clase `.dark` en `<html>` activa el tema oscuro
- **No repetir platos** — la generación del plan no repite platos en la misma semana. Al regenerar un slot, el plato actual se excluye de los candidatos

## Funcionalidades implementadas

### Plan semanal
- Generación automática respetando stock e ingredientes
- No repite platos en la misma semana
- Edición manual de slots (picker con búsqueda)
- Regenerar slot individual (excluye plato actual)
- Marcar "comido fuera"
- Navegación entre semanas
- Limpiar plan completo

### Catálogo de platos
- CRUD completo con tipos (Comida, Cena, Mixto, Acompañante)
- Ingredientes obligatorios/opcionales con grupos alternativos (groupMin)
- Acompañantes (platos tipo ACOMPANANTE enlazados como sides)
- Indicador de disponibilidad según stock
- Activo/inactivo
- Vistas grid y lista

### Inventario
- Productos con icono, categoría dinámica, unidades y prioridad (4 niveles)
- Vistas lista y cuadrícula
- Ordenación por nombre, icono o cantidad
- Selección múltiple con long press + edición masiva
- Importación CSV
- Reset todas las unidades a 0

### Lista de la compra
- Preparar compra: selección por categorías (grid de categorías → grid de productos)
- Modo compra: checklist optimizado para supermercado con progreso
- Controles de cantidad por ítem
- Añadir productos a sesión activa
- Al finalizar, actualiza inventario automáticamente
- Descartar sesión sin modificar inventario

### Ajustes
- Gestión de categorías (CRUD, reordenar con drag)
- Toggle tema claro/oscuro
- Cerrar sesión

### Auth
- Login single user (página completa, no popup)
- Sesión de 30 días (cookie firmada)
- Redirect automático a /login al caducar
- Middleware protege todas las rutas excepto /login y /api/auth/*

### UI/UX
- Tema claro y oscuro con tokens semánticos CSS
- Bottom navigation con 5 secciones
- Modales como bottom sheets
- Navegación back del navegador cierra modales
- Indicadores de prioridad `!`/`!!`/`!!!` con colores

## Notas de desarrollo

- El plan semanal sugiere solo platos con ingredientes disponibles (≥1 unidad) usando simulación de stock virtual
- Los ingredientes con `group` representan alternativas: al menos `groupMin` del grupo deben tener stock
- Al finalizar modo compra, solo los productos marcados como "cogidos" incrementan el inventario
- Cada semana es independiente, sin memoria entre semanas
- Sábado y domingo se marcan como "fuera de casa" por defecto al generar
- El middleware usa Web Crypto API (no Node crypto) porque corre en Edge Runtime
- `make regen` tras cualquier cambio en schema.prisma para regenerar Prisma Client
