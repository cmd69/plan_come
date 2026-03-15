DEV_COMPOSE = docker-compose.dev.yml
PROD_COMPOSE = docker-compose.prod.yml

.PHONY: help up-dev down-dev build-dev logs-dev up-pro build-pro shell-app migrate studio setup regen

help: ## Mostrar esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# === Desarrollo ===

up-dev: ## Iniciar en modo DESARROLLO con hot-reload
	docker compose -f $(DEV_COMPOSE) up -d

down-dev: ## Detener servicios de DESARROLLO
	docker compose -f $(DEV_COMPOSE) down

build-dev: ## Construir imagen de DESARROLLO
	docker compose -f $(DEV_COMPOSE) build

logs-dev: ## Ver logs de DESARROLLO
	docker compose -f $(DEV_COMPOSE) logs -f

shell-app: ## Shell interactivo en el contenedor
	docker compose -f $(DEV_COMPOSE) exec app sh

migrate: ## Ejecutar migraciones de Prisma
	docker compose -f $(DEV_COMPOSE) exec app npx prisma migrate dev

regen: ## Regenerar Prisma Client + limpiar cache Turbopack y reiniciar
	docker compose -f $(DEV_COMPOSE) exec app sh -c "rm -rf .next && npx prisma generate"
	docker compose -f $(DEV_COMPOSE) restart app

studio: ## Abrir Prisma Studio
	docker compose -f $(DEV_COMPOSE) exec app npx prisma studio

# === Producción ===

up-pro: ## Iniciar servicios de PRODUCCIÓN (build local)
	docker compose -f $(PROD_COMPOSE) up -d

build-pro: ## Construir imagen de PRODUCCIÓN
	docker compose -f $(PROD_COMPOSE) build

# === Setup ===

setup: ## Crear .env desde .env.example si no existe
	@[ -f .env ] && echo ".env ya existe" || (cp .env.example .env && echo ".env creado — edítalo antes de levantar")

# === Defaults (dev) ===

up: up-dev
down: down-dev
logs: logs-dev
build: build-dev
