import json
import logging
from datetime import timedelta
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Sum
from .models import User, Budget, Bill, Notification, Transaction
from decimal import Decimal

logger = logging.getLogger(__name__)

# ✅ Helper: JWT Authentication
def authenticate_with_jwt(request):
    jwt_auth = JWTAuthentication()
    try:
        user, validated_token = jwt_auth.authenticate(request)
        if not user:
            return None
        if "exp" in validated_token.payload:
            exp = validated_token.payload["exp"]
            if exp < timezone.now().timestamp():
                return JsonResponse({"error": "Access token expired."}, status=401)
        return user
    except Exception as e:
        logger.error(f"JWT Authentication failed: {e}")
        return None

# ✅ Register User
def register_user(data):
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return JsonResponse({"error": "Username and password required."}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "Username already taken."}, status=400)

    User.objects.create_user(username=username, password=password)
    return JsonResponse({"message": "User registered successfully."})

# ✅ Login User (Returns JWT Tokens)
def login_user(data):
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return JsonResponse({"error": "Username and password required."}, status=400)

    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return JsonResponse({
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        })
    return JsonResponse({"error": "Invalid credentials."}, status=401)

# ✅ Add Bill (Handles Paid & Unpaid Bills)
def add_bill(user, data):
    amount = data.get("amount")
    category = data.get("category")
    due_date = data.get("due_date")
    is_paid = data.get("is_paid", False)

    if not all([amount, category, due_date]):
        return JsonResponse({"error": "Missing required fields."}, status=400)

    try:
        amount = Decimal(amount)
        due_date = timezone.datetime.strptime(due_date, "%Y-%m-%d").date()
        if due_date < timezone.now().date():
            return JsonResponse({"error": "Due date cannot be in the past."}, status=400)
    except Exception:
        return JsonResponse({"error": "Invalid input format."}, status=400)

    # Create the bill
    bill = Bill.objects.create(user=user, amount=amount, category=category, due_date=due_date, is_paid=is_paid)

    # Handle payment
    if is_paid:
        budget = Budget.objects.filter(user=user).first()
        if budget:
            budget.remaining_budget -= amount
            budget.save()

        Transaction.objects.create(
            user=user,
            bill=bill,
            amount=amount,
            category=category,
            transaction_type="debit",
            transaction_date=timezone.now()
        )
    else:
        Notification.objects.create(
            user=user,
            message=f"Reminder: Pay {category} bill of KES {amount} by {due_date}.",
            bill=bill
        )

    return JsonResponse({"message": "Bill processed successfully."}, status=201)

# ✅ List Bills (with status, payment details & notifications)
def list_bills(user):
    bills = Bill.objects.filter(user=user).order_by('-due_date')
    notifications = Notification.objects.filter(user=user, bill__in=bills)

    if not bills.exists():
        return JsonResponse({"message": "No bills available."}, status=200)

    bill_list = [
        {
            "bill_id": bill.id,
            "amount": float(bill.amount),
            "category": bill.category,
            "due_date": bill.due_date.strftime("%Y-%m-%d"),
            "status": "Paid" if bill.is_paid else "Unpaid",
            "can_mark_as_paid": not bill.is_paid,
        }
        for bill in bills
    ]

    notification_list = [
        {
            "message": notification.message,
            "bill_id": notification.bill.id,
        }
        for notification in notifications
    ]

    return JsonResponse({"bills": bill_list, "notifications": notification_list}, status=200)

# ✅ Mark Bill as Paid (Update & Record Transaction)
def mark_bill_paid(user, data):
    bill_id = data.get('bill_id')
    if not bill_id:
        return JsonResponse({"error": "Bill ID is required."}, status=400)

    try:
        bill = Bill.objects.get(id=bill_id, user=user)
    except Bill.DoesNotExist:
        return JsonResponse({"error": "Bill not found."}, status=404)

    if bill.is_paid:
        return JsonResponse({"message": "Bill already marked as paid."}, status=400)

    # Mark as Paid and Update Budget
    bill.is_paid = True
    bill.save()

    # Update Budget
    budget = Budget.objects.filter(user=user).first()
    if budget:
        budget.remaining_budget -= bill.amount
        budget.save()

    # Create Transaction Entry
    Transaction.objects.create(
        user=user,
        bill=bill,
        amount=bill.amount,
        category=bill.category,
        transaction_type="debit",
        transaction_date=timezone.now()
    )

    # Remove Related Notification
    Notification.objects.filter(user=user, bill=bill).delete()

    return JsonResponse({"message": "Bill marked as paid and recorded."}, status=200)

# ✅ Budget Handler (NEW - Added without changing other routes)
def handle_budget(user, data):
    amount = data.get('total_budget')
    
    if not amount:
        return JsonResponse({"error": "Budget amount is required."}, status=400)
    
    try:
        amount = Decimal(amount)
        if amount <= 0:
            return JsonResponse({"error": "Budget must be positive."}, status=400)
    except:
        return JsonResponse({"error": "Invalid budget amount."}, status=400)
    
    budget, created = Budget.objects.get_or_create(
        user=user,
        defaults={'total_budget': amount, 'remaining_budget': amount}
    )
    
    if not created:
        budget.total_budget = amount
        budget.remaining_budget = amount
        budget.save()

    return JsonResponse({
        "message": "Budget set successfully",
        "total_budget": budget.total_budget,
        "remaining_budget": budget.remaining_budget
    }, status=200)

# ✅ Finance Analysis (with Progress Calculation)
def finance_analysis(user):
    budget = Budget.objects.filter(user=user).first()
    total_budget = budget.total_budget if budget else Decimal(0)
    remaining_budget = budget.remaining_budget if budget else Decimal(0)

    paid_bills_total = Transaction.objects.filter(user=user, transaction_type="debit").aggregate(total=Sum('amount'))['total'] or Decimal(0)
    unpaid_bills_total = Bill.objects.filter(user=user, is_paid=False).aggregate(total=Sum('amount'))['total'] or Decimal(0)

    progress_percentage = (remaining_budget / total_budget) * 100 if total_budget > 0 else 0

    return JsonResponse({
        "total_budget": total_budget,
        "remaining_budget": remaining_budget,
        "paid_bills_total": paid_bills_total,
        "unpaid_bills_total": unpaid_bills_total,
        "progress_percentage": round(progress_percentage, 2)
    }, status=200)

# ✅ Main Finance Tracker Endpoint
@csrf_exempt
def finance_tracker(request):
    try:
        data = json.loads(request.body)
        action = data.get('action')

        if action == "register":
            return register_user(data)

        if action == "login":
            return login_user(data)

        # Protected actions (require authentication)
        user = authenticate_with_jwt(request)
        if not user:
            return JsonResponse({"error": "Authentication required."}, status=401)

        if action == "add_bill":
            return add_bill(user, data)

        if action == "list_bills":
            return list_bills(user)

        if action == "mark_bill_paid":
            return mark_bill_paid(user, data)

        if action == "finance_analysis":
            return finance_analysis(user)
            
        # NEW: Added budget handler while keeping all other routes unchanged
        if action == "add_budget":
            return handle_budget(user, data)

        return JsonResponse({"error": "Invalid action."}, status=400)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format."}, status=400)
    except Exception as e:
        logger.exception("Error in finance_tracker: %s", str(e))
        return JsonResponse({"error": "Internal server error."}, status=500)