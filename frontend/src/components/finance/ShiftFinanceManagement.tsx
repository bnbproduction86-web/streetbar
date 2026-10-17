'use client';

import React, { useState } from 'react';
import { WorkShift, CashMovement, UserStaff, Outlet } from '../../types/pos';
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Lock, 
  Unlock, 
  Printer, 
  Receipt, 
  AlertCircle, 
  CheckCircle2,
  HelpCircle,
  FileText
} from 'lucide-react';

interface ShiftFinanceManagementProps {
  outlet: Outlet;
  activeShift: WorkShift | null;
  currentStaff: UserStaff;
  onOpenShift: (openingCash: number, notes: string) => void;
  onCloseShift: (closingCashActual: number, notes: string) => void;
  onAddCashMovement: (movement: { type: 'cash_in' | 'cash_out'; amount: number; category: string; notes?: string }) => void;
  cashMovements: CashMovement[];
}

export const ShiftFinanceManagement: React.FC<ShiftFinanceManagementProps> = ({
  outlet,
  activeShift,
  currentStaff,
  onOpenShift,
  onCloseShift,
  onAddCashMovement,
  cashMovements,
}) => {
  // Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showCashMovementModal, setShowCashMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'cash_in' | 'cash_out'>('cash_out');

  // Form states
  const [openingCashInput, setOpeningCashInput] = useState<number>(500000);
  const [openNotes, setOpenNotes] = useState<string>('Modal laci awal');

  const [closingActualCash, setClosingActualCash] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState<string>('');

  const [movementAmount, setMovementAmount] = useState<number>(50000);
  const [movementCat, setMovementCat] = useState<string>('Pembelian Es Batu Tube');
  const [movementNotes, setMovementNotes] = useState<string>('');

  // Calculations
  const expectedCashInDrawer = activeShift 
    ? (activeShift.opening_cash + activeShift.total_sales_cash + activeShift.total_cash_in - activeShift.total_cash_out)
    : 0;

  const cashDiff = closingActualCash - expectedCashInDrawer;

  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenShift(Number(openingCashInput), openNotes);
    setShowOpenModal(false);
  };

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCloseShift(Number(closingActualCash), closeNotes);
    setShowCloseModal(false);
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCashMovement({
      type: movementType,
      amount: Number(movementAmount),
      category: movementCat,
      notes: movementNotes,
    });
    setShowCashMovementModal(false);
    setMovementNotes('');
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#18191B]">Pengelolaan Keuangan & Shift Kasir</h2>
          <p className="text-xs text-[#717684]">
            Kontrol laci kasir, pengeluaran kas kecil (petty cash), dan rekonsiliasi tutup buku shift (Z-Report).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeShift ? (
            <>
              <button
                onClick={() => { setMovementType('cash_in'); setMovementCat('Uang Pecahan Kas'); setShowCashMovementModal(true); }}
                className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1.5 touch-btn hover:bg-emerald-100"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>Kas Masuk</span>
              </button>

              <button
                onClick={() => { setMovementType('cash_out'); setMovementCat('Pembelian Es Batu Tube'); setShowCashMovementModal(true); }}
                className="px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 touch-btn hover:bg-rose-100"
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>Pengeluaran Kas</span>
              </button>

              <button
                onClick={() => { setClosingActualCash(expectedCashInDrawer); setShowCloseModal(true); }}
                className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 touch-btn shadow-md"
              >
                <Lock className="w-4 h-4" />
                <span>Tutup Shift Kasir</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 touch-btn shadow-md"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Shift Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Shift Dashboard Card */}
      {activeShift ? (
        <div className="bg-white rounded-3xl p-6 border border-[#EAE3D2] shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE1]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#997519] text-white flex items-center justify-center font-bold shadow-md">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-[#18191B]">{activeShift.shift_number}</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    ACTIVE SHIFT
                  </span>
                </div>
                <p className="text-xs text-[#717684]">
                  Kasir: <b>{activeShift.cashier?.name || currentStaff.name}</b> • Dibuka: {new Date(activeShift.opened_at).toLocaleTimeString('id-ID')}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#717684] uppercase tracking-wider block">Estimasi Kas di Laci Saat Ini:</span>
              <span className="text-2xl font-black text-[#997519]">
                Rp {expectedCashInDrawer.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Shift Financial Breakdown Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            <div className="bg-[#FAF8F3] p-3 rounded-2xl border border-[#EAE3D2]">
              <span className="text-[10px] text-[#717684] uppercase font-bold block">1. Modal Awal Laci</span>
              <p className="text-sm font-bold text-[#18191B] mt-1">
                Rp {activeShift.opening_cash.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-[#FAF8F3] p-3 rounded-2xl border border-[#EAE3D2]">
              <span className="text-[10px] text-emerald-700 uppercase font-bold block">2. Penjualan Tunai</span>
              <p className="text-sm font-bold text-emerald-700 mt-1">
                + Rp {activeShift.total_sales_cash.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-[#FAF8F3] p-3 rounded-2xl border border-[#EAE3D2]">
              <span className="text-[10px] text-[#997519] uppercase font-bold block">3. Non-Tunai / QRIS</span>
              <p className="text-sm font-bold text-[#997519] mt-1">
                Rp {activeShift.total_sales_non_cash.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-[#FAF8F3] p-3 rounded-2xl border border-[#EAE3D2]">
              <span className="text-[10px] text-emerald-700 uppercase font-bold block">4. Kas Masuk</span>
              <p className="text-sm font-bold text-emerald-700 mt-1">
                + Rp {activeShift.total_cash_in.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-[#FAF8F3] p-3 rounded-2xl border border-[#EAE3D2]">
              <span className="text-[10px] text-rose-700 uppercase font-bold block">5. Petty Cash Keluar</span>
              <p className="text-sm font-bold text-rose-700 mt-1">
                - Rp {activeShift.total_cash_out.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-[#FAF8F3] p-3 rounded-2xl border border-[#EAE3D2]">
              <span className="text-[10px] text-[#717684] uppercase font-bold block">6. Total Transaksi</span>
              <p className="text-sm font-bold text-[#18191B] mt-1">
                {activeShift.total_orders_count} Struk
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-[#EAE3D2] text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#FAF6EE] text-[#997519] flex items-center justify-center mx-auto mb-3">
            <Unlock className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-[#18191B]">Laci Kasir Belum Dibuka</h3>
          <p className="text-xs text-[#717684] max-w-md mx-auto mt-1 mb-4">
            Buka shift kasir terlebih dahulu dengan memasukkan nominal modal awal pecahan uang di laci kasir.
          </p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white font-bold text-xs rounded-xl shadow-md touch-btn"
          >
            Buka Shift Sekarang
          </button>
        </div>
      )}

      {/* Cash Movement (Petty Cash Log) Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3D2] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#F0ECE1] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#18191B]">Riwayat Kas Masuk & Kas Keluar (Petty Cash)</h3>
            <p className="text-[11px] text-[#717684]">Log pencatatan pengeluaran operasional darurat dan kas masuk</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F3] text-[#717684] uppercase font-bold text-[10px] tracking-wider border-b border-[#EAE3D2]">
              <tr>
                <th className="p-3">Waktu</th>
                <th className="p-3">Jenis Kas</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Catatan / Keperluan</th>
                <th className="p-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F2EA]">
              {cashMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#717684]">
                    Belum ada riwayat petty cash pada shift ini.
                  </td>
                </tr>
              ) : (
                cashMovements.map(m => (
                  <tr key={m.id} className="hover:bg-[#FCFBF8]">
                    <td className="p-3 text-[#717684] font-mono text-[11px]">
                      {new Date(m.created_at).toLocaleTimeString('id-ID')}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        m.type === 'cash_in'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {m.type === 'cash_in' ? '↑ KAS MASUK' : '↓ PENGELUARAN'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#18191B]">{m.category}</td>
                    <td className="p-3 text-[#5E6470]">{m.notes || '-'}</td>
                    <td className={`p-3 font-mono font-bold text-right ${
                      m.type === 'cash_in' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {m.type === 'cash_in' ? '+' : '-'} Rp {m.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Buka Shift Baru */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DECA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <h3 className="font-bold text-base text-[#18191B]">Buka Shift Kasir Baru</h3>
              <button onClick={() => setShowOpenModal(false)} className="text-xs text-[#717684]">✕</button>
            </div>

            <form onSubmit={handleOpenShiftSubmit} className="space-y-3 my-4">
              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">
                  Modal Awal Uang Fisik di Laci (Cash Float) Rp *
                </label>
                <input
                  type="number"
                  required
                  value={openingCashInput || ''}
                  onChange={(e) => setOpeningCashInput(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold font-mono border border-[#E8DECA] rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Catatan Pembukaan:</label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#F0ECE1]">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#717684] rounded-xl border border-[#E8DECA]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] rounded-xl shadow-md touch-btn"
                >
                  Buka Shift & Laci
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Kas Masuk / Kas Keluar */}
      {showCashMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DECA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <h3 className="font-bold text-base text-[#18191B]">
                {movementType === 'cash_in' ? 'Pencatatan Kas Masuk' : 'Pencatatan Pengeluaran Kas (Petty Cash)'}
              </h3>
              <button onClick={() => setShowCashMovementModal(false)} className="text-xs text-[#717684]">✕</button>
            </div>

            <form onSubmit={handleMovementSubmit} className="space-y-3 my-4">
              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Kategori Keperluan:</label>
                <select
                  value={movementCat}
                  onChange={(e) => setMovementCat(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none font-bold"
                >
                  {movementType === 'cash_out' ? (
                    <>
                      <option value="Pembelian Es Batu Tube">Pembelian Es Batu Tube</option>
                      <option value="Beli Gas LPG / Portable">Beli Gas LPG / Portable</option>
                      <option value="Pembelian Buah Garnis (Lemon/Jeruk)">Pembelian Buah Garnis (Lemon/Jeruk)</option>
                      <option value="Biaya Operasional & Kebersihan">Biaya Operasional & Kebersihan</option>
                      <option value="Setoran Uang ke Bank / Owner">Setoran Uang ke Bank / Owner</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </>
                  ) : (
                    <>
                      <option value="Uang Pecahan Kas">Penukaran Uang Pecahan Kecil</option>
                      <option value="Kas Tambahan Operasional">Kas Tambahan Operasional</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Nominal (Rp) *:</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={movementAmount || ''}
                  onChange={(e) => setMovementAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold font-mono border border-[#E8DECA] rounded-xl outline-none text-[#997519]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Keterangan Tambahan:</label>
                <input
                  type="text"
                  placeholder="Keterangan bon / nota fisik..."
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#F0ECE1]">
                <button
                  type="button"
                  onClick={() => setShowCashMovementModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#717684] rounded-xl border border-[#E8DECA]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] rounded-xl shadow-md touch-btn"
                >
                  Simpan Catatan Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tutup Shift & Rekonsiliasi Kas (Z-Report) */}
      {showCloseModal && activeShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DECA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <div>
                <h3 className="font-bold text-base text-[#18191B]">Tutup Shift & Rekonsiliasi (Z-Report)</h3>
                <p className="text-xs text-[#717684]">{activeShift.shift_number}</p>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="text-xs text-[#717684]">✕</button>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="space-y-3 my-4">
              <div className="bg-[#FAF8F3] p-3 rounded-2xl border border-[#EAE3D2] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#717684]">Estimasi Kas Sistem:</span>
                  <span className="font-bold font-mono text-[#18191B]">
                    Rp {expectedCashInDrawer.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">
                  Hitung Uang Tunai Fisik di Laci Rp *:
                </label>
                <input
                  type="number"
                  required
                  value={closingActualCash || ''}
                  onChange={(e) => setClosingActualCash(Number(e.target.value))}
                  className="w-full px-3 py-2 text-lg font-black font-mono border border-[#E8DECA] rounded-xl outline-none text-[#997519] focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Live Variance Calculation */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                cashDiff === 0 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : cashDiff > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <span className="text-xs font-bold">
                  {cashDiff === 0 ? '✓ Kas Klop (Cocok)' : (cashDiff > 0 ? 'Surplus (Kas Lebih)' : 'Defisit (Kas Kurang)')}
                </span>
                <span className="font-mono font-bold text-sm">
                  {cashDiff > 0 ? '+' : ''} Rp {cashDiff.toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Catatan Penutupan Shift:</label>
                <textarea
                  rows={2}
                  placeholder="Catatan jika ada selisih uang, transferan kas, dll..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#F0ECE1]">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#717684] rounded-xl border border-[#E8DECA]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] rounded-xl shadow-md touch-btn"
                >
                  Konfirmasi Tutup Shift (Z-Report)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
