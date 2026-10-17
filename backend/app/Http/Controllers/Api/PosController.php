<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Outlet;
use App\Models\Category;
use App\Models\Product;
use App\Models\PosTable;
use App\Models\Promotion;
use App\Models\Customer;
use App\Models\WorkShift;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemModifier;
use App\Models\OrderPayment;
use App\Models\InventoryLog;
use App\Models\User;

use App\Models\CashMovement;

class PosController extends Controller
{
    /**
     * Initial data bundle for Touchscreen POS initialization
     */
    public function initData(Request $request)
    {
        $outlet = Outlet::first();
        $categories = Category::with(['products.variants', 'products.modifierGroups.items'])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $allProducts = Product::with(['category', 'variants', 'modifierGroups.items'])
            ->where('is_active', true)
            ->get();

        $tables = PosTable::where('is_active', true)->get();
        $promotions = Promotion::where('is_active', true)->get();
        $customers = Customer::orderBy('name')->get();
        $users = User::all();
        
        $currentShift = WorkShift::with('cashier')
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();

        $orders = Order::with(['items.modifiers', 'table', 'customer', 'cashier'])
            ->latest()
            ->limit(50)
            ->get();

        $cashMovements = CashMovement::with('user')
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'outlet' => $outlet,
                'categories' => $categories,
                'products' => $allProducts,
                'tables' => $tables,
                'promotions' => $promotions,
                'customers' => $customers,
                'users' => $users,
                'current_shift' => $currentShift,
                'orders' => $orders,
                'cash_movements' => $cashMovements,
                'server_time' => now()->toIso8601String(),
            ]
        ]);
    }

    /**
     * Create a new POS transaction / order
     */
    public function createOrder(Request $request)
    {
        $validated = $request->validate([
            'cashier_id' => 'required|exists:users,id',
            'shift_id' => 'nullable|exists:work_shifts,id',
            'table_id' => 'nullable|exists:tables,id',
            'customer_id' => 'nullable|exists:customers,id',
            'order_type' => 'required|in:dine_in,takeaway,bar_tab,delivery',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.product_name' => 'required|string',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.subtotal_price' => 'required|numeric|min:0',
            'items.*.cost_price' => 'nullable|numeric|min:0',
            'items.*.notes' => 'nullable|string',
            'items.*.modifiers' => 'nullable|array',
            'subtotal' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'promotion_id' => 'nullable|exists:promotions,id',
            'tax_amount' => 'nullable|numeric|min:0',
            'service_charge' => 'nullable|numeric|min:0',
            'grand_total' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'change_amount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,qris,debit_card,credit_card,bank_transfer,split',
            'payment_reference' => 'nullable|string',
            'notes' => 'nullable|string',
            'split_payments' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $outlet = Outlet::first();
            $outletId = $outlet ? $outlet->id : 1;

            // Generate Invoice Number: SBP-YYYYMMDD-XXXX
            $datePrefix = date('Ymd');
            $todayCount = Order::whereDate('created_at', today())->count() + 1;
            $invoiceNumber = 'SBP-' . $datePrefix . '-' . str_pad($todayCount, 4, '0', STR_PAD_LEFT);

            // Active Shift
            $shiftId = $validated['shift_id'] ?? null;
            if (!$shiftId) {
                $activeShift = WorkShift::where('status', 'open')->latest()->first();
                $shiftId = $activeShift ? $activeShift->id : 1;
            }

            // Calculate total cost price (HPP)
            $totalCostPrice = 0;
            foreach ($validated['items'] as $item) {
                $cPrice = $item['cost_price'] ?? 0;
                $totalCostPrice += ($cPrice * $item['quantity']);
            }

            $order = Order::create([
                'invoice_number' => $invoiceNumber,
                'outlet_id' => $outletId,
                'cashier_id' => $validated['cashier_id'],
                'shift_id' => $shiftId,
                'customer_id' => $validated['customer_id'] ?? null,
                'table_id' => $validated['table_id'] ?? null,
                'order_type' => $validated['order_type'],
                'status' => 'completed',
                'subtotal' => $validated['subtotal'],
                'discount_amount' => $validated['discount_amount'] ?? 0,
                'promotion_id' => $validated['promotion_id'] ?? null,
                'tax_amount' => $validated['tax_amount'] ?? 0,
                'service_charge' => $validated['service_charge'] ?? 0,
                'grand_total' => $validated['grand_total'],
                'total_cost_price' => $totalCostPrice,
                'paid_amount' => $validated['paid_amount'],
                'change_amount' => $validated['change_amount'] ?? 0,
                'payment_method' => $validated['payment_method'],
                'payment_reference' => $validated['payment_reference'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'printed_count' => 1,
            ]);

            // Save Items & deduct stock
            foreach ($validated['items'] as $itemData) {
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $itemData['product_id'],
                    'variant_id' => $itemData['variant_id'] ?? null,
                    'product_name' => $itemData['product_name'],
                    'variant_name' => $itemData['variant_name'] ?? null,
                    'cost_price' => $itemData['cost_price'] ?? 0,
                    'unit_price' => $itemData['unit_price'],
                    'quantity' => $itemData['quantity'],
                    'subtotal_price' => $itemData['subtotal_price'],
                    'discount_amount' => $itemData['discount_amount'] ?? 0,
                    'notes' => $itemData['notes'] ?? null,
                ]);

                // Modifiers
                if (!empty($itemData['modifiers'])) {
                    foreach ($itemData['modifiers'] as $mod) {
                        OrderItemModifier::create([
                            'order_item_id' => $orderItem->id,
                            'modifier_item_id' => $mod['id'] ?? null,
                            'modifier_name' => $mod['name'],
                            'additional_price' => $mod['price'] ?? 0,
                        ]);
                    }
                }

                // Inventory log & stock deduction
                $product = Product::find($itemData['product_id']);
                if ($product && $product->track_stock) {
                    $prevStock = $product->current_stock;
                    $product->decrement('current_stock', $itemData['quantity']);

                    InventoryLog::create([
                        'product_id' => $product->id,
                        'variant_id' => $itemData['variant_id'] ?? null,
                        'user_id' => $validated['cashier_id'],
                        'type' => 'sale',
                        'quantity_change' => -$itemData['quantity'],
                        'previous_stock' => $prevStock,
                        'current_stock' => $product->current_stock,
                        'reference_id' => $order->invoice_number,
                        'notes' => 'Sale transaction ' . $order->invoice_number,
                    ]);
                }
            }

            // Split payments if applicable
            if ($validated['payment_method'] === 'split' && !empty($validated['split_payments'])) {
                foreach ($validated['split_payments'] as $split) {
                    OrderPayment::create([
                        'order_id' => $order->id,
                        'payment_method' => $split['method'],
                        'amount' => $split['amount'],
                        'reference_number' => $split['reference'] ?? null,
                    ]);
                }
            }

            // Update Table status if Dine In
            if (!empty($validated['table_id'])) {
                $table = PosTable::find($validated['table_id']);
                if ($table) {
                    if ($validated['order_type'] === 'bar_tab') {
                        $table->update(['status' => 'open_tab']);
                    } else {
                        $table->update(['status' => 'available']);
                    }
                }
            }

            // Update Shift Totals
            $shift = WorkShift::find($shiftId);
            if ($shift) {
                $shift->increment('total_orders_count');
                if ($validated['payment_method'] === 'cash') {
                    $shift->increment('total_sales_cash', $validated['grand_total']);
                } else {
                    $shift->increment('total_sales_non_cash', $validated['grand_total']);
                }
            }

            // Update Customer points & spend
            if (!empty($validated['customer_id'])) {
                $customer = Customer::find($validated['customer_id']);
                if ($customer) {
                    $pointsEarned = (int) floor($validated['grand_total'] / 10000); // 1 point per 10k
                    $customer->increment('loyalty_points', $pointsEarned);
                    $customer->increment('total_spend', $validated['grand_total']);
                    $customer->update(['last_visit' => now()]);
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Transaksi berhasil disimpan!',
                'data' => $order->load(['items.modifiers', 'cashier', 'table', 'customer'])
            ], 201);
        });
    }

    /**
     * Get order list / history with filtering
     */
    public function getOrders(Request $request)
    {
        $query = Order::with(['items.modifiers', 'cashier', 'table', 'customer', 'payments'])
            ->latest();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->has('cashier_id')) {
            $query->where('cashier_id', $request->cashier_id);
        }

        $orders = $query->paginate($request->get('limit', 20));

        return response()->json([
            'status' => 'success',
            'data' => $orders
        ]);
    }

    /**
     * Single order for thermal receipt reprint
     */
    public function getOrderDetails($id)
    {
        $order = Order::with(['items.modifiers', 'cashier', 'table', 'customer', 'payments', 'shift'])
            ->findOrFail($id);

        $outlet = Outlet::first();

        return response()->json([
            'status' => 'success',
            'data' => [
                'order' => $order,
                'outlet' => $outlet
            ]
        ]);
    }

    /**
     * Void order (requires supervisor / manager PIN)
     */
    public function voidOrder(Request $request, $id)
    {
        $validated = $request->validate([
            'manager_pin' => 'required|string',
            'void_reason' => 'required|string',
        ]);

        $manager = User::whereIn('role', ['super_admin', 'manager'])
            ->where('pin_code', $validated['manager_pin'])
            ->first();

        if (!$manager) {
            return response()->json([
                'status' => 'error',
                'message' => 'PIN Supervisor/Manager tidak valid!'
            ], 403);
        }

        $order = Order::with('items')->findOrFail($id);
        if ($order->status === 'voided') {
            return response()->json([
                'status' => 'error',
                'message' => 'Order ini sudah dibatalkan sebelumnya.'
            ], 400);
        }

        DB::transaction(function () use ($order, $manager, $validated) {
            // Restore inventory
            foreach ($order->items as $item) {
                $product = Product::find($item->product_id);
                if ($product && $product->track_stock) {
                    $prevStock = $product->current_stock;
                    $product->increment('current_stock', $item->quantity);

                    InventoryLog::create([
                        'product_id' => $product->id,
                        'variant_id' => $item->variant_id,
                        'user_id' => $manager->id,
                        'type' => 'sale_void',
                        'quantity_change' => $item->quantity,
                        'previous_stock' => $prevStock,
                        'current_stock' => $product->current_stock,
                        'reference_id' => $order->invoice_number,
                        'notes' => 'Void order #' . $order->invoice_number . ' - Reason: ' . $validated['void_reason'],
                    ]);
                }
            }

            $order->update([
                'status' => 'voided',
                'void_reason' => $validated['void_reason'],
                'voided_by' => $manager->id,
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Order #' . $order->invoice_number . ' berhasil di-void.'
        ]);
    }
}
