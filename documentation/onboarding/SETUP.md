# Detailed Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | Latest | [docker.com](https://docker.com) |
| Git | 2.x+ | `brew install git` |
| Railway CLI | Latest | `brew install railway` |

---

## Step 1: Clone Repository

```bash
git clone <repository-url> nj-stars
cd nj-stars
```

## Step 2: Start Docker

```bash
open -a Docker  # macOS - wait for it to fully start
docker info     # Verify it's running
```

## Step 3: Environment Variables

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys
```

**Required variables:**
- `SECRET_KEY` - Django secret key
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `PRINTIFY_API_KEY` - From Printify settings
- `PRINTIFY_SHOP_ID` - Your Printify shop ID

## Step 4: Start Containers

```bash
make up
# Wait for all containers to show "healthy"
docker ps
```

## Step 5: Initialize Database

```bash
docker exec njstars-backend python manage.py migrate
make seed
docker exec njstars-backend python manage.py import_printify_products
```

## Step 6: Create Superuser

```bash
docker exec -it njstars-backend python manage.py createsuperuser
```

## Step 7: Verify

- Frontend: http://localhost:3000
- Wagtail: http://localhost:8000/cms-admin/
- API: http://localhost:8000/api/coaches/

---

## Stripe Webhooks (Optional)

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:8000/api/payments/webhook/stripe/
```
