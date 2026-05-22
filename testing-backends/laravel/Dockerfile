FROM php:8.3-cli-alpine

RUN apk add --no-cache \
    curl unzip git oniguruma-dev libzip-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Create a fresh Laravel project (no dev deps for a smaller image)
RUN composer create-project laravel/laravel . --prefer-dist --no-interaction --no-dev 2>&1 | tail -3

# Overlay the recipe server files
COPY Product.php           app/Models/Product.php
COPY ProductController.php app/Http/Controllers/ProductController.php
COPY migration.php         database/migrations/2024_01_01_000000_create_products_table.php
COPY seeder.php            database/seeders/ProductSeeder.php
COPY routes-api.php        routes/api.php

# Allow all CORS origins for local testing
RUN php -r "
\$f = 'config/cors.php';
file_put_contents(\$f, str_replace(
    \"'allowed_origins' => [env('FRONTEND_URL', '')],\",
    \"'allowed_origins' => ['*'],\",
    file_get_contents(\$f)
));
" 2>/dev/null || true

EXPOSE 8000

# migrate + seed on every start (both are idempotent for this schema)
CMD ["sh", "-c", \
  "php artisan migrate --force && \
   php artisan db:seed --class=ProductSeeder --force && \
   php artisan serve --host=0.0.0.0 --port=8000"]
