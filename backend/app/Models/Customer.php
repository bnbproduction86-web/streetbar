<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'email',
        'tier',
        'loyalty_points',
        'total_spend',
        'last_visit',
        'notes',
    ];

    protected $casts = [
        'loyalty_points' => 'integer',
        'total_spend' => 'decimal:2',
        'last_visit' => 'datetime',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
