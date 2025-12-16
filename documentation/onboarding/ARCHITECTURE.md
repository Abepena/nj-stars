# System Architecture

## Overview

```
Frontend (Next.js)     →     Backend (Django)     →     PostgreSQL
   :3000                        :8000                     :5432
      │                            │
      └── Stripe Checkout          ├── Printify API
                                   └── Cloudinary
```

## Django Apps

| App | Purpose |
|-----|---------|
| `core` | Coaches, Instagram, Newsletter |
| `events` | Events, calendar sync |
| `payments` | Products, orders, Stripe, Printify |
| `portal` | User profiles, players, waivers |
| `cms` | Wagtail pages (Home, Blog, Team) |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/events/` | List events |
| `/api/coaches/` | List coaches |
| `/api/payments/products/` | List products |
| `/api/payments/bag/` | Shopping bag |
| `/api/portal/profile/` | User profile |
| `/api/v2/pages/` | Wagtail CMS pages |

## Data Flow: Checkout

1. Customer adds to bag
2. Checkout → Stripe session created
3. Customer pays on Stripe
4. Webhook → Order created
5. POD items → Submitted to Printify
6. Printify ships → Webhook updates tracking
