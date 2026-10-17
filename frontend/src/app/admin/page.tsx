'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePos } from '../../context/PosContext';
import { ProductManagement } from '../../components/inventory/ProductManagement';
import { ShiftFinanceManagement } from '../../components/finance/ShiftFinanceManagement';
import { PromoManagement } from '../../components/promo/PromoManagement';
import { AdminDashboardReports } from '../../components/reports/AdminDashboardReports';
import { StaffManagement } from '../../components/staff/StaffManagement';
import { 
  BarChart3, 
  Package, 
  Wallet, 
  Tag, 
  Users, 
  ShoppingBag, 
  ShieldCheck, 
  LogOut, 
  Lock,
  ArrowRight
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const {
    currentUser,
    allStaff,
    outlet,
    products,
    categories,
    promotions,
    orders,
    activeShift,
    cashMovements,
    dbConnected,
    addProduct,
    updateProduct,
    adjustStock,
    openShift,
    closeShift,
    recordCashMovement,
    addPromotion,
    togglePromotion,
    addUser,
    updateUser,
    setCurrentUser,
    logout,
  } = usePos();

  const [activeAdminTab, setActiveAdminTab] = useState<'analytics' | 'inventory' | 'finance' | 'promo' | 'staff'>('analytics');
  
  // Guard PIN challenge if user is currently cashier
  const [adminAuthVerified, setAdminAuthVerified] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'manager')) {
      setAdminAuthVerified(true);
    }
  }, [currentUser]);

  const handleAdminPinChallenge = () => {
    const match = allStaff.find(
      s => s.pin_code === adminPin && (s.role === 'super_admin' || s.role === 'manager')
    );
    if (match) {
      setCurrentUser(match);
      setAdminAuthVerified(true);
      setPinError('');
    } else {
      setPinError('PIN salah atau akun bukan role Admin/Manager!');
    }
  };

  // If role is not admin, show PIN challenge modal
  if (!adminAuthVerified) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DECA]">
          <div className="text-center pb-4 border-b border-[#F0ECE1]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#997519] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="font-serif font-bold text-xl text-[#18191B]">Akses Portal Admin</h2>
            <p className="text-xs text-[#717684] mt-1">
              Halaman ini dibatasi khusus role <b>Super Admin (Owner)</b> dan <b>Manager</b>.
            </p>
          </div>

          <div className="my-5">
            <label className="text-xs font-bold text-[#18191B] block mb-2 text-center">
              Masukkan 6-Digit PIN Admin / Manager:
            </label>

            <div className="flex justify-center gap-3 my-3">
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <div
                  key={idx}
                  className={`w-9 h-11 rounded-xl border-2 flex items-center justify-center font-mono font-bold text-lg ${
                    adminPin.length > idx
                      ? 'border-[#D4AF37] bg-[#FAF3E0] text-[#18191B]'
                      : 'border-[#EAE3D2] bg-white text-transparent'
                  }`}
                >
                  {adminPin.length > idx ? '●' : ''}
                </div>
              ))}
            </div>

            {pinError && (
              <p className="text-xs text-rose-600 font-bold text-center mt-2">{pinError}</p>
            )}

            {/* Touch Numpad */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    if (adminPin.length < 6) {
                      setAdminPin(prev => prev + num.toString());
                      setPinError('');
                    }
                  }}
                  className="h-12 bg-white hover:bg-[#FAF3E0] border border-[#E8DECA] rounded-xl text-lg font-bold text-[#18191B] touch-btn shadow-2xs"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setAdminPin(prev => prev.slice(0, -1))}
                className="h-12 bg-[#F5F2EA] border border-[#E8DECA] rounded-xl text-xs font-bold text-[#717684] touch-btn"
              >
                HAPUS
              </button>
              <button
                onClick={() => {
                  if (adminPin.length < 6) {
                    setAdminPin(prev => prev + '0');
                    setPinError('');
                  }
                }}
                className="h-12 bg-white hover:bg-[#FAF3E0] border border-[#E8DECA] rounded-xl text-lg font-bold text-[#18191B] touch-btn shadow-2xs"
              >
                0
              </button>
              <button
                disabled={adminPin.length < 6}
                onClick={handleAdminPinChallenge}
                className="h-12 bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white font-bold text-xs rounded-xl touch-btn shadow-md disabled:opacity-40"
              >
                BUKA
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex items-center justify-between text-xs">
              <button
                onClick={() => router.push('/pos')}
                className="text-[#997519] font-bold hover:underline"
              >
                ← Kembali ke Kasir
              </button>

              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="text-rose-600 font-bold hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex flex-col">
      
      {/* ========================================================================= */}
      {/* ADMIN NAVIGATION HEADER                                                   */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-[#EAE3D2] px-5 py-3 shadow-xs sticky top-0 z-40">
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand & Admin Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#997519] text-white flex items-center justify-center font-serif font-black text-xl shadow-md border border-[#F4E4BA]">
              SB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-base text-[#18191B]">STREET BAR POS</h1>
                <span className="bg-[#FAF3E0] text-[#997519] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#E8DECA] uppercase">
                  ADMIN PORTAL
                </span>
              </div>
              <p className="text-[11px] text-[#717684]">
                Logged in as: <b>{currentUser?.name}</b> ({currentUser?.role.replace('_', ' ')})
              </p>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-[#F5F2EA] p-1 rounded-xl border border-[#EAE3D2]">
            <button
              onClick={() => setActiveAdminTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition touch-btn ${
                activeAdminTab === 'analytics'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-xs'
                  : 'text-[#5E6470] hover:text-[#18191B]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard & Laporan</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('inventory')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition touch-btn ${
                activeAdminTab === 'inventory'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-xs'
                  : 'text-[#5E6470] hover:text-[#18191B]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Menu & Stok</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('finance')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition touch-btn ${
                activeAdminTab === 'finance'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-xs'
                  : 'text-[#5E6470] hover:text-[#18191B]'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Keuangan & Shift</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('promo')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition touch-btn ${
                activeAdminTab === 'promo'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-xs'
                  : 'text-[#5E6470] hover:text-[#18191B]'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Promo</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('staff')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition touch-btn ${
                activeAdminTab === 'staff'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-xs'
                  : 'text-[#5E6470] hover:text-[#18191B]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Kasir & PIN</span>
            </button>
          </nav>

          {/* Direct Switch to Cashier View & Log Out */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/pos')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] hover:from-[#B38F2C] hover:to-[#8C6D23] text-white text-xs font-black shadow-md touch-btn"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buka Kasir Touchscreen</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>

            <button
              onClick={() => setShowLogoutModal(true)}
              title="Keluar dari Admin Portal (Log Out)"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 border border-[#EAE3D2] hover:border-rose-300 text-[#717684] hover:text-rose-700 text-xs font-bold touch-btn shadow-2xs transition"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Tab View Content */}
      <main className="flex-1 pb-10">
        {activeAdminTab === 'analytics' && (
          <AdminDashboardReports
            outlet={outlet}
            orders={orders}
            products={products}
          />
        )}

        {activeAdminTab === 'inventory' && (
          <ProductManagement
            products={products}
            categories={categories}
            onAddProduct={addProduct}
            onUpdateProduct={updateProduct}
            onAdjustStock={adjustStock}
          />
        )}

        {activeAdminTab === 'finance' && (
          <ShiftFinanceManagement
            outlet={outlet}
            activeShift={activeShift}
            currentStaff={currentUser || allStaff[0]}
            onOpenShift={openShift}
            onCloseShift={closeShift}
            onAddCashMovement={(m) => recordCashMovement(m.type, m.amount, m.category, m.notes)}
            cashMovements={cashMovements}
          />
        )}

        {activeAdminTab === 'promo' && (
          <PromoManagement
            promotions={promotions}
            onAddPromotion={addPromotion}
            onTogglePromotion={togglePromotion}
          />
        )}

        {activeAdminTab === 'staff' && (
          <StaffManagement
            staffList={allStaff}
            onAddStaff={addUser}
            onUpdateStaff={updateUser}
          />
        )}
      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E8DECA] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <LogOut className="w-7 h-7" />
            </div>

            <h3 className="font-serif font-bold text-lg text-center text-[#18191B]">Konfirmasi Log Out Admin</h3>
            <p className="text-xs text-[#717684] text-center mt-1">
              Apakah Anda yakin ingin keluar dari Admin Portal akun <b>{currentUser?.name}</b>?
            </p>

            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="py-2.5 rounded-xl border border-[#EAE3D2] bg-white hover:bg-[#FAF8F3] text-xs font-bold text-[#717684] touch-btn"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                  router.push('/');
                }}
                className="py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold shadow-md touch-btn"
              >
                Ya, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
