<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Outlet extends Model
{
    protected $fillable = [
        'name',
        'legal_name',
        'phone',
        'email',
        'address',
        'tax_percentage',
        'service_percentage',
        'receipt_header',
        'receipt_footer',
        'logo_url',
        'currency_symbol',
        'is_active',
    ];

    protected $casts = [
        'tax_percentage' => 'decimal:2',
        'service_percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function shifts(): HasMany
    {
        return $this->hasMany(WorkShift::class);
    }
}
