from django.db import models
from django.contrib.auth.models import AbstractUser

# ✅ Custom User Model
class User(AbstractUser):
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username

# ✅ Budget Model (User's Total and Remaining Budget)
class Budget(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, unique=True)
    total_budget = models.DecimalField(max_digits=10, decimal_places=2)
    remaining_budget = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s Budget"

# ✅ Bill Model (For Upcoming Expenses)
class Bill(models.Model):
    CATEGORY_CHOICES = [
        ("water", "Water"),
        ("rent", "Rent"),
        ("electricity", "Electricity"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bills')
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, default="other")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_paid = models.BooleanField(default=False, db_index=True)  # Faster queries on paid/unpaid bills
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category} - {self.amount} for {self.user.username}"

# ✅ Notification Model (For Bill Reminders)
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username} - {self.bill.category}"

# ✅ Transaction Model (Record of All Income & Expenses)
class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ("bill_payment", "Bill Payment"),
        ("income", "Income"),
        ("expense", "Expense"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.transaction_type} - {self.amount} for {self.user.username}"
