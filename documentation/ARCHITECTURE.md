# Architecture Overview - NJ Stars Platform

## System Architecture

The NJ Stars platform follows a **modern, decoupled architecture** with complete separation of concerns between frontend and backend.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Web Frontend │  │  iOS App     │  │ Android App  │     │
│  │   Next.js    │  │  (Future)    │  │  (Future)    │     │
│  │              │  │              │  │              │     │
│  │  - UI/UX     │  │  - UI/UX     │  │  - UI/UX     │     │
│  │  - Routing   │  │  - Routing   │  │  - Routing   │     │
│  │  - State     │  │  - State     │  │  - State     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
└───────────────────────────┼────────────────────────────────┘
                            │
                       HTTP/JSON
                       JWT Auth
                            │
┌───────────────────────────▼────────────────────────────────┐
│                    API Gateway Layer                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Nginx Reverse Proxy (Production)                         │
│  - SSL/TLS Termination                                    │
│  - Rate Limiting                                          │
│  - Load Balancing                                         │
│                                                            │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                   Backend API Layer                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  FastAPI REST API                                          │
│  ┌──────────────────────────────────────────────┐         │
│  │  /api/v1/auth/*     - Authentication         │         │
│  │  /api/v1/blog/*     - Content & News         │         │
│  │  /api/v1/products/* - E-commerce Catalog     │         │
│  │  /api/v1/events/*   - Events & Calendar      │         │
│  │  /api/v1/stripe/*   - Payments & Checkout    │         │
│  └──────────────────────────────────────────────┘         │
│                                                            │
│  Core Services:                                            │
│  - JWT Authentication                                      │
│  - User Management                                         │
│  - Stripe Integration                                      │
│  - Instagram API Integration                               │
│  - Business Logic                                          │
│                                                            │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                   Data Layer                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  PostgreSQL Database                                       │
│  - User Accounts                                           │
│  - Blog Posts                                              │
│  - Products                                                │
│  - Events                                                  │
│  - Orders                                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘

                    External Services
  ┌────────────┐  ┌────────────┐  ┌────────────┐
  │   Stripe   │  │ Instagram  │  │   Google   │
  │    API     │  │    API     │  │   OAuth    │
  └────────────┘  └────────────┘  └────────────┘
```

---

## Separation of Concerns

### Frontend (Web)
**Location:** `/frontend`

**Responsibilities:**
- User interface rendering
- User interactions
- Client-side routing
- Session management (NextAuth.js for web)
- UI state management

**Key Files:**
- `src/app/*` - Next.js pages
- `src/components/*` - React components
- `src/lib/api-client.ts` - **API abstraction layer**

**Does NOT:**
- Store business logic
- Connect directly to database
- Handle authentication logic
- Process payments server-side

### Backend (API)
**Location:** `/backend`

**Responsibilities:**
- Business logic
- Data validation
- Database operations
- Authentication (JWT)
- External API integration
- Payment processing

**Key Files:**
- `app/api/routes/*` - API endpoints
- `app/models/*` - Database models
- `app/core/auth.py` - Authentication logic
- `app/services/*` - Business services

**Does NOT:**
- Render UI
- Handle frontend routing
- Manage client state

### Database
**Location:** PostgreSQL container

**Responsibilities:**
- Data persistence
- Data integrity
- Transactions
- Relationships

**Accessed By:**
- Backend only (via SQLAlchemy ORM)

---

## API-First Design

### Why API-First?

1. **Platform Independence**
   - Same API serves web, iOS, Android
   - No platform-specific backend code

2. **Scalability**
   - Frontend and backend can scale independently
   - Multiple frontends can use same backend

3. **Testability**
   - API can be tested independently
   - Clear contracts between layers

4. **Developer Experience**
   - Frontend and backend teams can work in parallel
   - API documentation auto-generated

### API Contract

**Authentication:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

**Subsequent Requests:**
```http
GET /api/v1/products
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...

Response:
[
  {
    "id": 1,
    "name": "NJ Stars Jersey",
    "price": 59.99,
    ...
  }
]
```

---

## Data Flow

### Example: User Login Flow

```
┌──────────┐
│  User    │
│  Input   │
└────┬─────┘
     │ 1. Enter email/password
     │
┌────▼─────────────┐
│  Web Frontend    │
│  (React)         │
│                  │
│  apiClient       │
│   .login()       │
└────┬─────────────┘
     │ 2. POST /api/v1/auth/login
     │    {"email": "...", "password": "..."}
     │
┌────▼─────────────┐
│  Backend API     │
│  (FastAPI)       │
│                  │
│  - Validate      │
│  - Hash check    │
│  - Create JWT    │
└────┬─────────────┘
     │ 3. Query database
     │
┌────▼─────────────┐
│  PostgreSQL      │
│                  │
│  SELECT * FROM   │
│  users WHERE...  │
└────┬─────────────┘
     │ 4. User data
     │
┌────▼─────────────┐
│  Backend API     │
│                  │
│  Generate JWT    │
│  token           │
└────┬─────────────┘
     │ 5. Return token
     │    {"access_token": "...", "token_type": "bearer"}
     │
┌────▼─────────────┐
│  Web Frontend    │
│                  │
│  Store token     │
│  in localStorage │
└────┬─────────────┘
     │ 6. Redirect to dashboard
     │
┌────▼─────────────┐
│  User sees       │
│  Dashboard       │
└──────────────────┘
```

---

## Mobile App Integration

### Architecture Remains Unchanged

The mobile app will integrate exactly like the web app:

```
┌──────────────┐
│  Mobile App  │
│              │
│  ┌────────┐  │
│  │ Login  │  │
│  │ Screen │  │
│  └───┬────┘  │
│      │       │
│  apiClient   │  <- Same pattern as web
│   .login()   │
└──────┬───────┘
       │
       │ HTTP/JSON + JWT (same as web)
       │
┌──────▼─────────────────┐
│   Backend REST API     │
│   /api/v1/*            │
│   (No changes needed)  │
└────────────────────────┘
```

**Key Points:**
- Mobile apps use the **same API endpoints**
- Mobile apps implement **same authentication** (JWT tokens)
- Mobile apps follow **same data contracts**
- Backend **does not change** for mobile support

### Reference Implementation

The web app includes a reference API client (`frontend/src/lib/api-client.ts`) that can be adapted for mobile:

**Web (TypeScript):**
```typescript
const tokens = await apiClient.login({
  email: 'user@example.com',
  password: 'password123'
})
```

**React Native (JavaScript):**
```javascript
const tokens = await apiClient.login(
  'user@example.com',
  'password123'
)
```

**Flutter (Dart):**
```dart
final tokens = await apiClient.login(
  'user@example.com',
  'password123'
);
```

All platforms use the same backend endpoint and receive the same response format.

---

## Security Architecture

### Authentication Flow

1. **User Registration/Login**
   - Credentials sent to `/api/v1/auth/login`
   - Backend validates and issues JWT token
   - Token contains: user_id, email, role, expiration

2. **Token Storage**
   - **Web:** localStorage or sessionStorage
   - **Mobile:** SecureStore / Keychain

3. **Authenticated Requests**
   - Client includes token in header: `Authorization: Bearer <token>`
   - Backend validates token on each request
   - Backend checks expiration and signature

4. **Token Expiration**
   - Default: 30 minutes
   - Client must re-authenticate when expired
   - (Future: Implement refresh tokens)

### Security Layers

```
┌────────────────────────────────────┐
│  SSL/TLS (HTTPS)                   │  Transport security
├────────────────────────────────────┤
│  JWT Signature Verification        │  Token authenticity
├────────────────────────────────────┤
│  CORS Validation                   │  Origin verification
├────────────────────────────────────┤
│  Input Validation (Pydantic)       │  Data validation
├────────────────────────────────────┤
│  SQL Injection Protection (ORM)    │  Query security
├────────────────────────────────────┤
│  Password Hashing (bcrypt)         │  Credential security
└────────────────────────────────────┘
```

---

## Scalability

### Horizontal Scaling

**Frontend:**
- Static files served via CDN
- Next.js can run in serverless mode
- Multiple instances behind load balancer

**Backend:**
- Stateless API (JWT tokens)
- Can run multiple instances
- Load balanced via nginx

**Database:**
- Connection pooling
- Read replicas for scaling reads
- Vertical scaling for writes

### Caching Strategy

**Client-Side:**
- API responses cached in memory
- Images cached locally

**Server-Side:**
- Database query results cached
- Instagram API responses cached (15 min)

**CDN:**
- Static assets (images, CSS, JS)
- Long cache times with versioning

---

## Development Workflow

### Local Development

```bash
# Start backend
cd backend
docker-compose up -d postgres
uvicorn app.main:app --reload

# Start frontend
cd frontend
npm run dev

# Or use Docker for everything
docker-compose up
```

### Testing

**Backend:**
```bash
pytest --cov=app
```

**Frontend:**
```bash
npm test
```

### Deployment

**Development:**
```bash
docker-compose up
```

**Production:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## API Documentation

### Auto-Generated Docs

FastAPI automatically generates interactive API documentation:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/v1/auth/register` | POST | Register new user | No |
| `/api/v1/auth/login` | POST | Login user | No |
| `/api/v1/auth/me` | GET | Get current user | Yes |
| `/api/v1/blog/feed` | GET | Get news feed | No |
| `/api/v1/blog/posts` | GET | Get blog posts | No |
| `/api/v1/products` | GET | Get products | No |
| `/api/v1/products/{id}` | GET | Get product | No |
| `/api/v1/events` | GET | Get events | No |
| `/api/v1/events/{id}` | GET | Get event | No |
| `/api/v1/stripe/checkout/create-session` | POST | Create checkout | No |

---

## Future Enhancements

### Phase 1: Mobile Apps
- iOS app (React Native)
- Android app (React Native)
- Same backend, no changes needed

### Phase 2: Real-time Features
- WebSocket support
- Live score updates
- Push notifications

### Phase 3: Advanced Features
- Offline support (PWA)
- GraphQL API (optional)
- Admin dashboard
- Analytics integration

---

## Documentation

- **[README.md](./README.md)** - Project overview and setup
- **[DOCKER.md](./DOCKER.md)** - Docker deployment guide
- **[TESTING.md](./TESTING.md)** - Testing guide
- **[MOBILE_APP.md](./MOBILE_APP.md)** - Mobile app extension guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - This document

---

**Questions?** Contact: admin@njstarsbasketball.com
