# NJ Stars Deployment Guide

This guide covers deploying the NJ Stars platform to production using Railway (backend) and Vercel (frontend).

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │────▶│   Railway       │────▶│   Railway       │
│   (Frontend)    │     │   (Backend)     │     │   (PostgreSQL)  │
│   Next.js       │     │   Django/Wagtail│     │   Database      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
   njstarselite.com      api.njstarselite.com
```

---

## Part 1: Railway (Backend + Database)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub

### Step 2: Create New Project
1. From the Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select **`nj-stars`**
4. Railway will detect it's a monorepo

### Step 3: Add PostgreSQL Database
1. In your project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway automatically provisions the database
3. Click on the PostgreSQL service to see connection details
4. Note the `DATABASE_URL` (you'll need this for the backend)

### Step 4: Configure Backend Service
1. Click on the GitHub service (your repo)
2. Go to **Settings** tab
3. Set the following:

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT` |

### Step 5: Add Environment Variables
Go to **Variables** tab and add:

```bash
# Django Settings
SECRET_KEY=<generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings.production
ALLOWED_HOSTS=.railway.app,.njstarselite.com

# Database (Railway provides this automatically if you link the services)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Frontend URL (update after Vercel deployment)
FRONTEND_URL=https://njstarselite.com

# Stripe
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Instagram
INSTAGRAM_ACCESS_TOKEN=<your-token>
```

### Step 6: Link Database to Backend
1. Click on your backend service
2. Go to **Variables** tab
3. Click **"Add Reference"** → Select your PostgreSQL service
4. This auto-populates `DATABASE_URL`

### Step 7: Generate Domain
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"** to get a `.railway.app` URL
3. Or add custom domain: `api.njstarselite.com`

### Step 8: Deploy
1. Railway auto-deploys on push to `main`
2. Check **Deployments** tab for build logs
3. Once deployed, test: `https://your-app.railway.app/api/events/`

### Troubleshooting Railway
- **Build fails**: Check that `requirements.txt` is in `/backend`
- **502 errors**: Check start command and that gunicorn is in requirements
- **Database errors**: Verify `DATABASE_URL` is linked correctly

---

## Part 2: Vercel (Frontend)

> **Prerequisite**: Complete Railway setup first. You need the backend URL.

### Step 1: Sign In to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"**

### Step 2: Import Repository
1. From dashboard, click **"Add New..."** → **"Project"**
2. Find **`nj-stars`** and click **"Import"**

### Step 3: Configure Project Settings

| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` (click "Edit" to change) |
| **Framework Preset** | Next.js (auto-detected) |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | Leave default |

### Step 4: Add Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Maintenance Mode (set to 'true' for Under Construction page)
NEXT_PUBLIC_MAINTENANCE_MODE=true

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Sak...

# NextAuth
NEXTAUTH_URL=https://njstarselite.com
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# OAuth (optional - for member portal)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait 1-2 minutes for build
3. You'll get a `.vercel.app` preview URL
4. Test the Under Construction page appears

### Step 6: Add Custom Domain
1. Go to **Project Settings** → **Domains**
2. Click **"Add"** and enter `njstarselite.com`
3. Add DNS records at your registrar:

| Type | Name | Value |
|------|------|-------|
| A | @ | `76.76.21.21` |
| CNAME | www | `cname.vercel-dns.com` |

4. Wait for DNS propagation (5 min - 48 hours)
5. Vercel auto-provisions SSL certificate

### Step 7: Verify Deployment
1. Visit `https://njstarselite.com`
2. You should see the Under Construction page
3. Check that the animation and contact links work

---

## Part 3: Post-Deployment

### Update Backend FRONTEND_URL
After Vercel is deployed, update Railway:
1. Go to Railway → Backend service → Variables
2. Update `FRONTEND_URL=https://njstarselite.com`
3. Redeploy

### Configure Stripe Webhooks
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-backend.railway.app/api/v1/webhooks/stripe/`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, etc.
4. Copy webhook secret to Railway `STRIPE_WEBHOOK_SECRET`

### Set Up Custom Backend Domain (Optional)
1. In Railway, go to Settings → Networking → Custom Domain
2. Add `api.njstarselite.com`
3. Add CNAME record at registrar pointing to Railway

---

## Maintenance Mode

### Enable Under Construction Page
In Vercel environment variables:
```
NEXT_PUBLIC_MAINTENANCE_MODE=true
```

### Disable (Go Live)
```
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

After changing, trigger a redeploy in Vercel.

---

## Quick Reference

### Railway Commands (via CLI)
```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up

# View logs
railway logs
```

### Vercel Commands (via CLI)
```bash
# Install CLI
npm install -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod

# View environment variables
vercel env ls
```

---

## Environment Variables Checklist

### Railway (Backend)
- [ ] `SECRET_KEY`
- [ ] `DEBUG=False`
- [ ] `DJANGO_SETTINGS_MODULE=config.settings.production`
- [ ] `ALLOWED_HOSTS`
- [ ] `DATABASE_URL` (linked from PostgreSQL)
- [ ] `FRONTEND_URL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

### Vercel (Frontend)
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXT_PUBLIC_MAINTENANCE_MODE`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `GOOGLE_CLIENT_ID` (optional)
- [ ] `GOOGLE_CLIENT_SECRET` (optional)
