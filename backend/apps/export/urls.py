from django.urls import path
from . import views

urlpatterns = [
    # OAuth flow
    path('google-sheets/authorize/', views.google_sheets_authorize, name='google-sheets-authorize'),
    path('google-sheets/callback/', views.google_sheets_callback, name='google-sheets-callback'),
    path('google-sheets/status/', views.google_sheets_status, name='google-sheets-status'),
    path('google-sheets/disconnect/', views.google_sheets_disconnect, name='google-sheets-disconnect'),
    
    # Export
    path('google-sheets/', views.export_google_sheets, name='export-google-sheets'),
]
