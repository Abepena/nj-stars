#!/bin/bash
# =============================================================================
# LEAG Development Environment Setup Script
# Runs automatically when the Codespace is created (postCreateCommand)
# =============================================================================

set -e  # Exit on any error

echo "🚀 Setting up LEAG development environment..."

# -----------------------------------------------------------------------------
# 1. Install Claude Code CLI
# -----------------------------------------------------------------------------
echo ""
echo "📦 Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code

# Verify installation
if command -v claude &> /dev/null; then
    echo "✅ Claude Code installed: $(claude --version 2>/dev/null || echo 'version check not available')"
else
    echo "⚠️  Claude Code installation may require manual setup"
fi

# -----------------------------------------------------------------------------
# 2. Install Backend Dependencies
# -----------------------------------------------------------------------------
echo ""
echo "🐍 Setting up Python backend..."
cd /workspace/backend

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    python -m venv .venv
fi

# Activate and install dependencies
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Backend dependencies installed"

# -----------------------------------------------------------------------------
# 3. Install Frontend Dependencies
# -----------------------------------------------------------------------------
echo ""
echo "📦 Setting up Node.js frontend..."
cd /workspace/frontend

# Install npm dependencies
npm install

echo "✅ Frontend dependencies installed"

# -----------------------------------------------------------------------------
# 4. Copy Environment Files (if examples exist)
# -----------------------------------------------------------------------------
echo ""
echo "⚙️  Setting up environment files..."
cd /workspace

# Backend .env
if [ -f "backend/.env.example" ] && [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "📝 Created backend/.env from example"
fi

# Frontend .env.local
if [ -f "frontend/.env.example" ] && [ ! -f "frontend/.env.local" ]; then
    cp frontend/.env.example frontend/.env.local
    echo "📝 Created frontend/.env.local from example"
fi

# Root .env for docker-compose
if [ -f ".env.docker.example" ] && [ ! -f ".env" ]; then
    cp .env.docker.example .env
    echo "📝 Created .env from docker example"
fi

# -----------------------------------------------------------------------------
# 5. Setup Git Configuration
# -----------------------------------------------------------------------------
echo ""
echo "🔧 Configuring Git..."

# Set useful git aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --decorate -20"

# Enable git colors
git config --global color.ui auto

echo "✅ Git configured"

# -----------------------------------------------------------------------------
# 6. Display Helpful Information
# -----------------------------------------------------------------------------
echo ""
echo "============================================================================="
echo "🎉 LEAG Development Environment Ready!"
echo "============================================================================="
echo ""
echo "Quick Start Commands:"
echo "  make up          - Start all Docker services (db, backend, frontend)"
echo "  make logs        - View logs from all services"
echo "  make seed        - Seed database with test data"
echo "  make down        - Stop all services"
echo ""
echo "Claude Code:"
echo "  claude           - Start Claude Code CLI"
echo "  claude auth      - Authenticate with your Anthropic account"
echo ""
echo "Development URLs (after 'make up'):"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  MailHog:   http://localhost:8025"
echo ""
echo "============================================================================="
