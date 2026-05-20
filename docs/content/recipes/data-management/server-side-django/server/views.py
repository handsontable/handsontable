import json

from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from .models import Employee
from .pagination import EmployeePagination
from .serializers import EmployeeSerializer

# Whitelist for sorting -- also reused by the filter prop check.
ALLOWED_ORDERING_FIELDS = {'first_name', 'last_name', 'department', 'role', 'salary'}

# Numeric fields must use exact (not iexact) to avoid casting errors on DecimalField.
NUMERIC_FIELDS = {'salary'}

# Maps Handsontable Filters condition names to Django ORM lookup suffixes.
# eq / not_eq are resolved dynamically below (numeric vs text distinction).
_CONDITION_LOOKUP = {
    'contains':     ('icontains', False),
    'not_contains': ('icontains', True),
    'begins_with':  ('istartswith', False),
    'ends_with':    ('iendswith', False),
    'gte':          ('gte', False),
    'lte':          ('lte', False),
    'gt':           ('gt', False),
    'lt':           ('lt', False),
}


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet providing paginated, sortable, and filterable employee data,
    plus batch CRUD actions that match Handsontable's dataProvider payload shape.
    """

    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    pagination_class = EmployeePagination
    filter_backends = [OrderingFilter, SearchFilter]
    ordering_fields = list(ALLOWED_ORDERING_FIELDS)
    search_fields = ['first_name', 'last_name', 'department', 'role']

    def get_queryset(self):
        queryset = Employee.objects.all()

        # --- Sort ---
        # Handsontable sends sort[prop] + sort[order]; translate to a queryset
        # .order_by() call so DRF's OrderingFilter doesn't need to be patched.
        sort_prop  = self.request.query_params.get('sort[prop]')
        sort_order = self.request.query_params.get('sort[order]', 'asc')

        if sort_prop and sort_prop in ALLOWED_ORDERING_FIELDS:
            prefix = '' if sort_order == 'asc' else '-'
            queryset = queryset.order_by(f'{prefix}{sort_prop}')

        # --- Filters ---
        # dataProvider serializes filters as a JSON array of DataProviderFilterColumn
        # objects: [{ prop, operation, conditions: [{ name, args }] }, ...]
        #
        # Each column can carry multiple conditions (e.g. "between" has two).
        # The operation field ('conjunction' | 'disjunction') tells us whether to
        # combine them with AND or OR.
        filters_json = self.request.query_params.get('filters')
        if filters_json:
            try:
                filter_cols = json.loads(filters_json)
                q = Q()

                for col in filter_cols:
                    prop       = col.get('prop', '')
                    operation  = col.get('operation', 'conjunction')
                    conditions = col.get('conditions') or []

                    if prop not in ALLOWED_ORDERING_FIELDS:
                        continue

                    col_q_parts = []
                    is_numeric  = prop in NUMERIC_FIELDS

                    for cond in conditions:
                        name  = cond.get('name')
                        args  = cond.get('args') or []
                        value = args[0] if args else None

                        if name == 'empty':
                            # DecimalField rejects __exact='' -- use isnull for numeric.
                            if is_numeric:
                                col_q_parts.append(Q(**{f'{prop}__isnull': True}))
                            else:
                                col_q_parts.append(Q(**{f'{prop}__exact': ''}) | Q(**{f'{prop}__isnull': True}))
                            continue

                        if name == 'not_empty':
                            if is_numeric:
                                col_q_parts.append(Q(**{f'{prop}__isnull': False}))
                            else:
                                col_q_parts.append(~Q(**{f'{prop}__exact': ''}) & ~Q(**{f'{prop}__isnull': True}))
                            continue

                        # eq / not_eq: use exact for numeric, iexact for text.
                        if name in ('eq', 'not_eq'):
                            lookup  = f'{prop}__exact' if is_numeric else f'{prop}__iexact'
                            cond_q  = Q(**{lookup: value})
                            col_q_parts.append(~cond_q if name == 'not_eq' else cond_q)
                            continue

                        if name not in _CONDITION_LOOKUP or value is None:
                            continue

                        lookup_suffix, negate = _CONDITION_LOOKUP[name]
                        lookup = f'{prop}__{lookup_suffix}'
                        cond_q = Q(**{lookup: value})
                        col_q_parts.append(~cond_q if negate else cond_q)

                    if not col_q_parts:
                        continue

                    # Combine conditions within this column with AND or OR.
                    col_q = col_q_parts[0]
                    for part in col_q_parts[1:]:
                        if operation == 'disjunction':
                            col_q |= part
                        else:
                            col_q &= part

                    q &= col_q

                queryset = queryset.filter(q)
            except (json.JSONDecodeError, TypeError, KeyError):
                pass

        return queryset

    # ------------------------------------------------------------------
    # Batch CRUD actions
    # ------------------------------------------------------------------
    # Standard REST endpoints (POST /employees/, PATCH /employees/{id}/, etc.)
    # operate on a single resource at a time. Handsontable's dataProvider
    # sends all mutations in a single request as arrays, so we need
    # custom @action endpoints that accept arrays.

    @action(detail=False, methods=['post'], url_path='create-rows')
    @transaction.atomic
    def create_rows(self, request):
        """
        POST /api/employees/create-rows/

        Handsontable's onRowsCreate callback receives { rowsAmount } -- the
        number of rows the user wants to add. The backend creates that many
        empty rows via bulk_create and returns them with server-assigned ids
        so Handsontable can update its internal row map.

        Payload shape:
          { rowsAmount: 2 }
        """
        rows_amount = max(1, int(request.data.get('rowsAmount', 1)))
        employees = Employee.objects.bulk_create([
            Employee(first_name='', last_name='', department='', role='', salary=0)
            for _ in range(rows_amount)
        ])
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data, status=201)

    @action(detail=False, methods=['patch'], url_path='update-rows')
    @transaction.atomic
    def update_rows(self, request):
        """
        PATCH /api/employees/update-rows/

        Handsontable's onRowsUpdate callback sends an array of objects with
        the row id and a changes dict containing only the modified fields.

        Payload shape:
          [
            { id: 7, changes: { salary: 102000 } },
            { id: 12, changes: { department: "Marketing", role: "Team Lead" } }
          ]
        """
        updated = []

        for row in request.data:
            employee = Employee.objects.get(pk=row['id'])
            serializer = EmployeeSerializer(employee, data=row['changes'], partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            updated.append(serializer.data)

        return Response(updated)

    @action(detail=False, methods=['delete'], url_path='remove-rows')
    def remove_rows(self, request):
        """
        DELETE /api/employees/remove-rows/

        Payload shape:
          [3, 7, 14]
        """
        deleted_count, _ = Employee.objects.filter(pk__in=request.data).delete()
        return Response({'deleted': deleted_count})
