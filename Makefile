.PHONY: help build up down restart logs shell-backend shell-frontend seed seed-clean test clean

# Use docker-compose if available, otherwise fall back to docker compose
DOCKER_COMPOSE := $(shell if command -v docker-compose >/dev/null 2>&1; then echo docker-compose; else echo "docker compose"; fi)

# Default target
help:
	@echo "NJ Stars Platform - Docker Commands"
	@echo ""
	@echo "Development:"
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - View logs from all services"
	@echo "  make logs-backend   - View backend logs"
	@echo "  make logs-frontend  - View frontend logs"
	@echo ""
	@echo "Database:"
	@echo "  make seed           - Seed all data (core + CMS + teams + test data)"
	@echo "  make seed-clean     - Remove test data (keeps core data like plans/events)"
	@echo "  make db-shell       - Open PostgreSQL shell"
	@echo "  make db-reset       - Reset database (WARNING: deletes all data)"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run all tests"
	@echo "  make test-backend   - Run backend tests"
	@echo "  make test-frontend  - Run frontend tests"
	@echo ""
	@echo "Shell Access:"
	@echo "  make shell-backend  - Access backend container shell"
	@echo "  make shell-frontend - Access frontend container shell"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          - Remove all containers, volumes, and images"
	@echo "  make prune          - Remove unused Docker resources"
	@echo ""
	@echo "Production:"
	@echo "  make prod-build     - Build production images"
	@echo "  make prod-up        - Start production services"
	@echo "  make prod-down      - Stop production services"

# Development commands
build:
	$(DOCKER_COMPOSE) build

up:
	$(DOCKER_COMPOSE) up -d

down:
	$(DOCKER_COMPOSE) down

restart:
	$(DOCKER_COMPOSE) restart

logs:
	$(DOCKER_COMPOSE) logs -f

logs-backend:
	$(DOCKER_COMPOSE) logs -f backend

logs-frontend:
	$(DOCKER_COMPOSE) logs -f frontend

logs-postgres:
	$(DOCKER_COMPOSE) logs -f postgres

# Database commands
seed:
	@echo "Seeding core data (plans, events, coaches, Instagram)..."
	$(DOCKER_COMPOSE) exec backend python manage.py seed_data
	@echo ""
	@echo "Seeding CMS pages (homepage, blog, team)..."
	$(DOCKER_COMPOSE) exec backend python manage.py seed_wagtail
	@echo ""
	@echo "Seeding test teams, players, and parents..."
	$(DOCKER_COMPOSE) exec backend python manage.py seed_test_teams
	@echo ""
	@echo "Seeding dashboard test data (contacts, dues, cash payments)..."
	$(DOCKER_COMPOSE) exec backend python manage.py seed_test_data
	@echo ""
	@echo "✓ All seed data loaded!"

seed-clean:
	@echo "Removing test data..."
	$(DOCKER_COMPOSE) exec backend python manage.py cleanup_test_data
	$(DOCKER_COMPOSE) exec backend python manage.py seed_test_teams --delete
	@echo ""
	@echo "✓ Test data removed (core data like plans, events, coaches preserved)"

db-shell:
	$(DOCKER_COMPOSE) exec postgres psql -U njstars -d njstars

db-reset:
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(DOCKER_COMPOSE) down -v; \
		$(DOCKER_COMPOSE) up -d postgres; \
		sleep 5; \
		$(DOCKER_COMPOSE) up -d backend frontend; \
	fi

# Testing commands
test:
	@echo "Running backend tests..."
	$(DOCKER_COMPOSE) exec backend pytest
	@echo ""
	@echo "Running frontend tests..."
	$(DOCKER_COMPOSE) exec frontend npm test

test-backend:
	$(DOCKER_COMPOSE) exec backend pytest --cov=app

test-frontend:
	$(DOCKER_COMPOSE) exec frontend npm test

test-backend-watch:
	$(DOCKER_COMPOSE) exec backend pytest --watch

test-frontend-watch:
	$(DOCKER_COMPOSE) exec frontend npm run test:watch

# Shell access
shell-backend:
	$(DOCKER_COMPOSE) exec backend /bin/bash

shell-frontend:
	$(DOCKER_COMPOSE) exec frontend /bin/sh

shell-postgres:
	$(DOCKER_COMPOSE) exec postgres /bin/bash

# Cleanup commands
clean:
	$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans

prune:
	docker system prune -af --volumes

# Production commands
prod-build:
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml build

prod-up:
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml up -d

prod-down:
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml down

prod-logs:
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml logs -f

# Status
status:
	$(DOCKER_COMPOSE) ps

# Stop specific service
stop-backend:
	$(DOCKER_COMPOSE) stop backend

stop-frontend:
	$(DOCKER_COMPOSE) stop frontend

stop-postgres:
	$(DOCKER_COMPOSE) stop postgres

# Restart specific service
restart-backend:
	$(DOCKER_COMPOSE) restart backend

restart-frontend:
	$(DOCKER_COMPOSE) restart frontend

restart-postgres:
	$(DOCKER_COMPOSE) restart postgres
