<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Promotion extends Model
{
    protected $fillable = [
        'name',
        'code',
        'type',
        'discount_value',
        'min_order_amount',
        'max_discount_amount',
        'buy_quantity',
        'get_quantity',
        'applicable_category_id',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'days_active',
        'is_active',
        'usage_limit',
        'usage_count',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'max_discount_amount' => 'decimal:2',
        'buy_quantity' => 'integer',
        'get_quantity' => 'integer',
        'is_active' => 'boolean',
        'usage_limit' => 'integer',
        'usage_count' => 'integer',
    ];

    public function applicableCategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'applicable_category_id');
    }
}
