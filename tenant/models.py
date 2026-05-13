from django.contrib.auth.models import User
from django.db import models

from core.models import BaseModel


class Tenant(BaseModel):
    name = models.CharField(max_length=120)
    owner = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="tenant"
    )

    class Meta:
        ordering = ["created_on"]

    def __str__(self):
        return f"Tenant<{self.name}>"
