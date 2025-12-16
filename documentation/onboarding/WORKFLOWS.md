# Common Development Workflows

## Adding an API Endpoint

1. Create model in `backend/apps/<app>/models.py`
2. Run migrations: `docker exec njstars-backend python manage.py makemigrations && python manage.py migrate`
3. Create serializer in `serializers.py`
4. Create viewset in `views.py`
5. Register in `urls.py`
6. Add TypeScript types in `frontend/src/types/`

## Adding a Frontend Page

1. Create route: `frontend/src/app/<route>/page.tsx`
2. Add metadata for SEO
3. Create loading.tsx for loading state

## Syncing Printify

```bash
# Import all products
docker exec njstars-backend python manage.py import_printify_products

# Sync specific product
docker exec njstars-backend python manage.py sync_printify_variants --product=<slug>
```

## Git Workflow

```bash
git checkout dev && git pull
git checkout -b feature/my-feature
# make changes
git push -u origin feature/my-feature
git checkout dev && git merge feature/my-feature
```

## Debugging

```bash
make logs-backend           # Check backend logs
docker exec -it njstars-backend python manage.py shell  # Django shell
docker exec -it njstars-postgres psql -U njstars        # DB shell
```
