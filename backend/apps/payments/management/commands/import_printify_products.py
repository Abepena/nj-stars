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
    help = 'Import all products from Printify (fetches dynamically from API)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--product-id',
            type=str,
            help='Import a specific Printify product ID only',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be imported without making changes',
        )

    def handle(self, *args, **options):
        client = PrintifyClient()

        if not client.is_configured:
            self.stdout.write(self.style.ERROR(
                "Printify is not configured. Set PRINTIFY_API_KEY and PRINTIFY_SHOP_ID in .env"
            ))
            return

        self.stdout.write("=" * 60)
        self.stdout.write("  Importing products from Printify")
        self.stdout.write("=" * 60)

        dry_run = options.get('dry_run', False)
        specific_id = options.get('product_id')

        if dry_run:
            self.stdout.write(self.style.WARNING("  DRY RUN - no changes will be made\n"))

        # Fetch all products from Printify API (or specific one)
        if specific_id:
            self.stdout.write(f"  Fetching product {specific_id}...")
            product_data = client.get_product(specific_id)
            if product_data:
                products = [product_data]
            else:
                self.stdout.write(self.style.ERROR(f"  Could not fetch product {specific_id}"))
                return
        else:
            self.stdout.write("  Fetching all products from Printify API...")
            products = client.get_products()

        if not products:
            self.stdout.write(self.style.WARNING("  No products found in Printify"))
            return

        self.stdout.write(f"  Found {len(products)} products\n")

        created_count = 0
        updated_count = 0
        skipped_count = 0

        for product_data in products:
            printify_id = product_data.get('id')
            title = product_data.get('title', 'Unknown')

            self.stdout.write(f"\n  Processing: {title}")
            self.stdout.write(f"    Printify ID: {printify_id}")

            if dry_run:
                # Just show what would happen
                try:
                    existing = Product.objects.get(printify_product_id=printify_id)
                    self.stdout.write(f"    Would update existing product: {existing.slug}")
                except Product.DoesNotExist:
                    self.stdout.write(f"    Would create new product")
                continue

            # Create or update product
            product, was_created = self._create_or_update_product(product_data)

            if was_created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"    Created: {product.name}"))
            else:
                updated_count += 1
                self.stdout.write(f"    Updated: {product.name}")

            # Sync variants and images (sync_product_variants handles both)
            variant_result = sync_product_variants(product)
            self.stdout.write(f"    Variants: {variant_result.get('created', 0)} created, {variant_result.get('updated', 0)} updated")
            self.stdout.write(f"    Images: {variant_result.get('images_created', 0)} created, {variant_result.get('images_updated', 0)} updated")

        self.stdout.write("\n" + "=" * 60)
        if dry_run:
            self.stdout.write(f"  DRY RUN complete - {len(products)} products would be processed")
        else:
            self.stdout.write(f"  Created: {created_count} products")
            self.stdout.write(f"  Updated: {updated_count} products")
        self.stdout.write("=" * 60)

    def _create_or_update_product(self, product_data):
        """Create or update a Product from Printify data."""
        printify_id = product_data.get('id')
        title = product_data.get('title', '').strip()
        description = product_data.get('description', '')

        # Convert HTML to plain text while preserving structure
        if description:
            description = re.sub(r'<br\s*/?>', '\n', description, flags=re.IGNORECASE)
            description = re.sub(r'</p>', '\n\n', description, flags=re.IGNORECASE)
            description = re.sub(r'<li[^>]*>', '• ', description, flags=re.IGNORECASE)
            description = re.sub(r'</li>', '\n', description, flags=re.IGNORECASE)
            description = re.sub(r'<[^>]+>', '', description)
            description = html.unescape(description)  # Decode &#39; → '
            description = re.sub(r'\n{3,}', '\n\n', description)
            description = description.strip()

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
