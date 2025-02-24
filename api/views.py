from django.contrib.auth import authenticate
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Budget, Transaction, Bill
from .serializers import UserSerializer, BudgetSerializer, TransactionSerializer, BillSerializer

# ✅ User Registration View
class UserRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # No authentication required for registration

# ✅ User Login View (JWT-based)
class UserLoginView(APIView):
    permission_classes = [AllowAny]  # No authentication required for login

    def post(self, request):
        email_or_username = request.data.get("email")  # Accepts email or username
        password = request.data.get("password")

        user = User.objects.filter(email=email_or_username).first() or \
               User.objects.filter(username=email_or_username).first()

        if user and user.check_password(password):
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }, status=status.HTTP_200_OK)

        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# ✅ Logout View (JWT - Client Side)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_user(request):
    return Response({"message": "Logout successful. Clear token on client-side."}, status=status.HTTP_200_OK)

# ✅ Budget Views (Protected)
class BudgetListView(generics.ListCreateAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]  # Require JWT authentication

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)  # Return only logged-in user's budgets

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)  # Assign budget to the user

@api_view(["POST"])
@permission_classes([IsAuthenticated])  # Protected
def set_budget(request):
    serializer = BudgetSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)  # Assign budget to the user
        return Response({"message": "Budget set successfully!"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ✅ Transaction Views (Protected)
class TransactionListView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]  # Require JWT authentication

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)  # Only logged-in user's transactions

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)  # Assign transaction to the user

# ✅ Bill Views (Protected)
class BillListView(generics.ListCreateAPIView):
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated]  # Require JWT authentication

    def get_queryset(self):
        return Bill.objects.filter(user=self.request.user)  # Only logged-in user's bills

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)  # Assign bill to the user

class BillMarkPaidView(generics.UpdateAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated]  # Require authentication

    def perform_update(self, serializer):
        serializer.save(is_paid=True)  # Mark bill as paid
