from django.urls import path
from .views import (
    UserRegisterView, UserLoginView, logout_user,  # ✅ Updated login view
    BudgetListView, set_budget,
    TransactionListView,
    BillListView, BillMarkPaidView
)

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),  # ✅ Fix applied
    path('logout/', logout_user, name='logout'),
    path('budgets/', BudgetListView.as_view(), name='budget-list'),
    path('set-budget/', set_budget, name='set-budget'),
    path('transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('bills/', BillListView.as_view(), name='bill-list'),
    path('bills/<int:pk>/mark-paid/', BillMarkPaidView.as_view(), name='bill-mark-paid'),
]
