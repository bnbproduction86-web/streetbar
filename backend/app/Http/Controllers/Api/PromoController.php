<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Promotion;

class PromoController extends Controller
{
    public function index()
    {
        $promos = Promotion::latest()->get();
        return response()->json([
            'status' => 'success',
            'data' => $promos
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:40|unique:promotions,code',
            'type' => 'required|in:percentage,fixed_amount,buy_x_get_y,happy_hour',
            'discount_value' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'days_active' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $promo = Promotion::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Promo berhasil ditambahkan!',
            'data' => $promo
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $promo = Promotion::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'code' => 'sometimes|string|max:40|unique:promotions,code,' . $id,
            'type' => 'sometimes|in:percentage,fixed_amount,buy_x_get_y,happy_hour',
            'discount_value' => 'sometimes|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'days_active' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $promo->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Promo berhasil diperbarui!',
            'data' => $promo
        ]);
    }

    public function toggle($id)
    {
        $promo = Promotion::findOrFail($id);
        $promo->update(['is_active' => !$promo->is_active]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status promo berhasil diubah!',
            'data' => $promo
        ]);
    }

    public function destroy($id)
    {
        $promo = Promotion::findOrFail($id);
        $promo->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Promo berhasil dihapus!'
        ]);
    }
}
