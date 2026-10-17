<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WorkShift;
use App\Models\CashMovement;
use App\Models\Order;
use Carbon\Carbon;

class ShiftController extends Controller
{
    /**
     * Get active shift for cashier
     */
    public function currentShift()
    {
        $shift = WorkShift::with(['cashier', 'cashMovements.user'])
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();

        if (!$shift) {
            return response()->json([
                'status' => 'success',
                'has_active_shift' => false,
                'data' => null
            ]);
        }

        // Live calculation of expected cash
        $cashSales = Order::where('shift_id', $shift->id)
            ->where('status', 'completed')
            ->where('payment_method', 'cash')
            ->sum('grand_total');

        $nonCashSales = Order::where('shift_id', $shift->id)
            ->where('status', 'completed')
            ->where('payment_method', '!=', 'cash')
            ->sum('grand_total');

        $cashInTotal = CashMovement::where('shift_id', $shift->id)->where('type', 'cash_in')->sum('amount');
        $cashOutTotal = CashMovement::where('shift_id', $shift->id)->where('type', 'cash_out')->sum('amount');

        $expectedCash = $shift->opening_cash + $cashSales + $cashInTotal - $cashOutTotal;

        return response()->json([
            'status' => 'success',
            'has_active_shift' => true,
            'data' => [
                'shift' => $shift,
                'summary' => [
                    'opening_cash' => (float)$shift->opening_cash,
                    'cash_sales' => (float)$cashSales,
                    'non_cash_sales' => (float)$nonCashSales,
                    'total_sales' => (float)($cashSales + $nonCashSales),
                    'cash_in' => (float)$cashInTotal,
                    'cash_out' => (float)$cashOutTotal,
                    'expected_cash_drawer' => (float)$expectedCash,
                    'orders_count' => Order::where('shift_id', $shift->id)->count(),
                ]
            ]
        ]);
    }

    /**
     * Open a new shift
     */
    public function openShift(Request $request)
    {
        $validated = $request->validate([
            'cashier_id' => 'required|exists:users,id',
            'opening_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Check if there is already an open shift
        $existing = WorkShift::where('status', 'open')->first();
        if ($existing) {
            return response()->json([
                'status' => 'error',
                'message' => 'Masih ada shift yang aktif! Silakan tutup shift terlebih dahulu.'
            ], 400);
        }

        $shiftNumber = 'SHIFT-' . date('Ymd') . '-' . str_pad(WorkShift::whereDate('created_at', today())->count() + 1, 2, '0', STR_PAD_LEFT);

        $shift = WorkShift::create([
            'outlet_id' => 1,
            'cashier_id' => $validated['cashier_id'],
            'shift_number' => $shiftNumber,
            'opening_cash' => $validated['opening_cash'],
            'status' => 'open',
            'opened_at' => now(),
            'notes' => $validated['notes'] ?? 'Buka laci kasir',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Shift kasir #' . $shiftNumber . ' berhasil dibuka!',
            'data' => $shift->load('cashier')
        ], 201);
    }

    /**
     * Record cash in / cash out (Petty Cash)
     */
    public function recordCashMovement(Request $request)
    {
        $validated = $request->validate([
            'shift_id' => 'required|exists:work_shifts,id',
            'user_id' => 'required|exists:users,id',
            'type' => 'required|in:cash_in,cash_out',
            'amount' => 'required|numeric|min:1000',
            'category' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $movement = CashMovement::create($validated);

        // Update shift totals
        $shift = WorkShift::findOrFail($validated['shift_id']);
        if ($validated['type'] === 'cash_in') {
            $shift->increment('total_cash_in', $validated['amount']);
        } else {
            $shift->increment('total_cash_out', $validated['amount']);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Pencatatan kas (' . ($validated['type'] === 'cash_in' ? 'Kas Masuk' : 'Pengeluaran/Kas Keluar') . ') tersimpan!',
            'data' => $movement
        ], 201);
    }

    /**
     * Close shift with cash reconciliation (Z-Report)
     */
    public function closeShift(Request $request, $id)
    {
        $shift = WorkShift::findOrFail($id);
        if ($shift->status === 'closed') {
            return response()->json([
                'status' => 'error',
                'message' => 'Shift ini sudah ditutup sebelumnya.'
            ], 400);
        }

        $validated = $request->validate([
            'closing_cash_actual' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Calculate expected cash
        $cashSales = Order::where('shift_id', $shift->id)
            ->where('status', 'completed')
            ->where('payment_method', 'cash')
            ->sum('grand_total');

        $nonCashSales = Order::where('shift_id', $shift->id)
            ->where('status', 'completed')
            ->where('payment_method', '!=', 'cash')
            ->sum('grand_total');

        $cashInTotal = CashMovement::where('shift_id', $shift->id)->where('type', 'cash_in')->sum('amount');
        $cashOutTotal = CashMovement::where('shift_id', $shift->id)->where('type', 'cash_out')->sum('amount');

        $expectedCash = $shift->opening_cash + $cashSales + $cashInTotal - $cashOutTotal;
        $actualCash = $validated['closing_cash_actual'];
        $diff = $actualCash - $expectedCash;

        $shift->update([
            'closing_cash_actual' => $actualCash,
            'closing_cash_expected' => $expectedCash,
            'cash_difference' => $diff,
            'total_sales_cash' => $cashSales,
            'total_sales_non_cash' => $nonCashSales,
            'total_cash_in' => $cashInTotal,
            'total_cash_out' => $cashOutTotal,
            'status' => 'closed',
            'closed_at' => now(),
            'notes' => $validated['notes'] ?? $shift->notes,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Shift kasir #' . $shift->shift_number . ' resmi ditutup.',
            'data' => [
                'shift' => $shift,
                'reconciliation' => [
                    'opening_cash' => (float)$shift->opening_cash,
                    'cash_sales' => (float)$cashSales,
                    'non_cash_sales' => (float)$nonCashSales,
                    'total_sales' => (float)($cashSales + $nonCashSales),
                    'cash_in' => (float)$cashInTotal,
                    'cash_out' => (float)$cashOutTotal,
                    'expected_cash' => (float)$expectedCash,
                    'actual_cash' => (float)$actualCash,
                    'difference' => (float)$diff,
                    'status_diff' => $diff == 0 ? 'MATCH' : ($diff > 0 ? 'SURPLUS' : 'DEFICIT')
                ]
            ]
        ]);
    }

    /**
     * Get list of historical shifts
     */
    public function getShiftHistory()
    {
        $shifts = WorkShift::with(['cashier', 'cashMovements.user'])
            ->latest('opened_at')
            ->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $shifts
        ]);
    }
}
