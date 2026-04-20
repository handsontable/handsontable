from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class EmployeePagination(PageNumberPagination):
    """
    Custom pagination class that reads Handsontable's `pageSize` query parameter.

    By default, DRF uses `page_size` as the query param name.
    Setting page_size_query_param = 'pageSize' lets DRF read the value that
    Handsontable's dataProvider sends automatically, so no URL translation
    is needed on the frontend.

    The paginate_queryset / get_paginated_response pair is called by DRF
    automatically when a ViewSet uses this class.
    """

    page_size = 10
    page_size_query_param = "pageSize"  # matches Handsontable's default param name
    max_page_size = 100

    def get_paginated_response(self, data):
        """
        Return the response shape Handsontable's dataProvider expects:
          { rows: [...], totalRows: N }

        DRF's default shape is { count, next, previous, results }.
        We remap it here so the frontend fetchRows callback can return
        the object directly without any transformation.
        """
        return Response(
            {
                "rows": data,
                "totalRows": self.page.paginator.count,
            }
        )

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "properties": {
                "totalRows": {"type": "integer"},
                "rows": schema,
            },
        }
