# NJ Stars Basketball Platform

A comprehensive web platform for NJ Stars AAU Basketball Team featuring a public-facing website, e-commerce merch store, and protected member portal with role-based access control.

## Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Authentication:** NextAuth.js (Auth.js)
- **Payments:** Stripe.js

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL with SQLAlchemy ORM
- **Authentication:** JWT + OAuth
- **Payments:** Stripe API (Checkout & Webhooks)
- **Integrations:** Instagram Basic Display API

## Features

### 1. Public-Facing Site
- **Hero Section:** Mission statement and newsletter signup
- **The Huddle (News Feed):** Unified masonry grid combining:
  - Internal blog posts (CMS content)
  - Latest Instagram posts (via API)
- **Events Calendar:** Display open gyms, tryouts, games, and tournaments

### 2. Merch Store (E-commerce)
- Product grid with categories
- Stripe Checkout integration
- Webhook handler for order processing
- Inventory management

### 3. The Portal (Protected Routes)
- **Social Login:** Google OAuth + Email/Password
- **Role-Based Access Control:**
  - **Admin:** Manage events, roster, view orders
  - **Parent/Player:** View schedules, pay fees

## Project Structure

```
nj-stars/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/        # API endpoints
│   │   │       ├── blog.py
│   │   │       ├── products.py
│   │   │       ├── events.py
│   │   │       ├── stripe_checkout.py
│   │   │       └── stripe_webhook.py
│   │   ├── core/              # Configuration & Database
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/            # SQLAlchemy Models
│   │   │   ├── user.py
│   │   │   ├── blog_post.py
│   │   │   ├── stripe_order.py
│   │   │   ├── product.py
│   │   │   └── event.py
│   │   ├── services/          # Business Logic
│   │   │   └── instagram.py
│   │   └── main.py            # FastAPI Application
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                  # Next.js Frontend
    ├── src/
    │   ├── app/               # App Router Pages
    │   │   ├── page.tsx       # Home page
    │   │   ├── news/          # News feed
    │   │   ├── shop/          # Merch store
    │   │   ├── events/        # Events calendar
    │   │   ├── portal/        # Protected portal
    │   │   │   ├── login/
    │   │   │   └── dashboard/
    │   │   └── api/auth/      # NextAuth config
    │   ├── components/        # React Components
    │   │   ├── ui/            # shadcn/ui components
    │   │   ├── news-feed.tsx
    │   │   └── checkout-button.tsx
    │   ├── lib/               # Utilities
    │   └── types/             # TypeScript types
    ├── package.json
    └── .env.example
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Stripe Account
- Google OAuth Credentials (optional)
- Instagram Basic Display API Token (optional)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up database:**
   ```bash
   # Create PostgreSQL database
   createdb njstars

   # Database tables will be created automatically on first run
   ```

6. **Run the server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`
   - Alternative Docs: `http://localhost:8000/redoc`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Configuration

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SECRET_KEY` | JWT secret key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes |
| `INSTAGRAM_ACCESS_TOKEN` | Instagram API token | No* |
| `INSTAGRAM_USER_ID` | Instagram user ID | No* |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |

*Mock data will be used if not provided

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXTAUTH_URL` | Frontend URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |

## API Endpoints

### Blog & News
- `GET /api/v1/blog/posts` - Get blog posts
- `GET /api/v1/blog/feed` - Get unified feed (blog + Instagram)

### Products
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/{id}` - Get single product

### Events
- `GET /api/v1/events` - Get events
- `GET /api/v1/events/{id}` - Get single event

### Stripe
- `POST /api/v1/stripe/checkout/create-session` - Create checkout session
- `POST /api/v1/webhooks/stripe` - Stripe webhook handler

## Stripe Integration

### Setting Up Webhooks

1. **Create webhook endpoint in Stripe Dashboard:**
   - URL: `https://yourdomain.com/api/v1/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `charge.refunded`

2. **Copy webhook signing secret** to `STRIPE_WEBHOOK_SECRET` environment variable

3. **Test webhook locally** using Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe
   ```

## Instagram Integration

### Mock Data
The platform includes mock Instagram data for development. To use real Instagram data:

1. **Create a Facebook App** and configure Instagram Basic Display
2. **Generate an access token** for your Instagram account
3. **Set environment variables:**
   - `INSTAGRAM_ACCESS_TOKEN`
   - `INSTAGRAM_USER_ID`

The service will automatically switch from mock to real data when credentials are provided.

## NextAuth Setup

### Google OAuth

1. **Create OAuth 2.0 credentials** in Google Cloud Console
2. **Add authorized redirect URIs:**
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
3. **Set environment variables:**
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## Database Schema

### Users
- Email, password (hashed), role (admin/parent/player)
- OAuth provider info (Google/Apple/Credentials)

### Blog Posts
- Title, content, excerpt, author, published date

### Products
- Name, description, price, stock quantity, category
- Stripe price ID for checkout

### Events
- Title, description, type, start/end time, location
- Public/private flag, max participants

### Stripe Orders
- Session ID, status, amount, customer email
- Product metadata, payment intent

## Deployment

### Backend Deployment (Railway/Heroku/DigitalOcean)

1. Set environment variables
2. Configure PostgreSQL database
3. Deploy from Git repository
4. Run database migrations (automatic on first run)

### Frontend Deployment (Vercel/Netlify)

1. Connect Git repository
2. Set environment variables
3. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `.next`
4. Deploy

## Development

### Adding New Features

1. **Backend:** Add models → Create API routes → Update main.py
2. **Frontend:** Create components → Add pages → Connect to API

### Linting & Formatting

```bash
# Frontend
npm run lint

# Backend
black app/
flake8 app/
```

## Security Considerations

- ✅ Stripe webhook signature verification
- ✅ JWT authentication
- ✅ CORS configuration
- ✅ Password hashing (bcrypt)
- ✅ Environment variable validation
- ✅ SQL injection protection (SQLAlchemy ORM)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Proprietary - NJ Stars Basketball

## Support

For issues and questions, contact: admin@njstarsbasketball.com

---

**Built with ❤️ for NJ Stars Basketball**
