"""
Integration tests for product API routes
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import Product


@pytest.mark.integration
class TestProductRoutes:
    """Tests for product endpoints"""

    def test_get_products_empty(self, client: TestClient, db: Session):
        """Test getting products when database is empty"""
        response = client.get("/api/v1/products")

        assert response.status_code == 200
        assert response.json() == []

    def test_get_products(self, client: TestClient, multiple_products: list[Product]):
        """Test getting all products"""
        response = client.get("/api/v1/products")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 6
        assert all("id" in product for product in data)
        assert all("name" in product for product in data)
        assert all("price" in product for product in data)
        assert all("stock_quantity" in product for product in data)

    def test_get_products_pagination(self, client: TestClient, multiple_products: list[Product]):
        """Test products pagination"""
        response = client.get("/api/v1/products?skip=0&limit=3")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_get_products_by_category(self, client: TestClient, multiple_products: list[Product]):
        """Test filtering products by category"""
        response = client.get("/api/v1/products?category=Jersey")

        assert response.status_code == 200
        data = response.json()
        assert all(product["category"] == "Jersey" for product in data)

    def test_get_products_inactive_excluded(self, client: TestClient, db: Session):
        """Test inactive products are excluded"""
        # Create active and inactive products
        active = Product(
            name="Active Product",
            description="Test",
            price=29.99,
            is_active=True,
        )
        inactive = Product(
            name="Inactive Product",
            description="Test",
            price=29.99,
            is_active=False,
        )
        db.add_all([active, inactive])
        db.commit()

        response = client.get("/api/v1/products")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Active Product"

    def test_get_single_product(self, client: TestClient, sample_product: Product):
        """Test getting a single product by ID"""
        response = client.get(f"/api/v1/products/{sample_product.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_product.id
        assert data["name"] == sample_product.name
        assert data["price"] == sample_product.price

    def test_get_nonexistent_product(self, client: TestClient, db: Session):
        """Test getting a product that doesn't exist"""
        response = client.get("/api/v1/products/9999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_inactive_product(self, client: TestClient, db: Session):
        """Test getting an inactive product returns 404"""
        product = Product(
            name="Inactive",
            description="Test",
            price=29.99,
            is_active=False,
        )
        db.add(product)
        db.commit()
        db.refresh(product)

        response = client.get(f"/api/v1/products/{product.id}")

        assert response.status_code == 404

    def test_product_response_structure(self, client: TestClient, sample_product: Product):
        """Test product response has correct structure"""
        response = client.get(f"/api/v1/products/{sample_product.id}")

        assert response.status_code == 200
        data = response.json()

        required_fields = ["id", "name", "description", "price", "image_url", "stock_quantity", "category"]
        for field in required_fields:
            assert field in data
