from django.contrib import admin
from .models import InstagramPost


@admin.register(InstagramPost)
class InstagramPostAdmin(admin.ModelAdmin):
    list_display = ['instagram_id', 'media_type', 'timestamp', 'created_at']
    list_filter = ['media_type']
    search_fields = ['instagram_id', 'caption']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'timestamp'
