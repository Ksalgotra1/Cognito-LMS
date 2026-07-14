from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    We add 'role' to distinguish between Students and Instructors.
    """

    # Enums for strict choices (better than raw strings)
    class Role(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        INSTRUCTOR = "INSTRUCTOR", "Instructor"
        ADMIN = "ADMIN", "Admin"

    base_role = Role.STUDENT

    role = models.CharField(max_length=50, choices=Role.choices, default=Role.STUDENT)
    bio = models.TextField(blank=True, null=True)

    # For the AI features later
    learning_style = models.JSONField(null=True, blank=True, help_text="AI-inferred learning preferences")

    def save(self, *args, **kwargs):
        # Safety: If create_superuser is called, force role to ADMIN
        if self.is_superuser:
            self.role = self.Role.ADMIN
        return super().save(*args, **kwargs)
