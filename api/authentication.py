from django.contrib.auth.backends import BaseBackend
from .models import User  # Import your custom User model

class EmailBackend(BaseBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        try:
            user = User.objects.get(email=email)  # Fetch user by email
            if user.check_password(password):  # Check hashed password
                return user
        except User.DoesNotExist:
            return None
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
