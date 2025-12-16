# Common Issues & Solutions

## Docker Issues

### "Cannot connect to Docker daemon"
```bash
open -a Docker  # Start Docker Desktop
```

### "relation does not exist"
```bash
docker exec njstars-backend python manage.py migrate
```

### Frontend ERR_CONNECTION_REFUSED
```bash
rm -rf frontend/.next frontend/next-env.d.ts
docker restart njstars-frontend
```

### "Unknown system error -35" 
```bash
rm -rf frontend/.next
docker restart njstars-frontend
```

---

## Frontend Issues

### Shop/Products Empty
```bash
docker exec njstars-backend python manage.py import_printify_products
```

### News Feed Empty
```bash
make seed
```

---

## Backend Issues

### Printify Not Working
Check `backend/.env`:
```
PRINTIFY_API_KEY=eyJ0eXA...
PRINTIFY_SHOP_ID=12345678
```

### Wagtail 500 Error
```bash
docker exec njstars-backend python manage.py migrate
docker exec njstars-backend python manage.py seed_wagtail
```

---

## Nuclear Reset

```bash
make down
docker volume rm nj-stars_postgres_data nj-stars_backend_cache
make build && make up
docker exec njstars-backend python manage.py migrate
make seed
docker exec njstars-backend python manage.py import_printify_products
```
