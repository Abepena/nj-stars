# Docker Deployment Guide - NJ Stars Platform

Complete guide for running the NJ Stars Basketball platform using Docker containers.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development](#development)
- [Production](#production)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (20.10 or later)
- **Docker Compose** (2.0 or later)
- **Make** (optional, but recommended)

### Installing Docker

**macOS:**
```bash
brew install --cask docker
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

**Windows:**
Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Verify Installation

```bash
docker --version
docker-compose --version
```

---

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd nj-stars

# Copy environment file
cp .env.docker.example .env.docker

# Edit with your values
nano .env.docker  # or use your preferred editor
```

### 2. Start Services

**Using Make (Recommended):**
```bash
make build    # Build Docker images
make up       # Start all services
make logs     # View logs
```

**Using Docker Compose:**
```bash
docker-compose build
docker-compose up -d
docker-compose logs -f
```

### 3. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

### 4. Seed Database (Optional)

```bash
make seed
# or
docker-compose exec backend python seed_data.py
```

---

## Architecture

### Services

The platform runs four main services:

1. **PostgreSQL** (`postgres`)
   - Port: 5432
   - Data persistence via Docker volumes
   - Auto-initialized with schema

2. **Backend API** (`backend`)
   - FastAPI application
   - Port: 8000
   - Hot-reload enabled in development

3. **Frontend** (`frontend`)
   - Next.js application
   - Port: 3000
   - Hot-reload enabled in development

4. **Nginx** (`nginx`) *[Optional - Production]*
   - Reverse proxy
   - Port: 80, 443
   - SSL/TLS termination
   - Load balancing

### Network

All services communicate on a private Docker network (`njstars-network`):

```
┌─────────────┐
│   Nginx     │ :80, :443
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
┌──▼───┐ ┌──▼──────┐
│Frontend│ │ Backend │
│  :3000│ │  :8000  │
└───────┘ └────┬────┘
               │
          ┌────▼────┐
          │PostgreSQL│
          │  :5432  │
          └─────────┘
```

### Volumes

- `postgres_data` - Database persistence
- `backend_cache` - Python cache (development)

---

## Development

### Starting Development Environment

```bash
# Build and start all services
make build && make up

# View logs
make logs

# Access specific service logs
make logs-backend
make logs-frontend
make logs-postgres
```

### Hot Reload

Both frontend and backend support hot reload in development:

- **Backend:** Modify files in `backend/`, server auto-restarts
- **Frontend:** Modify files in `frontend/`, page auto-refreshes

### Running Tests

```bash
# Run all tests
make test

# Backend tests only
make test-backend

# Frontend tests only
make test-frontend

# Watch mode
make test-backend-watch
make test-frontend-watch
```

### Shell Access

Access container shells for debugging:

```bash
# Backend shell
make shell-backend

# Frontend shell
make shell-frontend

# PostgreSQL shell
make db-shell
```

### Database Operations

```bash
# Seed database with test data
make seed

# Access PostgreSQL CLI
make db-shell

# Reset database (⚠️ DELETES ALL DATA)
make db-reset
```

---

## Production

### Building Production Images

Production images use multi-stage builds for optimized size:

```bash
# Build production images
make prod-build
```

**Image sizes:**
- Backend: ~200MB (vs ~400MB dev)
- Frontend: ~150MB (vs ~500MB dev)

### Starting Production Environment

```bash
# Start production services
make prod-up

# View production logs
make prod-logs

# Stop production services
make prod-down
```

### Production Configuration

1. **Copy production environment file:**
   ```bash
   cp .env.docker.example .env.production
   ```

2. **Update production variables:**
   ```bash
   # Required changes
   POSTGRES_PASSWORD=<strong-random-password>
   SECRET_KEY=<generate-with-openssl>
   NEXTAUTH_SECRET=<generate-with-openssl>
   FRONTEND_URL=https://yourdomain.com
   NEXT_PUBLIC_API_URL=https://yourdomain.com/api
   NEXTAUTH_URL=https://yourdomain.com
   ```

3. **Generate secrets:**
   ```bash
   # Backend secret key
   openssl rand -hex 32

   # NextAuth secret
   openssl rand -base64 32
   ```

4. **Start with production compose file:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### SSL/TLS Setup

For HTTPS in production:

1. **Obtain SSL certificates:**
   ```bash
   # Using Let's Encrypt (recommended)
   certbot certonly --standalone -d yourdomain.com
   ```

2. **Copy certificates:**
   ```bash
   mkdir -p nginx/ssl
   cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
   cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
   ```

3. **Update nginx configuration** (see `nginx/conf.d/default.conf`)

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | Database username | `njstars` |
| `POSTGRES_PASSWORD` | Database password | `secure_password_123` |
| `POSTGRES_DB` | Database name | `njstars` |
| `SECRET_KEY` | Backend JWT secret | `<random-hex-32>` |
| `NEXTAUTH_SECRET` | NextAuth secret | `<random-base64>` |

### Optional Variables

| Variable | Description | Required For |
|----------|-------------|--------------|
| `STRIPE_SECRET_KEY` | Stripe API key | Payments |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key | Payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Payments |
| `GOOGLE_CLIENT_ID` | Google OAuth | Social Login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Social Login |
| `INSTAGRAM_ACCESS_TOKEN` | Instagram API | Social Feed |
| `INSTAGRAM_USER_ID` | Instagram User ID | Social Feed |

### Environment Files

- `.env.docker` - Development configuration
- `.env.production` - Production configuration
- `.env.docker.example` - Template with all variables

---

## Database

### Connecting to PostgreSQL

**From host machine:**
```bash
psql -h localhost -U njstars -d njstars
# Password: <POSTGRES_PASSWORD from .env.docker>
```

**From within container:**
```bash
make db-shell
```

### Database Migrations

Tables are created automatically by SQLAlchemy on first run:

```bash
# Start backend (tables auto-created)
make up

# Check tables
make db-shell
\dt
```

### Backup and Restore

**Backup:**
```bash
docker-compose exec postgres pg_dump -U njstars njstars > backup.sql
```

**Restore:**
```bash
cat backup.sql | docker-compose exec -T postgres psql -U njstars -d njstars
```

### Seeding Data

```bash
# Seed with test data
make seed

# Or manually
docker-compose exec backend python seed_data.py
```

---

## Troubleshooting

### Common Issues

**1. Port Already in Use**

```bash
# Find process using port
lsof -i :3000  # or :8000, :5432

# Stop the process or change port in docker-compose.yml
```

**2. Container Fails to Start**

```bash
# Check logs
make logs-backend

# Check specific container
docker-compose logs backend

# Restart specific service
make restart-backend
```

**3. Database Connection Refused**

```bash
# Wait for PostgreSQL to be ready
docker-compose logs postgres

# Check health status
docker-compose ps

# Manually check connection
docker-compose exec backend python -c "from app.core.database import engine; engine.connect()"
```

**4. Permission Denied**

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Or run with sudo (not recommended)
sudo docker-compose up
```

**5. Out of Disk Space**

```bash
# Check Docker disk usage
docker system df

# Clean up unused resources
make prune

# Remove all stopped containers and unused images
docker system prune -af --volumes
```

### Debugging

**Check service status:**
```bash
make status
# or
docker-compose ps
```

**View real-time logs:**
```bash
# All services
make logs

# Specific service
docker-compose logs -f backend
```

**Inspect containers:**
```bash
# Container details
docker inspect njstars-backend

# Resource usage
docker stats
```

**Network issues:**
```bash
# List networks
docker network ls

# Inspect network
docker network inspect njstars_njstars-network
```

---

## Advanced Usage

### Custom Docker Compose Overrides

Create `docker-compose.override.yml` for local customizations:

```yaml
version: '3.8'
services:
  backend:
    environment:
      DEBUG: "true"
    ports:
      - "8001:8000"  # Different host port
```

### Multi-Container Testing

Run tests in isolated containers:

```bash
# Backend tests in container
docker-compose run --rm backend pytest

# Frontend tests in container
docker-compose run --rm frontend npm test
```

### Building Specific Services

```bash
# Build only backend
docker-compose build backend

# Build with no cache
docker-compose build --no-cache backend
```

### Resource Limits

Add resource limits in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### Health Checks

All services include health checks:

```bash
# Check health status
docker-compose ps

# View health check logs
docker inspect njstars-backend | grep Health
```

### Scaling Services

```bash
# Run multiple backend instances
docker-compose up -d --scale backend=3
```

---

## Maintenance

### Updates

**Pull latest images:**
```bash
docker-compose pull
```

**Rebuild after code changes:**
```bash
make build
make restart
```

**Update base images:**
```bash
docker-compose build --pull
```

### Cleanup

```bash
# Stop and remove containers
make down

# Remove all containers, volumes, and images
make clean

# Remove unused Docker resources
make prune
```

### Monitoring

**Resource usage:**
```bash
docker stats
```

**Logs:**
```bash
# Follow logs
make logs

# Last 100 lines
docker-compose logs --tail=100

# Since specific time
docker-compose logs --since 2024-01-01T00:00:00
```

---

## Production Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Generate secure random secrets
- [ ] Configure SSL/TLS certificates
- [ ] Set up automated backups
- [ ] Configure monitoring and alerts
- [ ] Review and limit exposed ports
- [ ] Enable container auto-restart policies
- [ ] Set up log aggregation
- [ ] Configure firewall rules
- [ ] Test disaster recovery procedures
- [ ] Document deployment process
- [ ] Set up CI/CD pipeline

---

## Useful Commands Reference

```bash
# Service Management
make build              # Build images
make up                 # Start services
make down               # Stop services
make restart            # Restart services
make logs               # View logs

# Database
make seed               # Seed database
make db-shell           # PostgreSQL CLI
make db-reset           # Reset database

# Testing
make test               # Run all tests
make test-backend       # Backend tests
make test-frontend      # Frontend tests

# Shell Access
make shell-backend      # Backend shell
make shell-frontend     # Frontend shell

# Cleanup
make clean              # Remove all
make prune              # Prune unused

# Production
make prod-build         # Build production
make prod-up            # Start production
make prod-down          # Stop production
```

---

## Support

For issues and questions:
- Check logs: `make logs`
- Review documentation: `README.md`, `TESTING.md`
- Contact: admin@njstarsbasketball.com

---

**Happy Dockering! 🐳**
