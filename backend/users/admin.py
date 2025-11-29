from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    # Add our new fields to the admin display
    fieldsets = UserAdmin.fieldsets + (
        ('Cognito Profile', {'fields': ('role', 'bio', 'learning_style')}),
    )
    list_display = ['username', 'email', 'role', 'is_staff']

admin.site.register(User, CustomUserAdmin)