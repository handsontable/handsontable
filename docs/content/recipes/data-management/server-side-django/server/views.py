from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from .models import Employee
from .pagination import EmployeePagination
from .serializers import EmployeeSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet providing paginated, sortable, and filterable employee data,
    plus batch CRUD actions that match Handsontable's dataProvider payload shape.

    Standard ModelViewSet gives us list(), retrieve(), create(), update(),
    partial_update(), and destroy() for free. We add three custom @action
    methods for batch create / update / remove, because Handsontable sends
    all row mutations as arrays, not single-resource requests.
    """

    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    pagination_class = EmployeePagination

    # --- Sorting ---
    # DRF's built-in OrderingFilter reads ?ordering=field or ?ordering=-field.
    # Handsontable sends ?sort[prop]=field&sort[order]=asc|desc.
    # The translate_sort() helper below converts HOT's format to DRF's format
    # before the queryset is filtered, so OrderingFilter can handle it normally.
    filter_backends = [OrderingFilter, SearchFilter]
    ordering_fields = ["first_name", "last_name", "department", "role", "salary"]

    # SearchFilter reads ?search=term and searches across these fields.
    # For column-level filtering HOT sends filters[] params; see filter_queryset().
    search_fields = ["first_name", "last_name", "department", "role"]

    def get_queryset(self):
        """
        Apply column-level filters from Handsontable's filters[] query param.

        Handsontable sends filters as:
          ?filters[0][prop]=department&filters[0][value]=Engineering&filters[0][condition]=eq
          ?filters[1][prop]=salary&filters[1][value]=80000&filters[1][condition]=gte

        We parse these and build a Django Q object for each condition.
        Only a practical subset of conditions is implemented here; extend as needed.
        """
        queryset = super().get_queryset()

        # -- Sort translation --
        # Convert HOT's sort[prop] + sort[order] to DRF's ordering param so that
        # OrderingFilter can take over without any further changes.
        sort_prop = self.request.query_params.get("sort[prop]")
        sort_order = self.request.query_params.get("sort[order]", "asc")

        if sort_prop and sort_prop in self.ordering_fields:
            ordering = sort_prop if sort_order == "asc" else f"-{sort_prop}"
            # Inject into the mutable query params copy so OrderingFilter picks it up.
            self.request._request.GET = self.request._request.GET.copy()
            self.request._request.GET["ordering"] = ordering

        # -- Column-level filters --
        # Parse up to 20 filter conditions from the query string.
        q = Q()
        index = 0

        while index < 20:
            prefix = f"filters[{index}]"
            prop = self.request.query_params.get(f"{prefix}[prop]")
            value = self.request.query_params.get(f"{prefix}[value]")
            condition = self.request.query_params.get(f"{prefix}[condition]", "contains")

            if prop is None:
                break  # No more filter entries.

            # Map HOT condition names to Django ORM lookups.
            lookup_map = {
                "contains": f"{prop}__icontains",
                "not_contains": f"{prop}__icontains",  # negated below
                "eq": f"{prop}__iexact",
                "neq": f"{prop}__iexact",  # negated below
                "begins_with": f"{prop}__istartswith",
                "ends_with": f"{prop}__iendswith",
                "gte": f"{prop}__gte",
                "gt": f"{prop}__gt",
                "lte": f"{prop}__lte",
                "lt": f"{prop}__lt",
            }

            lookup = lookup_map.get(condition)

            if lookup:
                if condition in ("not_contains", "neq"):
                    q &= ~Q(**{lookup: value})
                else:
                    q &= Q(**{lookup: value})

            index += 1

        return queryset.filter(q)

    # ------------------------------------------------------------------
    # Batch CRUD actions
    # ------------------------------------------------------------------
    # Standard REST endpoints (POST /employees/, PATCH /employees/{id}/, etc.)
    # operate on a single resource at a time. Handsontable's dataProvider
    # sends all mutations in a single request as an array, so we need
    # custom @action endpoints that accept arrays.

    @action(detail=False, methods=["post"], url_path="create-rows")
    def create_rows(self, request):
        """
        POST /api/employees/create-rows/

        Accepts the onRowsCreate payload: an array of row objects without ids.
        Returns the created rows with their new ids so Handsontable can update
        the grid's internal row map.

        Payload shape:
          [
            { first_name: "Ana", last_name: "García", department: "Engineering",
              role: "Senior Engineer", salary: 95000 },
            ...
          ]
        """
        serializer = EmployeeSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["patch"], url_path="update-rows")
    def update_rows(self, request):
        """
        PATCH /api/employees/update-rows/

        Accepts the onRowsUpdate payload: an array of partial row objects that
        each contain the row id plus only the changed fields.

        Payload shape:
          [
            { id: 7, salary: 102000 },
            { id: 12, department: "Marketing", role: "Team Lead" },
            ...
          ]
        """
        updated = []

        for row in request.data:
            try:
                employee = Employee.objects.get(pk=row["id"])
            except Employee.DoesNotExist:
                return Response(
                    {"detail": f"Employee {row['id']} not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # partial=True allows updating a subset of fields.
            serializer = EmployeeSerializer(employee, data=row, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            updated.append(serializer.data)

        return Response(updated)

    @action(detail=False, methods=["delete"], url_path="remove-rows")
    def remove_rows(self, request):
        """
        DELETE /api/employees/remove-rows/

        Accepts the onRowsRemove payload: an array of row ids to delete.

        Payload shape:
          [3, 7, 14]

        Using DELETE with a request body is valid per HTTP spec but unusual.
        An alternative is a POST to /remove-rows/ if your infrastructure
        strips DELETE bodies.
        """
        ids = request.data

        if not isinstance(ids, list):
            return Response(
                {"detail": "Expected an array of row ids."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted_count, _ = Employee.objects.filter(pk__in=ids).delete()
        return Response({"deleted": deleted_count}, status=status.HTTP_200_OK)
