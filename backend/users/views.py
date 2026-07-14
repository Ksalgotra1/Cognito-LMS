from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import User
from .serializers import UserRegistrationSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)  # Allow anyone to register
    serializer_class = UserRegistrationSerializer
