# PlanCome

## Descripción

Planificador semanal de comidas para 2 personas. Genera planes automáticos, gestiona inventario de productos y lista de la compra inteligente. Mobile-first, datos compartidos.

## Stack

- **Lenguaje:** TypeScript
- **Framework:** Next.js 15 (App Router, Server Actions)
- **Base de datos:** SQLite (Prisma ORM)
- **UI:** Tailwind CSS + shadcn/ui
- **Deploy:** Docker Compose (contenedor único)
- **Tipo:** dev — código fuente + hot-reload

## Relación prod/dev

- **Repo prod:** `~/homelab/docker/plancome/`
- **Repo dev:** `~/homelab/docker/plancome-dev/` ← código fuente aquí

## Arrancar el proyecto

```bash
# Levantar en modo desarrollo
make up-dev

# Parar
make down-dev

# Logs
make logs-dev

# Rebuild
make build-dev
```

## Estructura

```
plancome-dev/
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.example
├── .env
├── Makefile
├── README.md
├── CLAUDE.md
├── .cursor/
│   └── rules/
│       └── dev-compose.mdc
├── docs/
│   └── requisitos.md          # documento funcional v3
├── frontend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       └── app/
└── scripts/
```

## Variables de entorno requeridas

Ver `.env.example`. Variables mínimas:

```env
DATABASE_URL=file:/data/plancome.db
```

## Ejecución de comandos

**Todos los comandos dentro del contenedor:**

```bash
# Prisma
docker compose -f docker-compose.dev.yml exec app npx prisma migrate dev
docker compose -f docker-compose.dev.yml exec app npx prisma studio

# Shell
make shell-app
```

## Puertos

| Entorno | Servicio | Puerto host |
|---|---|---|
| Dev | App | 3040 |
| Prod | App | 3041 |

## Arquitectura / decisiones

- **Fullstack Next.js** — lógica sencilla (CRUD + generación de plan), no justifica backend separado
- **SQLite** — 2 usuarios fijos, sin concurrencia real, datos ligeros. Archivo en volumen Docker
- **Sin auth** — app de uso doméstico, datos compartidos entre los 2 usuarios
- **Server Actions** — mutaciones directas sin API REST intermedia
- **Prisma** — migraciones, tipado, y fácil migración a PostgreSQL si fuera necesario
- **Mobile-first** — uso principal desde móvil (modo compra en supermercado, consulta diaria)

## Documentación

- [Requisitos funcionales](docs/requisitos.md)

## Notas de desarrollo

- El plan semanal se genera automáticamente sugiriendo solo platos con ingrediente disponible (≥1 unidad)
- Al finalizar modo compra, las unidades del inventario se actualizan automáticamente
- Cada semana es independiente, sin memoria entre semanas

## Historial de cambios relevantes

- [2026-03-15] Creación del proyecto
