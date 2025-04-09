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
            "refresh": str(refresh),
            "user": str(user)
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
            # Record the payment transaction (debit)
            payment_transaction = Transaction.objects.create(
                user=user,
                amount=amount,
                transaction_type="debit",
                category="bill_payment",
                description=f"Payment for {category} bill",
                related_bill=bill,
                related_budget=budget
            )

            # Record the budget adjustment (credit)
            adjustment_transaction = Transaction.objects.create(
                user=user,
                amount=amount,
                transaction_type="credit",
                category="budget_adjustment",
                description=f"Budget reduction for {category} payment",
                related_bill=bill,
                related_budget=budget
            )

            budget.remaining_budget -= amount
            budget.save()

            Notification.objects.create(
                user=user,
                message=f"Payment of KES {amount} for {category} recorded",
                notification_type="transaction_alert",
                transaction=payment_transaction
            )
    else:
        Notification.objects.create(
            user=user,
            message=f"Reminder: Pay {category} bill of KES {amount} by {due_date}.",
            bill=bill,
            notification_type="bill_reminder"
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

    budget = Budget.objects.filter(user=user).first()
    if budget:
        # Record the payment transaction (debit)
        payment_transaction = Transaction.objects.create(
            user=user,
            amount=bill.amount,
            transaction_type="debit",
            category="bill_payment",
            description=f"Payment for {bill.category} bill",
            related_bill=None,  # Since bill is being deleted
            related_budget=budget
        )

        # Record the budget adjustment (credit)
        adjustment_transaction = Transaction.objects.create(
            user=user,
            amount=bill.amount,
            transaction_type="credit",
            category="budget_adjustment",
            description=f"Budget reduction for {bill.category} payment",
            related_bill=None,  # Since bill is being deleted
            related_budget=budget
        )

        budget.remaining_budget -= bill.amount
        budget.save()

        Notification.objects.create(
            user=user,
            message=f"Payment of KES {bill.amount} for {bill.category} recorded",
            notification_type="transaction_alert",
            transaction=payment_transaction
        )

    # Remove Related Notification
    Notification.objects.filter(user=user, bill=bill).delete()

    # 🚀 **Delete the bill after processing**
    bill.delete()

    return JsonResponse({"message": "Bill marked as paid, recorded, and deleted."}, status=200)

# ✅ Budget Handler (Updated with transaction recording)
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
    
    budget, created = Budget.objects.get_or_create(user=user)
    previous_budget = budget.total_budget
    
    # Update budget
    budget.total_budget = amount
    budget.remaining_budget = amount
    budget.save()

    # Record transaction
    if created:
        transaction_type = 'credit'
        description = f"Initial budget allocation of KES {amount}"
    else:
        difference = amount - previous_budget
        transaction_type = 'credit' if difference > 0 else 'debit'
        description = f"Budget {'increased' if difference > 0 else 'decreased'} by KES {abs(difference)}"

    transaction = Transaction.objects.create(
        user=user,
        amount=abs(amount if created else difference),
        transaction_type=transaction_type,
        category='budget_adjustment',
        description=description,
        related_budget=budget,
        timestamp=timezone.now(),
        transaction_date=timezone.now()
    )

    if not created:
        Notification.objects.create(
            user=user,
            message=description,
            notification_type='transaction_alert',
            transaction=transaction
        )

    return JsonResponse({
        "message": "Budget set successfully",
        "total_budget": float(budget.total_budget),
        "remaining_budget": float(budget.remaining_budget),
        "transaction_id": transaction.id
    }, status=200)

# ✅ Finance Analysis (Updated with detailed transaction info)
def finance_analysis(user):
    budget = Budget.objects.filter(user=user).first()
    if not budget:
        return JsonResponse({"error": "No budget set for user."}, status=400)
        
    # Transaction calculations
    credits = Transaction.objects.filter(
        user=user, 
        transaction_type="credit"
    ).aggregate(total=Sum('amount'))['total'] or Decimal(0)
    
    debits = Transaction.objects.filter(
        user=user, 
        transaction_type="debit"
    ).aggregate(total=Sum('amount'))['total'] or Decimal(0)

    total_budget = budget.total_budget
    remaining_budget = budget.remaining_budget
    spent_percentage = ((total_budget - remaining_budget) / total_budget) * 100 if total_budget > 0 else 0

    recent_transactions = Transaction.objects.filter(user=user).order_by('-transaction_date')[:5]

    return JsonResponse({
        "total_budget": float(total_budget),
        "remaining_budget": float(remaining_budget),
        "spent_percentage": round(float(spent_percentage), 2),
        "total_credits": float(credits),
        "total_debits": float(debits),
        "balance": float(credits - debits),
        "recent_transactions": [
            {
                "id": t.id,
                "amount": float(t.amount),
                "type": t.transaction_type,
                "category": t.category,
                "description": t.description,
                "date": t.transaction_date.strftime("%Y-%m-%d %H:%M")
            } for t in recent_transactions
        ]
    }, status=200)

# ✅ Get Notifications Endpoint
def get_notifications(user):
    notifications = Notification.objects.filter(user=user).order_by("-created_at")[:10]
    notifications_data = [
        {
            "id": note.id,
            "message": note.message,
            "created_at": note.created_at.strftime("%Y-%m-%d %H:%M"),
            "bill_id": note.bill.id if note.bill else None,
            "transaction_id": note.transaction.id if note.transaction else None,
        } for note in notifications
    ]
    return JsonResponse({"notifications": notifications_data})



def get_transactions(user):
    transactions = Transaction.objects.filter(user=user).order_by("-timestamp")[:10]
    
    transactions_data = [
        {
            "id": txn.id,
            "category": txn.category,
            "amount": float(txn.amount),
            "transaction_type": txn.transaction_type,
            "date": txn.timestamp.strftime("%Y-%m-%d %H:%M"),
            "description": txn.description,
            "related_bill": txn.related_bill.id if txn.related_bill else None,
            "related_budget": txn.related_budget.id if txn.related_budget else None,
        } 
        for txn in transactions
    ]
    
    # ✅ Update key name from "transactions" to "recent_transactions"
    return JsonResponse({"recent_transactions": transactions_data})


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
            
        if action == "add_budget":
            return handle_budget(user, data)

        if action == "get_notifications":
            return get_notifications(user)

        if action == "get_transactions":
            return get_transactions(user)

        return JsonResponse({"error": "Invalid action."}, status=400)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format."}, status=400)
    except Exception as e:
        logger.exception("Error in finance_tracker: %s", str(e))
        return JsonResponse({"error": "Internal server error."}, status=500)
