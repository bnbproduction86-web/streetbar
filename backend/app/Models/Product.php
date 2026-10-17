<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'sku',
        'barcode',
        'name',
        'description',
        'image_url',
        'unit',
        'cost_price',
        'selling_price',
        'track_stock',
        'current_stock',
        'min_stock_alert',
        'is_favorite',
        'is_active',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'track_stock' => 'boolean',
        'is_favorite' => 'boolean',
        'is_active' => 'boolean',
        'current_stock' => 'integer',
        'min_stock_alert' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->where('is_active', true);
    }

    public function modifierGroups(): BelongsToMany
    {
        return $this->belongsToMany(ModifierGroup::class, 'product_modifier_groups');
    }

    public function inventoryLogs(): HasMany
    {
        return $this->hasMany(InventoryLog::class)->orderBy('created_at', 'desc');
    }
}
