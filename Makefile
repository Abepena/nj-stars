.PHONY: help build up down restart logs shell-backend shell-frontend seed test clean

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
	@echo "  make seed           - Seed database with test data"
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
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-postgres:
	docker-compose logs -f postgres

# Database commands
seed:
	docker-compose exec backend python seed_data.py

db-shell:
	docker-compose exec postgres psql -U njstars -d njstars

db-reset:
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		docker-compose up -d postgres; \
		sleep 5; \
		docker-compose up -d backend frontend; \
	fi

# Testing commands
test:
	@echo "Running backend tests..."
	docker-compose exec backend pytest
	@echo ""
	@echo "Running frontend tests..."
	docker-compose exec frontend npm test

test-backend:
	docker-compose exec backend pytest --cov=app

test-frontend:
	docker-compose exec frontend npm test

test-backend-watch:
	docker-compose exec backend pytest --watch

test-frontend-watch:
	docker-compose exec frontend npm run test:watch

# Shell access
shell-backend:
	docker-compose exec backend /bin/bash

shell-frontend:
	docker-compose exec frontend /bin/sh

shell-postgres:
	docker-compose exec postgres /bin/bash

# Cleanup commands
clean:
	docker-compose down -v --rmi all --remove-orphans

prune:
	docker system prune -af --volumes

# Production commands
prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

# Status
status:
	docker-compose ps

# Stop specific service
stop-backend:
	docker-compose stop backend

stop-frontend:
	docker-compose stop frontend

stop-postgres:
	docker-compose stop postgres

# Restart specific service
restart-backend:
	docker-compose restart backend

restart-frontend:
	docker-compose restart frontend

restart-postgres:
	docker-compose restart postgres
