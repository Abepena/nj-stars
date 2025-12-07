# syntax=docker/dockerfile:1

# Base image with Python 3.11 for Django
FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

# System deps for psycopg2 and Pillow
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ---------- Development image ----------
FROM base AS development
ENV DJANGO_SETTINGS_MODULE=config.settings.development
WORKDIR /app
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# ---------- Production image ----------
FROM base AS production
ENV DJANGO_SETTINGS_MODULE=config.settings.production
WORKDIR /app
COPY . .

# Create entrypoint script that runs migrations and starts gunicorn
# Uses $PORT from environment (Railway sets this dynamically)
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Collecting static files..."\n\
python manage.py collectstatic --noinput\n\
echo "Running migrations..."\n\
python manage.py migrate --noinput\n\
echo "Starting gunicorn on port ${PORT:-8000}..."\n\
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
