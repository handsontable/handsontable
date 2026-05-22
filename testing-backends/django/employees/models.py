from django.db import models


class Employee(models.Model):
    """
    Employee model for the HR directory demo.

    Fields match the column definitions used in the Handsontable frontend:
    id is generated automatically by Django and used as rowId.
    """

    DEPARTMENT_CHOICES = [
        ("Engineering", "Engineering"),
        ("Marketing", "Marketing"),
        ("Sales", "Sales"),
        ("HR", "HR"),
        ("Finance", "Finance"),
        ("Operations", "Operations"),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    department = models.CharField(max_length=100, choices=DEPARTMENT_CHOICES)
    role = models.CharField(max_length=100)
    # DecimalField avoids floating-point rounding for currency values.
    salary = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        # Default ordering by last name keeps the initial grid display predictable.
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.department})"
