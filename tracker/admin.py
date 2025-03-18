from django.contrib import admin
from .models import User, Budget, Bill, Notification, Transaction

admin.site.register(User)
admin.site.register(Budget)
admin.site.register(Bill)
admin.site.register(Notification)
admin.site.register(Transaction)
