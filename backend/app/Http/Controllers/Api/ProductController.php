<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;
use App\Models\InventoryLog;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'variants', 'modifierGroups.items']);

        if ($request->has('category_id') && $request->category_id !== 'all') {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:120',
            'sku' => 'nullable|string|unique:products,sku',
            'barcode' => 'nullable|string|unique:products,barcode',
            'unit' => 'required|string',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'track_stock' => 'boolean',
            'current_stock' => 'integer|min:0',
            'min_stock_alert' => 'integer|min:0',
            'is_favorite' => 'boolean',
            'description' => 'nullable|string',
        ]);

        if (empty($validated['sku'])) {
            $validated['sku'] = 'SB-' . strtoupper(Str::random(6));
        }

        $product = Product::create($validated);

        // Record initial stock if tracking
        if ($product->track_stock && $product->current_stock > 0) {
            InventoryLog::create([
                'product_id' => $product->id,
                'user_id' => 1,
                'type' => 'initial',
                'quantity_change' => $product->current_stock,
                'previous_stock' => 0,
                'current_stock' => $product->current_stock,
                'notes' => 'Stok awal barang baru',
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Produk baru berhasil ditambahkan!',
            'data' => $product->load('category')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:120',
            'sku' => 'sometimes|string|unique:products,sku,' . $id,
            'barcode' => 'nullable|string|unique:products,barcode,' . $id,
            'unit' => 'sometimes|string',
            'cost_price' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'track_stock' => 'boolean',
            'min_stock_alert' => 'integer|min:0',
            'is_favorite' => 'boolean',
            'is_active' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $product->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil diperbarui!',
            'data' => $product->load('category')
        ]);
    }

    public function adjustStock(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'type' => 'required|in:restock,adjustment,waste_spoilage',
            'quantity' => 'required|integer|not_in:0',
            'notes' => 'required|string',
            'user_id' => 'required|exists:users,id',
        ]);

        $prevStock = $product->current_stock;
        $qtyChange = $validated['type'] === 'waste_spoilage' ? -abs($validated['quantity']) : $validated['quantity'];
        $newStock = $prevStock + $qtyChange;

        $product->update(['current_stock' => max(0, $newStock)]);

        InventoryLog::create([
            'product_id' => $product->id,
            'user_id' => $validated['user_id'],
            'type' => $validated['type'],
            'quantity_change' => $qtyChange,
            'previous_stock' => $prevStock,
            'current_stock' => $product->current_stock,
            'notes' => $validated['notes'],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Stok produk berhasil disesuaikan!',
            'data' => $product
        ]);
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->update(['is_active' => false]);

        return response()->json([
            'status' => 'success',
            'message' => 'Produk dinonaktifkan.'
        ]);
    }
}
