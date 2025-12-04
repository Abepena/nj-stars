from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Product

router = APIRouter()


@router.get("/products")
async def get_products(
    skip: int = 0,
    limit: int = 50,
    category: str = None,
    db: Session = Depends(get_db)
):
    """Get all active products for the merch store"""
    query = db.query(Product).filter(Product.is_active == True)

    if category:
        query = query.filter(Product.category == category)

    products = query.offset(skip).limit(limit).all()

    return [
        {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "image_url": product.image_url,
            "stock_quantity": product.stock_quantity,
            "category": product.category,
        }
        for product in products
    ]


@router.get("/products/{product_id}")
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID"""
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "image_url": product.image_url,
        "stock_quantity": product.stock_quantity,
        "category": product.category,
    }
