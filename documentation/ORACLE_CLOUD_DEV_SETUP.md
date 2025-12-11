# Oracle Cloud Development Environment Setup

> **Purpose:** Offload development compute from your local laptop to Oracle Cloud's Always Free tier.
> **Last Updated:** December 2024

---

## Overview

This guide walks through setting up an Oracle Cloud VM as a remote development server. This allows Claude Code to run resource-intensive operations (Docker builds, tests, etc.) on the cloud VM instead of your laptop.

**Benefits:**
- Free your laptop from CPU/memory-intensive development tasks
- Faster builds on ARM-based Ampere instances
- Persistent development environment you can access from anywhere
- Keep your laptop cool and battery-preserved

---

## Prerequisites

- Oracle Cloud account (free tier: https://www.oracle.com/cloud/free/)
- SSH client on your laptop
- Git installed locally
- ~30 minutes for initial setup

---

## Part 1: Create Oracle Cloud Account & VM

### Step 1: Sign Up for Oracle Cloud Free Tier

1. Go to https://www.oracle.com/cloud/free/
2. Click "Start for free"
3. Fill out registration (requires credit card for verification, but won't be charged)
4. Select your home region (choose one close to you for lower latency)

**Free Tier Includes:**
- 4 Ampere A1 cores (ARM-based, very fast)
- 24 GB RAM total
- 200 GB block storage
- Always Free - never expires!

### Step 2: Create a Compute Instance

1. Log into Oracle Cloud Console: https://cloud.oracle.com/
2. Navigate to: **Compute** → **Instances** → **Create Instance**

3. **Configure the instance:**

   | Setting | Value |
   |---------|-------|
   | Name | `leag-dev-server` |
   | Compartment | (default) |
   | Availability Domain | (any available) |
   | Image | **Ubuntu 22.04** (or latest LTS) |
   | Shape | **VM.Standard.A1.Flex** (Ampere ARM) |
   | OCPUs | 4 (max for free tier) |
   | Memory | 24 GB (max for free tier) |

4. **Networking:**
   - Use default VCN or create new
   - Assign public IPv4 address: **Yes**
   - Subnet: Public subnet

5. **Add SSH Key:**
   - Select "Generate a key pair" OR
   - Upload your existing public key (`~/.ssh/id_rsa.pub`)

   **IMPORTANT:** Download the private key if generating new - you can't retrieve it later!

6. **Boot Volume:**
   - Size: 100-200 GB (free tier allows up to 200 GB total)
   - Keep defaults for encryption

7. Click **Create** and wait ~2-3 minutes for provisioning

### Step 3: Note Your Instance Details

Once created, note these from the Instance Details page:
- **Public IP Address:** (e.g., `129.153.xxx.xxx`)
- **Username:** `ubuntu` (for Ubuntu images)

---

## Part 2: Configure the VM

### Step 1: Connect via SSH

```bash
# If you downloaded the key from Oracle
chmod 400 ~/Downloads/ssh-key-*.key
ssh -i ~/Downloads/ssh-key-*.key ubuntu@<PUBLIC_IP>

# If using your existing key
ssh ubuntu@<PUBLIC_IP>
```

### Step 2: Initial Server Setup

Run these commands on the VM:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y \
  git \
  curl \
  wget \
  unzip \
  htop \
  tmux \
  build-essential \
  python3-pip \
  python3-venv

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Log out and back in for docker group to take effect
exit
```

### Step 3: Reconnect and Verify

```bash
ssh ubuntu@<PUBLIC_IP>

# Verify installations
docker --version
docker-compose --version
node --version
npm --version
python3 --version
```

### Step 4: Configure Firewall (Security List)

Back in Oracle Cloud Console:

1. Go to **Networking** → **Virtual Cloud Networks**
2. Click your VCN → **Security Lists** → Default Security List
3. Add **Ingress Rules** for development ports:

   | Source CIDR | Protocol | Dest Port | Description |
   |-------------|----------|-----------|-------------|
   | 0.0.0.0/0 | TCP | 3000 | Next.js dev server |
   | 0.0.0.0/0 | TCP | 8000 | Django dev server |
   | 0.0.0.0/0 | TCP | 5432 | PostgreSQL (optional) |

4. Also open these ports on the VM's firewall:

```bash
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 5432 -j ACCEPT
sudo netfilter-persistent save
```

---

## Part 3: Clone and Setup the Project

### Step 1: Setup SSH Key for GitHub

```bash
# Generate SSH key on the VM
ssh-keygen -t ed25519 -C "your-email@example.com"

# Display the public key
cat ~/.ssh/id_ed25519.pub
```

Copy this key and add it to GitHub:
1. Go to GitHub → Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste the key and save

### Step 2: Clone the Repository

```bash
# Clone the repo
cd ~
git clone git@github.com:YOUR_USERNAME/leag.git
cd leag/nj-stars

# Copy environment files (you'll need to fill these in)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Step 3: Configure Environment Variables

Edit the `.env` files with your actual values:

```bash
# Backend
nano backend/.env

# Frontend
nano frontend/.env.local
```

### Step 4: Start the Development Environment

```bash
cd ~/leag/nj-stars

# Build and start all services
docker-compose up -d --build

# Seed the database
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py seed_data
docker-compose exec backend python manage.py seed_wagtail

# Check status
docker-compose ps
```

---

## Part 4: Connect Your Local Machine

### Option A: SSH Tunnel (Recommended for Development)

This forwards the remote ports to your localhost:

```bash
# Run this on your LOCAL machine
ssh -L 3000:localhost:3000 -L 8000:localhost:8000 ubuntu@<PUBLIC_IP>
```

Now access:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Option B: Direct Access

Access directly via public IP:
- Frontend: http://<PUBLIC_IP>:3000
- Backend: http://<PUBLIC_IP>:8000

**Note:** Update CORS settings in Django for the public IP if using direct access.

### Option C: VS Code Remote Development

1. Install "Remote - SSH" extension in VS Code
2. Press `Cmd+Shift+P` → "Remote-SSH: Connect to Host"
3. Enter: `ubuntu@<PUBLIC_IP>`
4. Open the project folder: `/home/ubuntu/leag/nj-stars`

Now you're editing files directly on the VM with full IDE support!

---

## Part 5: Running Claude Code on the VM

### Option 1: SSH Session with tmux

```bash
# Connect to VM
ssh ubuntu@<PUBLIC_IP>

# Start tmux session (persists if disconnected)
tmux new -s claude

# Navigate to project
cd ~/leag/nj-stars

# Run Claude Code
claude

# Detach from tmux: Ctrl+B, then D
# Reattach later: tmux attach -t claude
```

### Option 2: Install Claude Code on VM

```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Authenticate (follow prompts)
claude auth

# Start working
cd ~/leag/nj-stars
claude
```

### Option 3: Keep Local Claude, Remote Docker

Run Claude locally but point it at the remote Docker:

```bash
# On your LOCAL machine, set Docker host to remote
export DOCKER_HOST=ssh://ubuntu@<PUBLIC_IP>

# Now docker commands run on the VM
docker ps  # Shows VM containers

# Run Claude locally - it uses remote Docker
cd /path/to/local/leag/nj-stars
claude
```

---

## Part 6: Useful Commands

### Managing the VM

```bash
# Check resource usage
htop

# View Docker logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop everything
docker-compose down

# Free up disk space
docker system prune -a
```

### Keeping Sessions Alive

```bash
# Start a persistent tmux session
tmux new -s dev

# Detach: Ctrl+B, then D
# List sessions: tmux ls
# Reattach: tmux attach -t dev
```

### Syncing Code Changes

If editing locally and running on VM:

```bash
# Push changes from local
git add . && git commit -m "changes" && git push

# Pull on VM
ssh ubuntu@<PUBLIC_IP> "cd ~/leag/nj-stars && git pull"
```

Or use `rsync` for faster syncing:

```bash
# Sync local changes to VM (excluding node_modules, etc.)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '__pycache__' \
  ~/Desktop/Projects/leag/nj-stars/ \
  ubuntu@<PUBLIC_IP>:~/leag/nj-stars/
```

---

## Part 7: Cost & Limits

### Always Free Tier Limits

| Resource | Limit |
|----------|-------|
| Ampere A1 Compute | 4 OCPUs, 24 GB RAM total |
| Block Storage | 200 GB total |
| Object Storage | 20 GB |
| Outbound Data | 10 TB/month |

### Tips to Stay Free

1. **Don't create multiple VMs** - use one VM with max resources
2. **Use block storage wisely** - 200 GB is shared across all volumes
3. **Monitor usage** in OCI Console → Governance → Limits
4. **Set budget alerts** at $0 to catch any accidental charges

---

## Troubleshooting

### Can't Connect via SSH

```bash
# Check if instance is running in OCI Console
# Verify security list has port 22 open
# Try with verbose output
ssh -v ubuntu@<PUBLIC_IP>
```

### Docker Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
exit
```

### Port Not Accessible

1. Check Oracle Security List (OCI Console)
2. Check VM firewall: `sudo iptables -L`
3. Check if service is running: `docker-compose ps`
4. Check if bound to 0.0.0.0: `netstat -tlnp`

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a

# Find large files
du -sh /* 2>/dev/null | sort -h
```

---

## Quick Reference Card

```bash
# Connect to VM
ssh ubuntu@<PUBLIC_IP>

# Start development environment
cd ~/leag/nj-stars && docker-compose up -d

# View logs
docker-compose logs -f

# Run Claude in persistent session
tmux new -s claude
claude

# SSH tunnel for local access
ssh -L 3000:localhost:3000 -L 8000:localhost:8000 ubuntu@<PUBLIC_IP>
```

---

## Next Steps

1. [ ] Create Oracle Cloud account
2. [ ] Provision VM instance
3. [ ] Configure SSH access
4. [ ] Install Docker and dependencies
5. [ ] Clone repository
6. [ ] Configure environment variables
7. [ ] Start Docker services
8. [ ] Test access from local machine
9. [ ] Run Claude Code on VM

---

*Questions? Check Oracle's documentation: https://docs.oracle.com/en-us/iaas/Content/home.htm*
