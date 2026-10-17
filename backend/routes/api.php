<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PosController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\PromoController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\UserController;

/*
|--------------------------------------------------------------------------
| Street Bar POS - API Routes
|--------------------------------------------------------------------------
| Direct database connected endpoints for POS Touchscreen, Admin, Inventory, Shifts & Reports
*/

Route::prefix('v1')->group(function () {
    // 1. Authentication & Staff
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/pin-login', [AuthController::class, 'pinLogin']);
        Route::get('/staff', [AuthController::class, 'getStaffList']);
    });

    // 2. POS Touchscreen Cashier Operations
    Route::prefix('pos')->group(function () {
        Route::get('/init', [PosController::class, 'initData']);
        Route::post('/orders', [PosController::class, 'createOrder']);
        Route::get('/orders', [PosController::class, 'getOrders']);
        Route::get('/orders/{id}', [PosController::class, 'getOrderDetails']);
        Route::post('/orders/{id}/void', [PosController::class, 'voidOrder']);
    });

    // 3. Products & Menu Management (tables: products, categories, product_variants, modifier_groups)
    Route::apiResource('products', ProductController::class);
    Route::post('/products/{id}/adjust-stock', [ProductController::class, 'adjustStock']);

    // 4. Promotions (table: promotions)
    Route::apiResource('promotions', PromoController::class);
    Route::patch('/promotions/{id}/toggle', [PromoController::class, 'toggle']);

    // 5. Tables & Bar Seats (table: tables)
    Route::apiResource('tables', TableController::class);
    Route::patch('/tables/{id}/status', [TableController::class, 'updateStatus']);

    // 6. Customers CRM (table: customers)
    Route::apiResource('customers', CustomerController::class);

    // 7. Users & Cashier Management (table: users)
    Route::apiResource('users', UserController::class);

    // 8. Shifts & Cash Drawer Management (tables: work_shifts, cash_movements)
    Route::prefix('shifts')->group(function () {
        Route::get('/current', [ShiftController::class, 'currentShift']);
        Route::get('/history', [ShiftController::class, 'getShiftHistory']);
        Route::post('/open', [ShiftController::class, 'openShift']);
        Route::post('/{id}/close', [ShiftController::class, 'closeShift']);
        Route::post('/cash-movement', [ShiftController::class, 'recordCashMovement']);
    });

    // 9. Reports & Analytics for Dashboard
    Route::prefix('reports')->group(function () {
        Route::get('/dashboard', [ReportController::class, 'dashboard']);
        Route::get('/sales', [ReportController::class, 'salesReport']);
    });
});
