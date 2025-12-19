"""
Management command to register Printify webhooks.

Usage:
    # Register all webhooks for production
    python manage.py register_printify_webhooks --base-url=https://api.njstarselite.com

    # List current webhooks
    python manage.py register_printify_webhooks --list

    # Delete all webhooks
    python manage.py register_printify_webhooks --delete-all

    # Register with a specific secret
    python manage.py register_printify_webhooks --base-url=https://api.njstarselite.com --secret=your-secret
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.payments.services.printify_client import get_printify_client, PrintifyError


class Command(BaseCommand):
    help = 'Register Printify webhooks for order and product events'

    def add_arguments(self, parser):
        parser.add_argument(
            '--base-url',
            type=str,
            help='Your API base URL (e.g., https://api.njstarselite.com)',
        )
        parser.add_argument(
            '--secret',
            type=str,
            help='Webhook secret for signature verification (uses PRINTIFY_WEBHOOK_SECRET if not provided)',
        )
        parser.add_argument(
            '--list',
            action='store_true',
            help='List all registered webhooks',
        )
        parser.add_argument(
            '--delete-all',
            action='store_true',
            help='Delete all registered webhooks',
        )

    def handle(self, *args, **options):
        client = get_printify_client()

        if not client.is_configured:
            self.stdout.write(self.style.ERROR(
                "Printify is not configured. Set PRINTIFY_API_KEY and PRINTIFY_SHOP_ID in .env"
            ))
            return

        self.stdout.write("=" * 60)

        # List webhooks
        if options.get('list'):
            self.stdout.write("  Current Printify Webhooks")
            self.stdout.write("=" * 60)
            self._list_webhooks(client)
            return

        # Delete all webhooks
        if options.get('delete_all'):
            self.stdout.write("  Deleting All Printify Webhooks")
            self.stdout.write("=" * 60)
            self._delete_all_webhooks(client)
            return

        # Register webhooks
        base_url = options.get('base_url')
        if not base_url:
            self.stdout.write(self.style.ERROR(
                "Please provide --base-url (e.g., --base-url=https://api.njstarselite.com)"
            ))
            return

        secret = options.get('secret') or getattr(settings, 'PRINTIFY_WEBHOOK_SECRET', '')

        self.stdout.write("  Registering Printify Webhooks")
        self.stdout.write("=" * 60)
        self.stdout.write(f"  Base URL: {base_url}")
        self.stdout.write(f"  Webhook URL: {base_url}/api/payments/webhook/printify/")
        self.stdout.write(f"  Secret: {'*' * 8 if secret else '(none)'}")
        self.stdout.write("")

        self._register_webhooks(client, base_url, secret)

    def _list_webhooks(self, client):
        try:
            webhooks = client.list_webhooks()
            if not webhooks:
                self.stdout.write("  No webhooks registered")
                return

            self.stdout.write(f"  Found {len(webhooks)} webhooks:\n")
            for wh in webhooks:
                self.stdout.write(f"  ID: {wh.get('id')}")
                self.stdout.write(f"    Topic: {wh.get('topic')}")
                self.stdout.write(f"    URL: {wh.get('url')}")
                self.stdout.write("")

        except PrintifyError as e:
            self.stdout.write(self.style.ERROR(f"  Error listing webhooks: {e}"))

    def _delete_all_webhooks(self, client):
        try:
            webhooks = client.list_webhooks()
            if not webhooks:
                self.stdout.write("  No webhooks to delete")
                return

            deleted = 0
            for wh in webhooks:
                webhook_id = wh.get('id')
                topic = wh.get('topic')
                try:
                    client.delete_webhook(webhook_id)
                    self.stdout.write(self.style.SUCCESS(f"  Deleted: {topic} ({webhook_id})"))
                    deleted += 1
                except PrintifyError as e:
                    self.stdout.write(self.style.ERROR(f"  Failed to delete {topic}: {e}"))

            self.stdout.write(f"\n  Deleted {deleted} webhooks")

        except PrintifyError as e:
            self.stdout.write(self.style.ERROR(f"  Error: {e}"))

    def _register_webhooks(self, client, base_url, secret):
        webhook_url = f"{base_url.rstrip('/')}/api/payments/webhook/printify/"

        topics = [
            ("product:publish:started", "Auto-import products when published in Printify"),
            ("product:deleted", "Deactivate products when deleted from Printify"),
            ("order:sent-to-production", "Update order status when sent to fulfillment"),
            ("order:shipment:created", "Save tracking info when shipment is created"),
            ("order:shipment:delivered", "Mark order as delivered"),
        ]

        registered = 0
        for topic, description in topics:
            self.stdout.write(f"  {topic}")
            self.stdout.write(f"    {description}")

            try:
                result = client.create_webhook(topic, webhook_url, secret if secret else None)
                self.stdout.write(self.style.SUCCESS(f"    ✓ Registered (ID: {result.get('id')})"))
                registered += 1
            except PrintifyError as e:
                error_msg = str(e)
                if "already exists" in error_msg.lower() or "duplicate" in error_msg.lower():
                    self.stdout.write(self.style.WARNING(f"    ⚠ Already registered"))
                else:
                    self.stdout.write(self.style.ERROR(f"    ✗ Failed: {e}"))
            self.stdout.write("")

        self.stdout.write("=" * 60)
        self.stdout.write(f"  Registered {registered} new webhooks")
        self.stdout.write("=" * 60)
