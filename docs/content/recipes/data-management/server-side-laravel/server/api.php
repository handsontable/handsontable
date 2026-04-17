<?php

use App\Http\Controllers\Api\TicketController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by the RouteServiceProvider within the "api"
| middleware group. Every route here is prefixed with /api automatically.
|
*/

Route::controller(TicketController::class)->group(function () {
    Route::get('/tickets',    'index');    // fetchRows
    Route::post('/tickets',   'store');    // onRowsCreate
    Route::patch('/tickets',  'update');   // onRowsUpdate
    Route::delete('/tickets', 'destroy'); // onRowsRemove
});
