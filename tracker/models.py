from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver

# ✅ Custom User Model
class User(AbstractUser):
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username

# ✅ Budget Model (User's Total and Remaining Budget)
class Budget(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, unique=True, related_name="budget"
    )
    total_budget = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # ✅ Default value
    remaining_budget = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # ✅ Default value
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s Budget"

# ✅ Auto-create a Budget for every new User
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_budget(sender, instance, created, **kwargs):
    if created:
        Budget.objects.create(user=instance)

# ✅ Bill Model (For Upcoming Expenses)
class Bill(models.Model):
    CATEGORY_CHOICES = [
        ("water", "Water"),
        ("rent", "Rent"),
        ("electricity", "Electricity"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bills')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="other")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_paid = models.BooleanField(default=False, db_index=True)  # ✅ Faster queries on paid/unpaid bills
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category} - {self.amount} for {self.user.username}"

# ✅ Transaction Model
class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('debit', 'Debit'),
        ('credit', 'Credit'),
    ]
    
    CATEGORY_CHOICES = [
        ('bill_payment', 'Bill Payment'),
        ('budget_adjustment', 'Budget Adjustment'),
        ('income', 'Income'),
        ('transfer', 'Transfer'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transactions")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField(default="No description")
    timestamp = models.DateTimeField(default=timezone.now)  # ✅ Default timestamp
    transaction_date = models.DateTimeField(default=timezone.now)

    related_budget = models.ForeignKey(Budget, null=True, blank=True, on_delete=models.SET_NULL, related_name="transactions")
    related_bill = models.ForeignKey(Bill, null=True, blank=True, on_delete=models.SET_NULL, related_name="transactions")

    class Meta:
        ordering = ['-timestamp']  # ✅ Ensures newest transactions appear first

    def __str__(self):
        return f"{self.transaction_type} - {self.amount} by {self.user.username}"

# ✅ Notification Model
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('bill_reminder', 'Bill Reminder'),
        ('budget_alert', 'Budget Alert'),
        ('budget_deficit', 'Budget Deficit'),
        ('transaction_alert', 'Transaction Alert'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20, choices=NOTIFICATION_TYPES, default='bill_reminder'
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    bill = models.ForeignKey(
        Bill, null=True, blank=True, on_delete=models.SET_NULL, related_name="notifications"
    )
    transaction = models.ForeignKey(
        Transaction, null=True, blank=True, on_delete=models.SET_NULL, related_name="notifications"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Notifications"  # ✅ Admin panel display fix

    def __str__(self):
        return f"{self.user.username} - {self.notification_type}"
