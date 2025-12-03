from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import (
    auth,
    blog,
    products,
    events,
    stripe_checkout,
    stripe_webhook
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for NJ Stars Basketball Platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(blog.router, prefix=f"{settings.API_V1_STR}/blog", tags=["Blog"])
app.include_router(products.router, prefix=f"{settings.API_V1_STR}/products", tags=["Products"])
app.include_router(events.router, prefix=f"{settings.API_V1_STR}/events", tags=["Events"])
app.include_router(stripe_checkout.router, prefix=f"{settings.API_V1_STR}/stripe", tags=["Stripe"])
app.include_router(stripe_webhook.router, prefix=f"{settings.API_V1_STR}", tags=["Webhooks"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "NJ Stars Platform API",
        "status": "online",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Health check for monitoring"""
    return {"status": "healthy"}
