# PlanCome

Planificador semanal de comidas para 2 personas. Genera planes automáticos, gestiona inventario de productos y lista de la compra inteligente.

## Inicio rápido

1. `cp .env.example .env`
2. `make up-dev`
3. Acceder en http://localhost:3040

## Servicios

| Servicio | URL | Puerto |
|---|---|---|
| App | http://localhost:3040 | 3040 (dev) / 3041 (prod) |

## Stack

- Next.js 15 (App Router + Server Actions)
- TypeScript
- SQLite + Prisma
- Tailwind CSS + shadcn/ui

## Variables de entorno

Ver `.env.example`.

## Documentación

- [Requisitos funcionales](docs/requisitos.md)
