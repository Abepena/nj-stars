# Generated manually to sync model renames with db_table mapping
# This migration tells Django that Cart/CartItem were renamed to Bag/BagItem
# but the underlying database tables remain payments_cart and payments_cartitem

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0006_add_cart_item_variants'),
    ]

    operations = [
        # These are state-only operations - the tables don't change
        migrations.RenameModel(
            old_name='Cart',
            new_name='Bag',
        ),
        migrations.RenameModel(
            old_name='CartItem',
            new_name='BagItem',
        ),
    ]
