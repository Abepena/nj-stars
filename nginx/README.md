# Nginx Configuration

This directory contains nginx configuration files for the NJ Stars platform.

## Files

- `nginx.conf` - Main nginx configuration
- `conf.d/default.conf` - Server configuration for development/production
- `ssl/` - SSL/TLS certificates (not included, add your own)

## Development

Nginx is optional in development. The frontend and backend can be accessed directly on their respective ports.

## Production

For production deployments, nginx acts as a reverse proxy:

```
Client Request → Nginx :80 → Frontend :3000
                         └→ Backend :8000 (/api/*)
```

### SSL/TLS Setup

1. Obtain SSL certificates (e.g., Let's Encrypt)
2. Create `ssl/` directory
3. Copy certificates:
   - `fullchain.pem` - Certificate chain
   - `privkey.pem` - Private key
4. Update `conf.d/default.conf` with HTTPS configuration

### Custom Configuration

To add custom nginx configuration:

1. Create a new file in `conf.d/` (e.g., `custom.conf`)
2. Restart nginx: `docker-compose restart nginx`

## Security Headers

The default configuration includes:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

Add additional headers as needed in `conf.d/default.conf`.
