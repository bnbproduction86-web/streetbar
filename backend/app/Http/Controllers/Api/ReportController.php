<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\WorkShift;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Dashboard KPI & Analytics
     */
    public function dashboard(Request $request)
    {
        $today = Carbon::today();

        // Today KPIs
        $todayOrders = Order::whereDate('created_at', $today)->where('status', 'completed');
        $todaySales = (float) $todayOrders->sum('grand_total');
        $todayCount = $todayOrders->count();
        $avgTicket = $todayCount > 0 ? (float) ($todaySales / $todayCount) : 0;
        $todayCogs = (float) $todayOrders->sum('total_cost_price');
        $todayTax = (float) $todayOrders->sum('tax_amount');
        $netProfit = $todaySales - $todayTax - $todayCogs;

        // Low stock alerts
        $lowStockProducts = Product::where('track_stock', true)
            ->whereColumn('current_stock', '<=', 'min_stock_alert')
            ->select('id', 'name', 'current_stock', 'min_stock_alert', 'unit')
            ->get();

        // Hourly distribution for today
        $hourlySales = Order::whereDate('created_at', $today)
            ->where('status', 'completed')
            ->select(
                DB::raw('strftime("%H", created_at) as hour'),
                DB::raw('COUNT(id) as total_orders'),
                DB::raw('SUM(grand_total) as total_amount')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        // Fallback or SQLite/MySQL safe hourly aggregation
        if ($hourlySales->isEmpty()) {
            // Check MySQL format if running on MariaDB
            $hourlySales = Order::whereDate('created_at', $today)
                ->where('status', 'completed')
                ->select(
                    DB::raw('HOUR(created_at) as hour'),
                    DB::raw('COUNT(id) as total_orders'),
                    DB::raw('SUM(grand_total) as total_amount')
                )
                ->groupBy('hour')
                ->orderBy('hour')
                ->get();
        }

        // Top 5 selling items
        $topProducts = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'completed')
            ->select(
                'order_items.product_name',
                DB::raw('SUM(order_items.quantity) as total_qty'),
                DB::raw('SUM(order_items.subtotal_price) as total_sales')
            )
            ->groupBy('order_items.product_name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        // Payment method breakdown
        $paymentBreakdown = Order::where('status', 'completed')
            ->whereDate('created_at', $today)
            ->select('payment_method', DB::raw('COUNT(id) as count'), DB::raw('SUM(grand_total) as amount'))
            ->groupBy('payment_method')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'kpi' => [
                    'today_sales' => $todaySales,
                    'today_orders_count' => $todayCount,
                    'average_basket_size' => round($avgTicket, 2),
                    'net_profit' => round($netProfit, 2),
                    'low_stock_count' => $lowStockProducts->count(),
                ],
                'low_stock_alerts' => $lowStockProducts,
                'hourly_sales' => $hourlySales,
                'top_products' => $topProducts,
                'payment_breakdown' => $paymentBreakdown,
            ]
        ]);
    }

    /**
     * Detailed Sales Report with Date Range Filtering for Printing / Export
     */
    public function salesReport(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::today()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', Carbon::today()->toDateString());

        $query = Order::with(['cashier', 'table', 'customer'])
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc');

        $orders = $query->get();

        $totalSales = $orders->sum('grand_total');
        $totalSubtotal = $orders->sum('subtotal');
        $totalDiscounts = $orders->sum('discount_amount');
        $totalTax = $orders->sum('tax_amount');
        $totalService = $orders->sum('service_charge');
        $totalCogs = $orders->sum('total_cost_price');
        $netProfit = $totalSales - $totalTax - $totalCogs;

        return response()->json([
            'status' => 'success',
            'data' => [
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'summary' => [
                    'total_transactions' => $orders->count(),
                    'gross_subtotal' => (float)$totalSubtotal,
                    'total_discounts' => (float)$totalDiscounts,
                    'total_tax' => (float)$totalTax,
                    'total_service' => (float)$totalService,
                    'total_net_sales' => (float)$totalSales,
                    'total_cogs' => (float)$totalCogs,
                    'net_profit' => (float)$netProfit,
                ],
                'transactions' => $orders,
            ]
        ]);
    }
}
