# urls.py
from django.urls import path
from .views import add_bill, get_bills

urlpatterns = [
    path("api/bills/", add_bill, name="add_bill"),
    path("api/bills/", get_bills, name="get_bills"),
]
