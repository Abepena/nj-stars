"""
Management command to sync product variants from Printify.

Usage:
    # Sync all POD products
    python manage.py sync_printify_variants

    # Sync a specific product by slug
    python manage.py sync_printify_variants --product=nj-stars-hoodie

    # List POD products and their variant status
    python manage.py sync_printify_variants --list

    # Verbose output
    python manage.py sync_printify_variants -v 2
"""

from django.core.management.base import BaseCommand, CommandError
from apps.payments.models import Product, ProductVariant
from apps.payments.services import sync_product_variants, sync_all_pod_variants


class Command(BaseCommand):
    help = 'Sync product variants from Printify API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--product',
            type=str,
            help='Sync variants for a specific product (by slug)',
        )
        parser.add_argument(
            '--list',
            action='store_true',
            help='List all POD products and their variant counts',
        )

    def handle(self, *args, **options):
        if options['list']:
            self.list_products()
            return

        if options['product']:
            self.sync_single_product(options['product'])
            return

        self.sync_all_products()

    def list_products(self):
        """List all POD products with their status"""
        products = Product.objects.filter(
            fulfillment_type='pod',
            is_active=True
        )

        if not products.exists():
            self.stdout.write(self.style.WARNING('No POD products found.'))
            return

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('  POD Products'))
        self.stdout.write('=' * 60)

        for product in products:
            variant_count = product.variants.filter(is_enabled=True).count()
            total_variants = product.variants.count()
            has_printify_id = bool(product.printify_product_id)

            if has_printify_id:
                status = self.style.SUCCESS('✓ Ready to sync')
            else:
                status = self.style.WARNING('✗ No Printify ID')

            self.stdout.write(f"\n  {self.style.HTTP_INFO(product.name)}")
            self.stdout.write(f"      Slug: {product.slug}")
            self.stdout.write(f"      Printify ID: {product.printify_product_id or 'Not set'}")
            self.stdout.write(f"      Variants: {variant_count} enabled / {total_variants} total")
            self.stdout.write(f"      Status: {status}")

        self.stdout.write('\n' + '=' * 60 + '\n')

    def sync_single_product(self, slug: str):
        """Sync variants for a single product"""
        try:
            product = Product.objects.get(slug=slug)
        except Product.DoesNotExist:
            raise CommandError(f"Product with slug '{slug}' not found")

        if not product.is_pod:
            raise CommandError(f"Product '{slug}' is not a POD product (fulfillment_type={product.fulfillment_type})")

        if not product.printify_product_id:
            raise CommandError(f"Product '{slug}' has no Printify product ID. Set it in Django admin first.")

        self.stdout.write(f"\nSyncing variants for: {self.style.HTTP_INFO(product.name)}")
        self.stdout.write(f"  Printify ID: {product.printify_product_id}")
        self.stdout.write('-' * 40)

        stats = sync_product_variants(product)
        self._print_stats(product.name, stats)

    def sync_all_products(self):
        """Sync all POD products"""
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('  Syncing variants for all POD products'))
        self.stdout.write('=' * 60 + '\n')

        results = sync_all_pod_variants()

        if not results:
            self.stdout.write(self.style.WARNING(
                'No POD products with Printify IDs found.\n'
                'Set printify_product_id in Django admin for products you want to sync.'
            ))
            return

        for product_name, stats in results.items():
            self._print_stats(product_name, stats)

        # Summary
        total_created = sum(r['created'] for r in results.values())
        total_updated = sum(r['updated'] for r in results.values())
        total_disabled = sum(r['disabled'] for r in results.values())
        total_images = sum(r.get('images_created', 0) for r in results.values())
        total_images_updated = sum(r.get('images_updated', 0) for r in results.values())
        total_errors = sum(len(r['errors']) for r in results.values())

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('  Summary'))
        self.stdout.write('=' * 60)
        self.stdout.write(f"  Products synced: {len(results)}")
        self.stdout.write(f"  Variants created: {self.style.SUCCESS(str(total_created))}")
        self.stdout.write(f"  Variants updated: {self.style.SUCCESS(str(total_updated))}")
        if total_disabled:
            self.stdout.write(f"  Variants disabled: {self.style.WARNING(str(total_disabled))}")
        self.stdout.write(f"  Images synced: {self.style.SUCCESS(str(total_images + total_images_updated))}")
        if total_errors:
            self.stdout.write(f"  Errors: {self.style.ERROR(str(total_errors))}")
        self.stdout.write('=' * 60 + '\n')

    def _print_stats(self, product_name: str, stats: dict):
        """Print sync statistics for a product"""
        created = stats.get('created', 0)
        updated = stats.get('updated', 0)
        disabled = stats.get('disabled', 0)
        images_created = stats.get('images_created', 0)
        images_updated = stats.get('images_updated', 0)
        errors = stats.get('errors', [])

        self.stdout.write(f"\n  {self.style.HTTP_INFO(product_name)}")

        if created:
            self.stdout.write(f"      Created: {self.style.SUCCESS(str(created))} variants")
        if updated:
            self.stdout.write(f"      Updated: {self.style.SUCCESS(str(updated))} variants")
        if disabled:
            self.stdout.write(f"      Disabled: {self.style.WARNING(str(disabled))} variants")
        if images_created or images_updated:
            self.stdout.write(f"      Images: {self.style.SUCCESS(str(images_created + images_updated))} synced")

        if errors:
            self.stdout.write(f"      {self.style.ERROR('Errors:')}")
            for error in errors:
                self.stdout.write(f"        - {error}")

        if not created and not updated and not disabled and not images_created and not images_updated and not errors:
            self.stdout.write(f"      {self.style.NOTICE('No changes')}")
