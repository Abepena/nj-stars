from django.contrib import admin
from .models import Coach, InstagramPost


@admin.register(Coach)
class CoachAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'name', 'role', 'instagram_handle', 'is_active', 'order']
    list_filter = ['role', 'is_active']
    search_fields = ['name', 'display_name', 'instagram_handle', 'bio']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['order', 'name']
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'display_name', 'slug', 'role', 'title', 'bio')
        }),
        ('Photo', {
            'fields': ('photo_url',)
        }),
        ('Contact & Social', {
            'fields': ('email', 'phone', 'instagram_handle')
        }),
        ('Specialties', {
            'fields': ('specialties',),
            'description': 'Enter as comma-separated values'
        }),
        ('Status', {
            'fields': ('is_active', 'order')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(InstagramPost)
class InstagramPostAdmin(admin.ModelAdmin):
    list_display = ['instagram_id', 'media_type', 'timestamp', 'created_at']
    list_filter = ['media_type']
    search_fields = ['instagram_id', 'caption']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'timestamp'
