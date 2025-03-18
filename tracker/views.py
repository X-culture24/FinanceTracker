import json
import logging
from datetime import timedelta
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import User, Budget, Bill, Notification, Transaction

logger = logging.getLogger(__name__)

# ✅ Main Finance Tracker View (Handles all actions)
@csrf_exempt
def finance_tracker(request):
    try:
        data = json.loads(request.body)
        action = data.get('action')

        if action == "register":
            return register_user(data)

        elif action == "login":
            return login_user(data)

        # Authenticate with JWT for protected routes
        user = authenticate_with_jwt(request)
        if not user:
            return JsonResponse({"error": "Authentication required."}, status=401)

        # Authenticated Actions
        if action == "add_budget":
            return add_budget(user, data)

        elif action == "add_bill":
            return add_bill(user, data)

        elif action == "finance_analysis":
            return finance_analysis(user)

        elif action == "notifications":
            return bill_notifications(user)

        elif action == "transactions":
            return user_transactions(user)

        else:
            logger.warning("Invalid action received: %s", action)
            return JsonResponse({"error": "Invalid action."}, status=400)

    except json.JSONDecodeError:
        logger.error("Invalid JSON data received.")
        return JsonResponse({"error": "Invalid JSON data."}, status=400)
    except Exception as e:
        logger.exception("Error in finance_tracker: %s", str(e))
        return JsonResponse({"error": "Internal server error."}, status=500)


# ✅ Helper: Authenticate with JWT and Handle Expired Tokens
def authenticate_with_jwt(request):
    jwt_auth = JWTAuthentication()
    try:
        user, validated_token = jwt_auth.authenticate(request)

        # Check for token expiration and attempt to refresh
        if "exp" in validated_token.payload:
            exp = validated_token.payload["exp"]
            now = timezone.now().timestamp()
            if exp < now:
                logger.warning("Access token expired. Attempting to refresh.")
                return JsonResponse({"error": "Access token expired. Please refresh."}, status=401)

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

# ✅ Bill Notifications (Upcoming and Overdue)
def bill_notifications(user):
    today = timezone.now().date()
    upcoming_bills = Bill.objects.filter(user=user, due_date__gte=today, is_paid=False).order_by('due_date')
    overdue_bills = Bill.objects.filter(user=user, due_date__lt=today, is_paid=False).order_by('due_date')

    notifications = []

    # Prepare upcoming bill notifications
    for bill in upcoming_bills:
        notifications.append({
            "message": f"Upcoming bill: {bill.category} of KES {bill.amount} due on {bill.due_date}"
        })

    # Prepare overdue bill notifications
    for bill in overdue_bills:
        notifications.append({
            "message": f"Overdue bill: {bill.category} of KES {bill.amount} due on {bill.due_date}"
        })

    return JsonResponse({"notifications": notifications})

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
    else:
        return JsonResponse({"error": "Invalid credentials."}, status=401)


# ✅ Add Budget (User from JWT)
def add_budget(user, data):
    total_budget = data.get('total_budget')

    if total_budget is None:
        return JsonResponse({"error": "Total budget is required."}, status=400)

    try:
        total_budget = float(total_budget)
    except ValueError:
        return JsonResponse({"error": "Total budget must be a valid number."}, status=400)

    budget, created = Budget.objects.update_or_create(user=user, defaults={
        'total_budget': total_budget,
        'remaining_budget': total_budget
    })

    return JsonResponse({"message": "Budget updated successfully."})
# ✅ Create Notification for Unpaid Bills
def create_notification(user, bill):
    message = f"Upcoming bill for {bill.category} is due on {bill.due_date}."
    Notification.objects.create(user=user, message=message, bill=bill)

# ✅ Add Bill & Record Transaction (User from JWT)
def add_bill(user, data):
    category = data.get('category')
    amount = data.get('amount')
    due_date = data.get('due_date')
    mark_as_paid = data.get('is_paid', False)

    valid_categories = ["water", "rent", "electricity"]
    if category not in valid_categories:
        return JsonResponse({"error": "Invalid category. Choose from water, rent, electricity."}, status=400)

    if not amount or not due_date:
        return JsonResponse({"error": "Amount and due_date are required."}, status=400)

    # Create Bill
    bill = Bill.objects.create(
        user=user,
        category=category,
        amount=amount,
        due_date=due_date,
        is_paid=mark_as_paid
    )

    # ✅ Mark as paid and record the transaction
    if mark_as_paid:
        update_budget(user, amount)
        record_transaction(user, bill, "bill_payment")

    # Automatically create a notification for unpaid bills
    if not mark_as_paid:
        create_notification(user, bill)

    return JsonResponse({"message": "Bill added successfully.", "bill_id": bill.id})


# ✅ Update Budget when Bill is Paid
def update_budget(user, amount):
    budget = Budget.objects.filter(user=user).first()
    if budget:
        budget.remaining_budget -= amount
        budget.save()


# ✅ Record Transaction (for Bill Payments)
def record_transaction(user, bill, transaction_type):
    Transaction.objects.create(
        user=user,
        bill=bill,
        transaction_type=transaction_type,
        amount=bill.amount
    )


# ✅ Retrieve User Transactions
def user_transactions(user):
    transactions = Transaction.objects.filter(user=user).order_by('-timestamp')
    transaction_list = [
        {
            "amount": t.amount,
            "transaction_type": t.transaction_type,
            "timestamp": t.timestamp,
            "bill_category": t.bill.category
        }
        for t in transactions
    ]

    return JsonResponse({"transactions": transaction_list})



# ✅ Finance Analysis (User from JWT)
def finance_analysis(user):
    budget = Budget.objects.filter(user=user).first()
    if not budget:
        return JsonResponse({"error": "Budget not found."}, status=404)

    bills = Bill.objects.filter(user=user)
    total_bills = bills.count()
    paid_bills = bills.filter(is_paid=True).count()
    pending_bills = total_bills - paid_bills

    # Calculate percentage of budget used
    used_budget = budget.total_budget - budget.remaining_budget
    progress = (used_budget / budget.total_budget) * 100 if budget.total_budget > 0 else 0

    return JsonResponse({
        "total_budget": str(budget.total_budget),
        "remaining_budget": str(budget.remaining_budget),
        "paid_bills": paid_bills,
        "pending_bills": pending_bills,
        "progress": round(progress, 2)  # Percentage of budget used
    })


