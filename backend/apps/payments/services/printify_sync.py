"""
Printify Variant Sync Service

Syncs product variants from Printify API to local ProductVariant records.
"""

import logging
from typing import Optional
from django.utils import timezone
from ..models import Product, ProductVariant, ProductImage
from .printify_client import get_printify_client, PrintifyError

logger = logging.getLogger(__name__)

# Common color hex mappings for UI display
COLOR_HEX_MAP = {
    'black': '#1a1a1a',
    'white': '#ffffff',
    'navy': '#1e3a5f',
    'gray': '#6b7280',
    'grey': '#6b7280',
    'red': '#dc2626',
    'blue': '#2563eb',
    'green': '#16a34a',
    'yellow': '#eab308',
    'orange': '#ea580c',
    'purple': '#9333ea',
    'pink': '#ec4899',
    'soft pink': '#fce7f3',
    'brown': '#78350f',
    'charcoal': '#374151',
    'heather gray': '#9ca3af',
    'heather grey': '#9ca3af',
    'athletic heather': '#9ca3af',
    'dark heather': '#4b5563',
    'dark grey': '#4b5563',
    'sport grey': '#9ca3af',
    'maroon': '#7f1d1d',
    'pigment maroon': '#7f1d1d',
    'pigment black': '#1a1a1a',
    'forest': '#166534',
    'forest green': '#166534',
    'royal blue': '#1d4ed8',
    'toast': '#d4a574',
    'natural': '#faf5eb',
}


def build_options_lookup(product_options: list) -> dict:
    """
    Build a lookup map from Printify option IDs to human-readable values.

    Args:
        product_options: Product-level options array from Printify API

    Returns:
        dict mapping option_id -> {'name': str, 'type': str} where type is 'color' or 'size'
    """
    lookup = {}
    for option in product_options:
        option_type = option.get('type', '').lower()  # 'color' or 'size'
        for value in option.get('values', []):
            value_id = value.get('id')
            value_title = value.get('title', '')
            if value_id:
                lookup[value_id] = {
                    'name': value_title,
                    'type': option_type
                }
    return lookup


def parse_variant_options(variant_data: dict, product_options: list = None) -> dict:
    """
    Parse Printify variant options into size and color.

    Printify variants have:
    - `options`: array of option IDs like [881, 18]
    - `title`: human-readable string like "Navy / 2XL" or "2XL / Navy"

    The product-level `options` array maps IDs to names AND defines the order.

    Args:
        variant_data: Single variant from Printify API
        product_options: Product-level options defining property types

    Returns:
        dict with 'size', 'color', 'color_hex' keys
    """
    result = {'size': '', 'color': '', 'color_hex': ''}

    # Method 1: Use options array with product-level type definitions (most reliable)
    # This handles both "Color / Size" and "Size / Color" formats correctly
    if product_options:
        lookup = build_options_lookup(product_options)
        option_ids = variant_data.get('options', [])

        for opt_id in option_ids:
            opt_info = lookup.get(opt_id)
            if opt_info:
                if opt_info['type'] == 'size' and not result['size']:
                    result['size'] = opt_info['name']
                elif opt_info['type'] == 'color' and not result['color']:
                    result['color'] = opt_info['name']
                    result['color_hex'] = COLOR_HEX_MAP.get(opt_info['name'].lower(), '')

        # If we found at least one value, return (color_hex might be empty for uncommon colors)
        if result['size'] or result['color']:
            return result

    # Method 2: Fall back to title parsing if options lookup didn't work
    title = variant_data.get('title', '')
    if title and ' / ' in title:
        parts = title.split(' / ')
        if len(parts) == 2:
            # Detect which part is size vs color using size patterns
            size_patterns = ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl', 'xxl', 'xxxl']
            part0_lower = parts[0].strip().lower()
            part1_lower = parts[1].strip().lower()

            # Check if first part looks like a size
            if any(part0_lower == p for p in size_patterns):
                result['size'] = parts[0].strip()
                result['color'] = parts[1].strip()
            # Check if second part looks like a size
            elif any(part1_lower == p for p in size_patterns):
                result['color'] = parts[0].strip()
                result['size'] = parts[1].strip()
            else:
                # Default: assume Color / Size format
                result['color'] = parts[0].strip()
                result['size'] = parts[1].strip()

            result['color_hex'] = COLOR_HEX_MAP.get(result['color'].lower(), '')
            return result
    elif title:
        # Single value - determine if it's a size or color
        title_lower = title.lower().strip()
        size_patterns = ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl', 'xxl', 'xxxl']
        if any(title_lower == p for p in size_patterns):
            result['size'] = title.strip()
        else:
            result['color'] = title.strip()
            result['color_hex'] = COLOR_HEX_MAP.get(title_lower, '')

    return result


