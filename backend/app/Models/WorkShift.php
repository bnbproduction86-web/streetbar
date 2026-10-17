<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkShift extends Model
{
    protected $fillable = [
        'outlet_id',
        'cashier_id',
        'shift_number',
        'opening_cash',
        'closing_cash_actual',
        'closing_cash_expected',
        'cash_difference',
        'total_cash_in',
        'total_cash_out',
        'total_sales_cash',
        'total_sales_non_cash',
        'total_orders_count',
        'status',
        'opened_at',
        'closed_at',
        'notes',
    ];

    protected $casts = [
        'opening_cash' => 'decimal:2',
        'closing_cash_actual' => 'decimal:2',
        'closing_cash_expected' => 'decimal:2',
        'cash_difference' => 'decimal:2',
        'total_cash_in' => 'decimal:2',
        'total_cash_out' => 'decimal:2',
        'total_sales_cash' => 'decimal:2',
        'total_sales_non_cash' => 'decimal:2',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function cashMovements(): HasMany
    {
        return $this->hasMany(CashMovement::class, 'shift_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'shift_id');
    }
}
