# LEAG Development Container
# Base image with common development tools
FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install additional system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build essentials
    build-essential \
    # PostgreSQL client (for psql commands)
    postgresql-client \
    # Useful utilities
    curl \
    wget \
    git \
    vim \
    htop \
    jq \
    # Required for some Python packages
    libpq-dev \
    # Clean up
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Switch to vscode user for remaining setup
USER vscode

# Set up shell customizations
RUN echo 'alias ll="ls -la"' >> ~/.zshrc \
    && echo 'alias dc="docker compose"' >> ~/.zshrc \
    && echo 'alias dcu="docker compose up -d"' >> ~/.zshrc \
    && echo 'alias dcd="docker compose down"' >> ~/.zshrc \
    && echo 'alias dcl="docker compose logs -f"' >> ~/.zshrc \
    && echo 'alias mk="make"' >> ~/.zshrc

# Set working directory
WORKDIR /workspace

# Default command
CMD ["sleep", "infinity"]