def sync_product_images(product: Product, printify_data: dict) -> dict:
    """
    Sync mockup images from Printify to ProductImage records.

    Printify images have:
    - `src`: The image URL
    - `variant_ids`: Which variants this image shows
    - `position`: 'front', 'back', or other
    - `is_default`: Whether this is the default image

    Args:
        product: Product instance to sync images for
        printify_data: Full product data from Printify API

    Returns:
        dict with 'created', 'updated', 'deleted' counts
    """
    stats = {'created': 0, 'updated': 0, 'deleted': 0}

    images = printify_data.get('images', [])
    if not images:
        return stats

    # Track which Printify src URLs we've seen
    seen_srcs = set()

    for i, img in enumerate(images):
        src = img.get('src')
        if not src:
            continue

        seen_srcs.add(src)

        position = img.get('position', 'front')
        is_default = img.get('is_default', False)
        variant_ids = img.get('variant_ids', [])

        # Build alt text from product name and position
        alt_text = f"{product.name} - {position.title()}"

        defaults = {
            'image_url': src,
            'alt_text': alt_text,
            'is_primary': is_default and i == 0,  # Only first default is primary
            'sort_order': i,
            'printify_variant_ids': variant_ids,
        }

        # Create or update based on printify_src
        obj, created = ProductImage.objects.update_or_create(
            product=product,
            printify_src=src,
            defaults=defaults
        )

        if created:
            stats['created'] += 1
            logger.debug(f"Created image: {alt_text}")
        else:
            stats['updated'] += 1

    # Remove Printify images that no longer exist (but keep manually added ones)
    orphaned = ProductImage.objects.filter(
        product=product,
        printify_src__isnull=False
    ).exclude(printify_src__in=seen_srcs)

    orphan_count = orphaned.count()
    if orphan_count > 0:
        orphaned.delete()
        stats['deleted'] = orphan_count
        logger.info(f"Deleted {orphan_count} orphaned images for {product.name}")

    logger.debug(
        f"Synced images for '{product.name}': "
        f"created={stats['created']}, updated={stats['updated']}, deleted={stats['deleted']}"
    )

    return stats


