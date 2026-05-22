from rest_framework import serializers
from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    """
    Serializer for the Employee model.

    ModelSerializer automatically generates fields and validation
    from the model definition, so no manual field declarations are needed.
    The `id` field is read-only and becomes the rowId value on the frontend.
    """

    class Meta:
        model = Employee
        fields = ["id", "first_name", "last_name", "department", "role", "salary"]
        read_only_fields = ["id"]
