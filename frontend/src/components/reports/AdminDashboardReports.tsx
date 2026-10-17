'use client';

import React, { useState } from 'react';
import { Order, Product, Outlet } from '../../types/pos';
import {
  BarChart3,
  Printer,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';

interface AdminDashboardReportsProps {
  outlet: Outlet;
  orders: Order[];
  products: Product[];
}

export const AdminDashboardReports: React.FC<AdminDashboardReportsProps> = ({
  outlet,
  orders,
  products,
}) => {
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Completed Orders
  const completedOrders = orders.filter(o => o.status === 'completed');

  // KPI calculations
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.grand_total, 0);
  const totalSubtotal = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalDiscounts = completedOrders.reduce((sum, o) => sum + o.discount_amount, 0);
  const totalTax = completedOrders.reduce((sum, o) => sum + o.tax_amount, 0);
  const totalService = completedOrders.reduce((sum, o) => sum + o.service_charge, 0);
  const totalCogs = completedOrders.reduce((sum, o) => sum + o.total_cost_price, 0);
  const netProfit = totalRevenue - totalTax - totalCogs;
  const avgBasket = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

  // Payment Breakdown
  const paymentMethodStats = completedOrders.reduce((acc, order) => {
    const method = order.payment_method;
    if (!acc[method]) acc[method] = { count: 0, total: 0 };
    acc[method].count += 1;
    acc[method].total += order.grand_total;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Top Selling Items Ranking
  const itemSalesCount: Record<string, { name: string; qty: number; revenue: number }> = {};
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      if (!itemSalesCount[item.product_name]) {
        itemSalesCount[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 };
      }
      itemSalesCount[item.product_name].qty += item.quantity;
      itemSalesCount[item.product_name].revenue += item.subtotal_price;
    });
  });

  const topItems = Object.values(itemSalesCount).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Print A4 Formal Report
  const handlePrintReport = () => {
    window.print();
  };

  // Export to CSV for Excel
  const handleExportCSV = () => {
    let csv = "No Invoice,Tanggal,Kasir,Meja,Tipe,Metode Bayar,Subtotal,Diskon,Pajak,Service,Grand Total\n";
    completedOrders.forEach(o => {
      csv += `"${o.invoice_number}","${new Date(o.created_at).toLocaleString('id-ID')}","${o.cashier_name || 'Kasir'}","${o.table?.table_number || '-'}","${o.order_type}","${o.payment_method}",${o.subtotal},${o.discount_amount},${o.tax_amount},${o.service_charge},${o.grand_total}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Penjualan_StreetBar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">

      {/* Top Banner & Print/Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#18191B]">Dashboard Laporan & Analitik Penjualan</h2>
          <p className="text-xs text-[#717684]">
            Statistik performa bar, pendapatan omset, kalkulasi laba bersih, dan cetak laporan formal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1.5 touch-btn hover:bg-emerald-100"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel (CSV)</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 touch-btn shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan Formal (A4)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm">
          <div className="flex items-center justify-between text-[#717684] mb-2">
            <span className="text-xs font-bold uppercase">Total Omset Penjualan</span>
            <DollarSign className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-xl font-black text-[#997519]">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">Gross Revenue Termasuk Pajak</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm">
          <div className="flex items-center justify-between text-[#717684] mb-2">
            <span className="text-xs font-bold uppercase">Total Struk Transaksi</span>
            <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-xl font-black text-[#18191B]">
            {completedOrders.length} Pesanan
          </p>
          <span className="text-[10px] text-[#717684]">Rata-rata: Rp {avgBasket.toLocaleString('id-ID')} / Struk</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm">
          <div className="flex items-center justify-between text-[#717684] mb-2">
            <span className="text-xs font-bold uppercase">Estimasi Laba Bersih</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-600">
            Rp {netProfit.toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-[#717684]">Omset - Pajak - Total HPP Bahan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm">
          <div className="flex items-center justify-between text-[#717684] mb-2">
            <span className="text-xs font-bold uppercase">Total Diskon Diberikan</span>
            <Award className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-xl font-black text-amber-700">
            Rp {totalDiscounts.toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-[#717684]">Dari Promo & Happy Hour</span>
        </div>
      </div>

      {/* Middle Grid: Top Products & Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Top Selling Bar Items */}
        <div className="bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm">
          <h3 className="font-bold text-sm text-[#18191B] mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <span>Ranking Menu Terlaris (Top Cocktails & Bites)</span>
          </h3>
          <div className="space-y-2.5">
            {topItems.length === 0 ? (
              <p className="text-xs text-[#717684] py-4 text-center">Belum ada data penjualan.</p>
            ) : (
              topItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F3] border border-[#F0ECE1]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#FAF3E0] text-[#997519] font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#18191B]">{item.name}</p>
                      <p className="text-[10px] text-[#717684]">{item.qty} Porsi / Gelas Terjual</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#997519]">
                    Rp {item.revenue.toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm">
          <h3 className="font-bold text-sm text-[#18191B] mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#D4AF37]" />
            <span>Rincian Berdasarkan Metode Pembayaran</span>
          </h3>
          <div className="space-y-2.5">
            {Object.keys(paymentMethodStats).length === 0 ? (
              <p className="text-xs text-[#717684] py-4 text-center">Belum ada transaksi.</p>
            ) : (
              Object.entries(paymentMethodStats).map(([method, data]) => {
                const percentage = totalRevenue > 0 ? Math.round((data.total / totalRevenue) * 100) : 0;
                return (
                  <div key={method} className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#F0ECE1]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-[#18191B] uppercase">{method.replace('_', ' ')}</span>
                      <span className="font-mono font-bold text-[#997519]">
                        Rp {data.total.toLocaleString('id-ID')} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B38F2C]"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-[#717684] mt-1 block">{data.count} Transaksi</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3D2] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#F0ECE1] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#18191B]">Daftar Struk Transaksi Selesai</h3>
            <p className="text-[11px] text-[#717684]">Detail transaksi yang tercatat dalam Database</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F3] text-[#717684] uppercase font-bold text-[10px] tracking-wider border-b border-[#EAE3D2]">
              <tr>
                <th className="p-3">No Invoice</th>
                <th className="p-3">Waktu</th>
                <th className="p-3">Kasir & Meja</th>
                <th className="p-3">Metode</th>
                <th className="p-3">Diskon</th>
                <th className="p-3 font-bold text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F2EA]">
              {completedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#717684]">Belum ada data transaksi.</td>
                </tr>
              ) : (
                completedOrders.map(order => (
                  <tr key={order.id} className="hover:bg-[#FCFBF8]">
                    <td className="p-3 font-mono font-bold text-[#18191B]">{order.invoice_number}</td>
                    <td className="p-3 text-[#717684] font-mono">{new Date(order.created_at).toLocaleTimeString('id-ID')}</td>
                    <td className="p-3">
                      <p className="font-bold text-[#18191B]">{order.cashier_name || 'Kasir'}</p>
                      <p className="text-[10px] text-[#717684]">{order.table?.table_number || 'Takeaway'}</p>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF3E0] text-[#997519] border border-[#E8DECA] uppercase">
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-amber-700">
                      {order.discount_amount > 0 ? `- Rp ${order.discount_amount.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="p-3 font-mono font-black text-right text-[#997519]">
                      Rp {order.grand_total.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HIDDEN PRINTABLE FORMAL A4 REPORT (SHOWN ONLY DURING WINDOW.PRINT())       */}
      {/* ========================================================================= */}
      <div id="printable-report-area" className="hidden">
        <div className="text-center pb-4 border-b-2 border-black">
          <h1 className="text-2xl font-black uppercase tracking-wider">{outlet.name}</h1>
          <p className="text-xs text-gray-700">{outlet.legal_name || 'PT Street Bar '}</p>
          <p className="text-xs text-gray-700">{outlet.address} • Telp: {outlet.phone}</p>
          <h2 className="text-base font-bold uppercase mt-3 tracking-wide">LAPORAN PENJUALAN & LABA BERSIH POS</h2>
          <p className="text-xs font-mono">Periode: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
        </div>

        {/* Financial KPI Summary Table */}
        <div className="my-6">
          <h3 className="font-bold text-sm uppercase mb-2">1. Ringkasan Finansial</h3>
          <table className="w-full text-xs border border-black border-collapse">
            <tbody>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-100 w-1/2">Total Transaksi Selesai</td>
                <td className="p-2 font-mono text-right">{completedOrders.length} Pesanan</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-100">Subtotal Kotor Penjualan</td>
                <td className="p-2 font-mono text-right">Rp {totalSubtotal.toLocaleString('id-ID')}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-100">Total Diskon Promo</td>
                <td className="p-2 font-mono text-right">- Rp {totalDiscounts.toLocaleString('id-ID')}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-100">Pajak Restoran (PB1 10%)</td>
                <td className="p-2 font-mono text-right">Rp {totalTax.toLocaleString('id-ID')}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-100">Service Charge (5%)</td>
                <td className="p-2 font-mono text-right">Rp {totalService.toLocaleString('id-ID')}</td>
              </tr>
              <tr className="border-b-2 border-black">
                <td className="p-2 font-bold bg-gray-200">TOTAL OMSET BERSIH (GRAND TOTAL)</td>
                <td className="p-2 font-mono font-bold text-base text-right">Rp {totalRevenue.toLocaleString('id-ID')}</td>
              </tr>
              <tr className="border-b border-gray-400">
                <td className="p-2 font-bold bg-gray-100">Total Harga Pokok Penjualan (HPP / COGS)</td>
                <td className="p-2 font-mono text-right">Rp {totalCogs.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold bg-gray-200">ESTIMASI LABA KOTOR OPERASIONAL</td>
                <td className="p-2 font-mono font-bold text-base text-right">Rp {netProfit.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Transaction Detail Table */}
        <div className="my-6">
          <h3 className="font-bold text-sm uppercase mb-2">2. Rincian Struk Penjualan</h3>
          <table className="w-full text-xs border border-black border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="p-2 text-left border-r border-black">Invoice</th>
                <th className="p-2 text-left border-r border-black">Waktu</th>
                <th className="p-2 text-left border-r border-black">Kasir</th>
                <th className="p-2 text-left border-r border-black">Meja</th>
                <th className="p-2 text-left border-r border-black">Metode</th>
                <th className="p-2 text-right">Total (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.map((o, i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="p-1.5 font-mono border-r border-gray-300">{o.invoice_number}</td>
                  <td className="p-1.5 font-mono border-r border-gray-300">{new Date(o.created_at).toLocaleTimeString('id-ID')}</td>
                  <td className="p-1.5 border-r border-gray-300">{o.cashier_name}</td>
                  <td className="p-1.5 border-r border-gray-300">{o.table?.table_number || '-'}</td>
                  <td className="p-1.5 uppercase border-r border-gray-300">{o.payment_method}</td>
                  <td className="p-1.5 font-mono font-bold text-right">Rp {o.grand_total.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-10 text-center text-xs">
          <div>
            <p>Dibuat Oleh (Head Kasir),</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( Sholeh )</p>
          </div>
          <div>
            <p>Mengetahui (Owner / Manager),</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( Aldhiansyah )</p>
          </div>
        </div>
      </div>

    </div>
  );
};
