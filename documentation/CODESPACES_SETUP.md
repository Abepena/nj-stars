# GitHub Codespaces Development Setup

> **Purpose:** Run the LEAG development environment in the cloud using GitHub Codespaces.
> **Last Updated:** December 2024

---

## Overview

GitHub Codespaces provides a complete, cloud-based development environment that runs in your browser or VS Code. This offloads CPU/memory intensive tasks (Docker builds, tests, Claude Code) from your local machine.

**Free Tier:** 60 hours/month on 2-core machines (resets monthly)

---

## Quick Start

### Option 1: From GitHub (Browser)

1. Go to the [LEAG repository](https://github.com/YOUR_USERNAME/leag)
2. Click **Code** → **Codespaces** → **Create codespace on dev**
3. Wait ~3-5 minutes for the environment to build
4. You're ready! The terminal will show setup completion

### Option 2: From VS Code

1. Install the **GitHub Codespaces** extension
2. Press `Cmd+Shift+P` → **"Codespaces: Create New Codespace"**
3. Select the `leag` repository and `dev` branch
4. Choose **2-core (8 GB RAM)** for free tier

---

## What's Pre-Installed

The devcontainer automatically configures:

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 20 LTS | Frontend development |
| **Python** | 3.11 | Backend development |
| **Docker** | Latest | Container orchestration |
| **Docker Compose** | v2 | Multi-container apps |
| **Claude Code** | Latest | AI-powered development |
| **GitHub CLI** | Latest | Git operations |
| **PostgreSQL Client** | 15 | Database access |

### VS Code Extensions

Pre-installed for productivity:
- Python + Pylance
- ESLint + Prettier
- Tailwind CSS IntelliSense
- Django support
- Docker tools
- GitLens
- SQL Tools

---

## Starting Development

Once your Codespace is ready:

```bash
# Start all services (PostgreSQL, Backend, Frontend, MailHog)
make up

# Seed the database with test data
make seed

# View logs
make logs
```

**Access your apps:**
- Frontend: Click the "Ports" tab → Port 3000 → Open in Browser
- Backend API: Port 8000
- MailHog (email testing): Port 8025

---

## Using Claude Code

Claude Code is pre-installed. To use it:

```bash
# Authenticate (first time only)
claude auth

# Start Claude Code in the project
cd /workspace
claude
```

**Tips:**
- Claude has full access to the codebase
- Docker commands run on Codespaces infrastructure (not your laptop!)
- Terminal persists in tmux-style sessions

---

## Port Forwarding

Codespaces automatically forwards these ports:

| Port | Service | Auto-Forward |
|------|---------|--------------|
| 3000 | Next.js Frontend | Notify on access |
| 8000 | Django Backend | Notify on access |
| 5432 | PostgreSQL | Silent |
| 8025 | MailHog UI | Silent |

Click the **Ports** tab in VS Code to see forwarded URLs.

---

## Environment Variables

### Secrets (Sensitive)

Add secrets via GitHub:
1. Go to repository **Settings** → **Secrets and variables** → **Codespaces**
2. Add:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

### Non-Sensitive Variables

The setup script copies `.env.example` files automatically. Edit as needed:
- `backend/.env`
- `frontend/.env.local`

---

## Useful Commands

### Docker

```bash
make up              # Start all services
make down            # Stop all services
make logs            # View all logs
make logs-backend    # Backend logs only
make logs-frontend   # Frontend logs only
make restart         # Restart everything
```

### Database

```bash
make seed            # Seed test data
make db-shell        # PostgreSQL shell
make db-reset        # Reset database (WARNING: deletes data)
```

### Development

```bash
# Backend shell (Django)
make shell-backend
python manage.py makemigrations
python manage.py migrate

# Frontend shell
make shell-frontend
npm run build
npm run lint
```

### Claude Code

```bash
claude               # Start Claude Code
claude auth          # Authenticate
```

---

## Codespace Lifecycle

### Stopping

Codespaces auto-stop after 30 minutes of inactivity. To manually stop:
- Click **Codespaces** in bottom-left → **Stop Current Codespace**

### Resuming

Your Codespace persists until deleted:
1. Go to [github.com/codespaces](https://github.com/codespaces)
2. Click on your existing Codespace to resume

### Deleting

Free up hours by deleting unused Codespaces:
1. Go to [github.com/codespaces](https://github.com/codespaces)
2. Click **...** → **Delete**

---

## Troubleshooting

### "Port already in use"

```bash
# Find and kill process using the port
lsof -i :3000
kill -9 <PID>

# Or restart Docker services
make down && make up
```

### Docker Build Failures

```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
make down
docker compose build --no-cache
make up
```

### Claude Code Authentication Issues

```bash
# Re-authenticate
claude auth logout
claude auth
```

### Slow Performance

- Check your Codespace machine type (2-core vs 4-core)
- Close unnecessary browser tabs
- Use VS Code desktop app instead of browser for better performance

---

## Cost Management

### Free Tier Limits

| Machine Type | Free Hours/Month | Notes |
|--------------|------------------|-------|
| 2-core, 8GB | 60 hours | Default, sufficient for most work |
| 4-core, 16GB | 30 hours | Better for heavy Docker workloads |

### Tips to Stay Under Limit

1. **Stop when not using** - Don't leave Codespaces running idle
2. **Use 2-core machines** - 60 hours is plenty for regular dev work
3. **Delete unused Codespaces** - Each one counts against your limit
4. **Check usage** - Settings → Billing → Codespaces

---

## Comparison: Local vs Codespaces

| Aspect | Local Development | Codespaces |
|--------|-------------------|------------|
| **Setup Time** | 30+ minutes | ~5 minutes |
| **Laptop Load** | High (Docker, builds) | Minimal (just VS Code) |
| **Consistency** | Varies by machine | Identical environment |
| **Offline Work** | ✅ Yes | ❌ No |
| **Cost** | Free | 60 free hrs/month |

**Recommendation:** Use Codespaces for heavy development sessions, local for quick edits and offline work.

---

## Related Documentation

- [Development Commands](../CLAUDE.md#development-commands)
- [Docker Setup](./DOCKER.md)
