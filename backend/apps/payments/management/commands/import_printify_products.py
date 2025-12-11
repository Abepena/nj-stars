"""
Management command to import all published products from Printify.
This is useful for initial setup or re-syncing products.
"""
from django.core.management.base import BaseCommand
from apps.payments.services.printify_client import PrintifyClient
from apps.payments.services.printify_sync import sync_product_variants
from apps.payments.models import Product, ProductImage
from django.utils.text import slugify
from decimal import Decimal
import html
import re


class Command(BaseCommand):
    help = 'Import all published products from Printify'

    def handle(self, *args, **options):
        client = PrintifyClient()

        self.stdout.write("=" * 60)
        self.stdout.write("  Importing products from Printify")
        self.stdout.write("=" * 60)

        # Known Printify product IDs (fetched via API earlier)
        # These are the currently published products in the shop
        product_ids = [
            "693b2a78344381147d0315a1",  # NJ Stars Team Backpack
            "693b02117909e1cde809a3f2",  # NJ Stars Long Sleeve Tee
            "693a89c86bfaf12deb03cee4",  # NJ Stars Pigment-Dyed Hoodie
            "690aa3af11566e84f6045c8f",  # NJ Stars Elite Oversized Tee
            "690aa319af1cb82d8d09fdd7",  # NJ Stars Street Wear Hoodie
        ]

        if not product_ids:
            self.stdout.write(self.style.WARNING("No products configured"))
            return

        created_count = 0
        updated_count = 0

        for printify_id in product_ids:
            self.stdout.write(f"\n  Fetching product {printify_id}...")

            # Fetch full product details
            full_product = client.get_product(printify_id)
            if not full_product:
                self.stdout.write(self.style.ERROR(f"    Could not fetch details for {printify_id}"))
                continue

            # Create or update product
            product, was_created = self._create_or_update_product(full_product)

            if was_created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"    Created: {product.name}"))
            else:
                updated_count += 1
                self.stdout.write(f"    Updated: {product.name}")

            # Sync variants
            variant_result = sync_product_variants(product)
            self.stdout.write(f"    Variants: {variant_result.get('updated', 0)} synced")

            # Sync images
            image_count = self._sync_images(product, full_product)
            self.stdout.write(f"    Images: {image_count} synced")

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(f"  Created: {created_count} products")
        self.stdout.write(f"  Updated: {updated_count} products")
        self.stdout.write("=" * 60)

    def _create_or_update_product(self, product_data):
        """Create or update a Product from Printify data."""
        printify_id = product_data.get('id')
        title = product_data.get('title', '').strip()
        description = product_data.get('description', '')

        # Clean HTML tags and decode entities from description
        if description:
            description = re.sub(r'<[^>]+>', '', description)
            description = html.unescape(description)  # Decode &#39; → '

        # Generate slug
        base_slug = slugify(title)[:50]

        # Calculate price from variants
        variants = product_data.get('variants', [])
        if variants:
            prices = [v.get('price', 0) for v in variants if v.get('price')]
            min_price = min(prices) if prices else 0
            price = Decimal(min_price) / 100  # Printify prices are in cents
        else:
            price = Decimal('0.00')

        # Get primary image
        images = product_data.get('images', [])
        primary_image = None
        if images:
            # Find the default image or use first one
            for img in images:
                if img.get('is_default'):
                    primary_image = img.get('src')
                    break
            if not primary_image:
                primary_image = images[0].get('src')

        # Try to find existing product by printify_product_id
        try:
            product = Product.objects.get(printify_product_id=printify_id)
            was_created = False
        except Product.DoesNotExist:
            # Check if slug exists
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            product = Product(slug=slug)
            was_created = True

        # Update fields
        product.name = title
        product.description = description or f"Premium quality {title}"
        product.price = price
        product.printify_product_id = printify_id
        product.fulfillment_type = 'pod'
        product.category = 'apparel'
        product.is_active = True

        if primary_image:
            product.image_url = primary_image

        product.save()
        return product, was_created

    def _sync_images(self, product, product_data):
        """Sync product images from Printify."""
        images = product_data.get('images', [])

        if not images:
            return 0

        # Clear existing images and re-add
        ProductImage.objects.filter(product=product).delete()

        count = 0
        for idx, img in enumerate(images):
            src = img.get('src')
            if src:
                ProductImage.objects.create(
                    product=product,
                    image_url=src,
                    alt_text=f"{product.name} - Image {idx + 1}",
                )
                count += 1

        return count
