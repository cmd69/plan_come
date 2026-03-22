.DEFAULT_GOAL := help

.PHONY: help up down logs build setup deploy backup restore

help: ## Mostrar esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# === Producción ===

up: ## Iniciar servicio de producción
	docker compose up -d

down: ## Detener servicio
	docker compose down

logs: ## Ver logs
	docker compose logs -f

build: ## Construir imagen
	docker compose build

deploy: ## Deploy: pull imagen, recrear contenedor
	docker compose pull 2>/dev/null || true
	docker compose up -d --force-recreate

# === Base de datos ===

backup: ## Hacer backup de la BD -> backups/plancome_YYYYMMDD_HHMMSS.db
	@mkdir -p backups
	@[ -f data/plancome.db ] || (echo "No existe data/plancome.db"; exit 1)
	@cp data/plancome.db backups/plancome_$$(date +%Y%m%d_%H%M%S).db
	@echo "Backup guardado en backups/"

restore: ## Restaurar backup (uso: make restore FILE=backups/plancome_XXX.db)
	@[ -n "$(FILE)" ] || (echo "Error: indica el fichero -> make restore FILE=backups/plancome_XXX.db"; exit 1)
	@[ -f $(FILE) ] || (echo "Error: no existe $(FILE)"; exit 1)
	@cp $(FILE) data/plancome.db
	@echo "BD restaurada desde $(FILE)"

# === Setup ===

setup: ## Crear .env desde .env.example si no existe
	@[ -f .env ] && echo ".env ya existe" || (cp .env.example .env && echo ".env creado — edítalo antes de levantar")