def sync_product_variants(product: Product) -> dict:
    """
    Sync variants for a single product from Printify.

    Args:
        product: Product instance with printify_product_id set

    Returns:
        dict with sync statistics: created, updated, disabled, errors
    """
    stats = {
        'created': 0, 'updated': 0, 'disabled': 0,
        'images_created': 0, 'images_updated': 0, 'images_deleted': 0,
        'errors': []
    }

    if not product.printify_product_id:
        stats['errors'].append(f"Product '{product.name}' has no Printify product ID")
        return stats

    if not product.is_pod:
        stats['errors'].append(f"Product '{product.name}' is not a POD product")
        return stats

    client = get_printify_client()
    if not client.is_configured:
        stats['errors'].append("Printify API not configured (missing API key or shop ID)")
        return stats

    try:
        # Fetch product data from Printify
        printify_data = client.get_product(product.printify_product_id)

        variants = printify_data.get('variants', [])
        product_options = printify_data.get('options', [])

        if not variants:
            stats['errors'].append(f"No variants found in Printify for '{product.name}'")
            return stats

        # Track which Printify variant IDs we've seen
        seen_variant_ids = set()

        for i, variant in enumerate(variants):
            printify_variant_id = variant.get('id')
            if not printify_variant_id:
                continue

            seen_variant_ids.add(printify_variant_id)

            # Parse options into size/color
            parsed = parse_variant_options(variant, product_options)

            # Build title from options if not provided
            title = variant.get('title', '')
            if not title:
                parts = [parsed['color'], parsed['size']]
                title = ' / '.join(p for p in parts if p)

            # Build variant data for update/create
            defaults = {
                'title': title or f"Variant {printify_variant_id}",
                'size': parsed['size'],
                'color': parsed['color'],
                'color_hex': parsed['color_hex'],
                'is_enabled': variant.get('is_enabled', True),
                'is_available': variant.get('is_available', True),
                'sort_order': i,
                'last_synced_at': timezone.now(),
            }

            # Handle variant-specific pricing (Printify returns price in cents)
            printify_price = variant.get('price')
            if printify_price is not None:
                defaults['price'] = printify_price / 100

            # Create or update variant
            obj, created = ProductVariant.objects.update_or_create(
                product=product,
                printify_variant_id=printify_variant_id,
                defaults=defaults
            )

            if created:
                stats['created'] += 1
                logger.debug(f"Created variant: {obj.title} for {product.name}")
            else:
                stats['updated'] += 1

        # Disable variants that no longer exist in Printify
        orphaned = ProductVariant.objects.filter(
            product=product,
            printify_variant_id__isnull=False
        ).exclude(printify_variant_id__in=seen_variant_ids)

        orphan_count = orphaned.count()
        if orphan_count > 0:
            orphaned.update(is_enabled=False)
            stats['disabled'] = orphan_count
            logger.info(f"Disabled {orphan_count} orphaned variants for {product.name}")

        # Sync images from Printify mockups
        image_stats = sync_product_images(product, printify_data)
        stats['images_created'] = image_stats['created']
        stats['images_updated'] = image_stats['updated']
        stats['images_deleted'] = image_stats['deleted']

        logger.info(
            f"Synced '{product.name}': "
            f"variants({stats['created']}+/{stats['updated']}~/{stats['disabled']}-), "
            f"images({stats['images_created']}+/{stats['images_updated']}~/{stats['images_deleted']}-)"
        )

    except PrintifyError as e:
        error_msg = f"Printify API error for '{product.name}': {e.message}"
        logger.error(error_msg)
        stats['errors'].append(error_msg)
    except Exception as e:
        error_msg = f"Unexpected error syncing '{product.name}': {str(e)}"
        logger.error(error_msg, exc_info=True)
        stats['errors'].append(error_msg)

    return stats


def sync_all_pod_variants() -> dict:
    """
    Sync variants for all active POD products with Printify IDs.

    Returns:
        dict mapping product names to their sync stats
    """
    results = {}

    pod_products = Product.objects.filter(
        fulfillment_type='pod',
        is_active=True
    ).exclude(
        printify_product_id=''
    ).exclude(
        printify_product_id__isnull=True
    )

    product_count = pod_products.count()
    logger.info(f"Starting variant sync for {product_count} POD product(s)")

    for product in pod_products:
        results[product.name] = sync_product_variants(product)

    # Summary logging
    total_created = sum(r['created'] for r in results.values())
    total_updated = sum(r['updated'] for r in results.values())
    total_disabled = sum(r['disabled'] for r in results.values())
    total_images = sum(r.get('images_created', 0) for r in results.values())
    total_errors = sum(len(r['errors']) for r in results.values())

    logger.info(
        f"Printify sync complete: {product_count} products, "
        f"variants({total_created}+/{total_updated}~/{total_disabled}-), "
        f"images({total_images}+), {total_errors} errors"
    )

    return results
