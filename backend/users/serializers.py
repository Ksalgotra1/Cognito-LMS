from rest_framework import serializers

from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        # 'role' intentionally excluded — any value sent by the client is ignored.
        # Role is always forced to STUDENT at creation; promotion happens via
        # a separate admin-only path.
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        # We use create_user to ensure the password is encrypted
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email"),
            password=validated_data["password"],
            role=User.Role.STUDENT,  # Always force STUDENT on registration
        )
        return user
