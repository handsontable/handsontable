from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet

# DefaultRouter generates URL patterns for all ViewSet actions automatically:
#   GET    /api/employees/           -> list()
#   POST   /api/employees/           -> create()   (single-row; use create-rows/ for batch)
#   GET    /api/employees/{id}/      -> retrieve()
#   PUT    /api/employees/{id}/      -> update()
#   PATCH  /api/employees/{id}/      -> partial_update()
#   DELETE /api/employees/{id}/      -> destroy()
#
# The custom @action methods are registered automatically too:
#   POST   /api/employees/create-rows/
#   PATCH  /api/employees/update-rows/
#   DELETE /api/employees/remove-rows/

router = DefaultRouter()
router.register(r"employees", EmployeeViewSet, basename="employee")

urlpatterns = [
    path("api/", include(router.urls)),
]
