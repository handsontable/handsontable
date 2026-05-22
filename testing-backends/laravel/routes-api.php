<?php

use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

// All four verbs share the same base URL. Laravel matches them by HTTP method.

Route::get('/products',    [ProductController::class, 'index']);          // Paginate, sort, filter
Route::post('/products',   [ProductController::class, 'store']);          // Insert new blank rows
Route::patch('/products',  [ProductController::class, 'batchUpdate']);    // Batch-update changed cells
Route::delete('/products', [ProductController::class, 'batchDestroy']);   // Delete rows by ID
