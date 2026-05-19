# settings.py -- relevant additions only.
# Add these to your existing Django settings file.

INSTALLED_APPS = [
    # ... your existing apps ...
    "rest_framework",
    "corsheaders",      # django-cors-headers
    "django_filters",   # django-filter (optional, for DjangoFilterBackend)
    "employees",        # your app
]

MIDDLEWARE = [
    # CorsMiddleware must come before CommonMiddleware.
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    # ... rest of your middleware ...
]

# --- CORS ---
# Allow requests from the frontend dev server.
# In production, restrict this to your actual domain(s).
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",   # Create React App / Next.js dev server
    "https://your-production-domain.com",
]

# If your frontend sends credentials (cookies, Authorization headers), also set:
# CORS_ALLOW_CREDENTIALS = True

# --- Django REST Framework ---
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "employees.pagination.EmployeePagination",
    "PAGE_SIZE": 10,
    "DEFAULT_FILTER_BACKENDS": [
        "rest_framework.filters.OrderingFilter",
        "rest_framework.filters.SearchFilter",
        # Uncomment to add DjangoFilterBackend for exact field matching:
        # "django_filters.rest_framework.DjangoFilterBackend",
    ],
}
