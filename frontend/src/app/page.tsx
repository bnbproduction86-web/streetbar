'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePos } from '../context/PosContext';
import { UserStaff } from '../types/pos';
import {
  ShoppingBag,
  ShieldCheck,
  KeyRound,
  UserCheck,
  Wine,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { allStaff, setCurrentUser, dbConnected } = usePos();

  const [activeTab, setActiveTab] = useState<'cashier' | 'admin'>('cashier');
  const [selectedStaff, setSelectedStaff] = useState<UserStaff | null>(allStaff[2] || null); // Default Kasir 1
  const [pinCode, setPinCode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Cashiers vs Admin lists
  const cashierStaff = allStaff.filter(s => s.role === 'cashier' || s.role === 'bartender');
  const adminStaff = allStaff.filter(s => s.role === 'super_admin' || s.role === 'manager');

  const handleDigitClick = (num: string) => {
    if (pinCode.length < 6) {
      setPinCode(prev => prev + num);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPinCode(prev => prev.slice(0, -1));
  };

  const handleLoginSubmit = () => {
    if (!selectedStaff) return;

    if (pinCode === selectedStaff.pin_code) {
      setCurrentUser(selectedStaff);
      if (selectedStaff.role === 'super_admin' || selectedStaff.role === 'manager') {
        router.push('/admin');
      } else {
        router.push('/pos');
      }
    } else {
      setErrorMsg('PIN salah! Silakan coba lagi.');
      setPinCode('');
    }
  };

  const handleDirectQuickLogin = (staff: UserStaff) => {
    setCurrentUser(staff);
    if (staff.role === 'super_admin' || staff.role === 'manager') {
      router.push('/admin');
    } else {
      router.push('/pos');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCF9] via-[#FAF6EE] to-[#F5EFE0] flex flex-col justify-between p-4 sm:p-6 select-none">

      {/* Top Header */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full pt-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#997519] text-white flex items-center justify-center font-serif font-black text-2xl shadow-md border border-[#F4E4BA]">
            SB
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl tracking-tight text-[#18191B]">STREET BAR POS</h1>
            <p className="text-xs text-[#717684]">
              Point of Sale & Bar Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#E8DECA] shadow-2xs">
          <span className={`w-2.5 h-2.5 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span className="text-xs font-bold text-[#18191B]">
            {dbConnected ? 'Database Connected' : 'POS Standalone'}
          </span>
        </div>
      </div>

      {/* Main Authentication Box */}
      <div className="max-w-4xl mx-auto w-full my-6 bg-white rounded-3xl border border-[#EAE3D2] shadow-2xl p-6 sm:p-8">

        {/* Role Segmented Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-[#F5F2EA] p-1.5 rounded-2xl border border-[#E8DECA] mb-6">
          <button
            onClick={() => {
              setActiveTab('cashier');
              setSelectedStaff(cashierStaff[0] || null);
              setPinCode('');
              setErrorMsg('');
            }}
            className={`py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition touch-btn ${activeTab === 'cashier'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-md'
              : 'text-[#717684] hover:text-[#18191B]'
              }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Akses Kasir Touchscreen (Role Kasir)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('admin');
              setSelectedStaff(adminStaff[0] || null);
              setPinCode('');
              setErrorMsg('');
            }}
            className={`py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition touch-btn ${activeTab === 'admin'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-md'
              : 'text-[#717684] hover:text-[#18191B]'
              }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Akses Admin Dashboard (Role Admin)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

          {/* Left Column: Account Selection */}
          <div className="space-y-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#18191B]">
                {activeTab === 'cashier' ? 'Pilih Akun Kasir / Bartender' : 'Pilih Akun Super Admin / Manager'}
              </h3>
              <p className="text-xs text-[#717684]">
                {activeTab === 'cashier'
                  ? 'Akses langsung ke layar transaksi sentuh, menu kasir, dan laci shift.'
                  : 'Akses penuh ke manajemen menu, stok opname, laporan laba, dan data kasir.'}
              </p>
            </div>

            <div className="space-y-2 mt-4">
              {(activeTab === 'cashier' ? cashierStaff : adminStaff).map(staff => (
                <div
                  key={staff.id}
                  onClick={() => { setSelectedStaff(staff); setPinCode(''); setErrorMsg(''); }}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer touch-btn transition ${selectedStaff?.id === staff.id
                    ? 'border-[#D4AF37] bg-[#FAF3E0] ring-2 ring-[#D4AF37]/30 shadow-xs'
                    : 'border-[#EAE3D2] bg-white hover:bg-[#FAF8F3]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-[#18191B]">{staff.name}</p>
                      <p className="text-[11px] text-[#717684] capitalize">Role: {staff.role.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-1 bg-white rounded-lg border border-[#E8DECA] text-[#997519]">
                    PIN: {staff.pin_code}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick 1-Click Launch Bar */}
            <div className="pt-3 border-t border-[#F0ECE1]">
              <span className="text-[10px] text-[#717684] font-bold uppercase tracking-wider block mb-2">
                Akses Langsung 1-Klik:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDirectQuickLogin(cashierStaff[0])}
                  className="flex-1 py-2 px-3 bg-[#FAF3E0] hover:bg-[#FAF0D4] text-[#997519] text-xs font-bold rounded-xl border border-[#E8DECA] flex items-center justify-center gap-1.5 touch-btn"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Buka Kasir</span>
                </button>
                <button
                  onClick={() => handleDirectQuickLogin(adminStaff[0])}
                  className="flex-1 py-2 px-3 bg-[#18191B] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 touch-btn"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Buka Admin (Owner)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Touchscreen PIN Pad */}
          <div className="bg-[#FAF8F3] p-5 rounded-3xl border border-[#EAE3D2]">
            <div className="text-center mb-3">
              <span className="text-xs font-bold text-[#18191B]">
                Masukkan 6-Digit PIN {selectedStaff?.name.split(' ')[0]}:
              </span>

              {/* PIN Bubbles Display */}
              <div className="flex justify-center gap-2.5 my-3">
                {[0, 1, 2, 3, 4, 5].map(idx => (
                  <div
                    key={idx}
                    className={`w-9 h-11 rounded-xl border-2 flex items-center justify-center font-mono font-bold text-lg transition-all ${pinCode.length > idx
                      ? 'border-[#D4AF37] bg-white text-[#18191B] shadow-2xs'
                      : 'border-[#EAE3D2] bg-white/50 text-transparent'
                      }`}
                  >
                    {pinCode.length > idx ? '●' : ''}
                  </div>
                ))}
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-600 font-bold mt-1 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errorMsg}
                </p>
              )}
            </div>

            {/* Touch Numpad */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleDigitClick(num.toString())}
                  className="h-12 bg-white hover:bg-[#FAF3E0] border border-[#E8DECA] rounded-xl text-lg font-bold text-[#18191B] touch-btn shadow-2xs"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="h-12 bg-[#F5F2EA] border border-[#E8DECA] rounded-xl text-xs font-bold text-[#717684] touch-btn"
              >
                HAPUS
              </button>
              <button
                onClick={() => handleDigitClick('0')}
                className="h-12 bg-white hover:bg-[#FAF3E0] border border-[#E8DECA] rounded-xl text-lg font-bold text-[#18191B] touch-btn shadow-2xs"
              >
                0
              </button>
              <button
                disabled={pinCode.length < 6}
                onClick={handleLoginSubmit}
                className="h-12 bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] hover:from-[#B38F2C] hover:to-[#8C6D23] text-white font-bold text-xs rounded-xl touch-btn shadow-md disabled:opacity-40"
              >
                MASUK
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#717684] pb-2">
        Street Bar POS
      </div>
    </div>
  );
}
