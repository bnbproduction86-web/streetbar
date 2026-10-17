'use client';

import React, { useState, useEffect } from 'react';
import { UserStaff, WorkShift } from '../../types/pos';
import {
  ShoppingBag,
  Package,
  Wallet,
  Tag,
  BarChart3,
  UserCheck,
  Clock,
  Maximize2,
  Database,
  KeyRound,
  ShieldAlert,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'pos' | 'inventory' | 'finance' | 'promo' | 'reports';
  onSelectTab: (tab: 'pos' | 'inventory' | 'finance' | 'promo' | 'reports') => void;
  currentStaff: UserStaff;
  allStaff: UserStaff[];
  onSwitchStaff: (staff: UserStaff) => void;
  activeShift: WorkShift | null;
  dbConnected: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentStaff,
  allStaff,
  onSwitchStaff,
  activeShift,
  dbConnected,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [selectedStaffToSwitch, setSelectedStaffToSwitch] = useState<UserStaff | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePinDigit = (digit: string) => {
    if (enteredPin.length < 6) {
      setEnteredPin(prev => prev + digit);
      setPinError('');
    }
  };

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleVerifyPin = () => {
    if (!selectedStaffToSwitch) return;
    if (enteredPin === selectedStaffToSwitch.pin_code) {
      onSwitchStaff(selectedStaffToSwitch);
      setShowPinModal(false);
      setEnteredPin('');
      setSelectedStaffToSwitch(null);
    } else {
      setPinError('PIN salah! Silakan coba lagi.');
      setEnteredPin('');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
    }
  };

  return (
    <>
      <header className="bg-white border-b border-[#EAE3D2] px-4 py-2.5 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between gap-3">

          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#997519] flex items-center justify-center text-white font-serif font-black text-xl shadow-md border border-[#F4E4BA]">
              SB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-lg tracking-tight text-[#18191B]">STREET BAR</h1>
                <span className="bg-[#FAF3E0] text-[#997519] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#E8DECA] uppercase tracking-wider">
                  GOLD EDITION
                </span>
              </div>
              <p className="text-[11px] text-[#717684] flex items-center gap-1.5 font-medium">
                <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                {dbConnected ? 'Street Bar Optimal POS' : 'Standalone POS'}
              </p>
            </div>
          </div>

          {/* Nav Tabs for Touchscreen */}
          <nav className="flex items-center gap-1 bg-[#F5F2EA] p-1 rounded-xl border border-[#EAE3D2]">
            <button
              onClick={() => onSelectTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all touch-btn ${currentTab === 'pos'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-sm'
                : 'text-[#5E6470] hover:text-[#18191B] hover:bg-white/60'
                }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Kasir</span>
            </button>

            <button
              onClick={() => onSelectTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all touch-btn ${currentTab === 'inventory'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-sm'
                : 'text-[#5E6470] hover:text-[#18191B] hover:bg-white/60'
                }`}
            >
              <Package className="w-4 h-4" />
              <span>Menu & Stok</span>
            </button>

            <button
              onClick={() => onSelectTab('finance')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all touch-btn ${currentTab === 'finance'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-sm'
                : 'text-[#5E6470] hover:text-[#18191B] hover:bg-white/60'
                }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Kas & Keuangan</span>
            </button>

            <button
              onClick={() => onSelectTab('promo')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all touch-btn ${currentTab === 'promo'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-sm'
                : 'text-[#5E6470] hover:text-[#18191B] hover:bg-white/60'
                }`}
            >
              <Tag className="w-4 h-4" />
              <span>Promo</span>
            </button>

            <button
              onClick={() => onSelectTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all touch-btn ${currentTab === 'reports'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-sm'
                : 'text-[#5E6470] hover:text-[#18191B] hover:bg-white/60'
                }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Laporan & Cetak</span>
            </button>
          </nav>

          {/* Right Header Status: Clock, Cashier Switch, Fullscreen */}
          <div className="flex items-center gap-3">

            {/* Live Clock */}
            <div className="hidden lg:flex flex-col items-end text-right px-2 py-1">
              <span className="font-mono text-xs font-bold text-[#18191B] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#997519]" />
                {currentTime}
              </span>
              <span className="text-[10px] text-[#717684]">{currentDate}</span>
            </div>

            {/* Active Cashier & Switch Button */}
            <button
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-2.5 bg-[#FAF6EE] hover:bg-[#F4ECE0] border border-[#E8DECA] px-3 py-1.5 rounded-xl touch-btn transition"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {currentStaff.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#18191B] leading-tight">{currentStaff.name.split(' ')[0]}</p>
                <p className="text-[10px] text-[#8C6D23] font-medium capitalize">
                  {currentStaff.role.replace('_', ' ')} • {activeShift ? 'Shift On' : 'No Shift'}
                </p>
              </div>
              <KeyRound className="w-3.5 h-3.5 text-[#8C6D23] ml-1" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title="Fullscreen Touchscreen Mode"
              className="w-9 h-9 rounded-xl border border-[#EAE3D2] flex items-center justify-center text-[#5E6470] hover:text-[#18191B] hover:bg-[#F5F2EA] touch-btn"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Log Out Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Keluar (Log Out)"
                className="w-9 h-9 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-center text-rose-600 hover:bg-rose-100 touch-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Touchscreen Fast PIN Modal for Cashier Switch */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8DECA] animate-in fade-in zoom-in-95 duration-150">

            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FAF3E0] text-[#997519] flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#18191B]">Ganti Kasir / Otorisasi PIN</h3>
                  <p className="text-xs text-[#717684]">Pilih akun & masukkan PIN 6 angka</p>
                </div>
              </div>
              <button
                onClick={() => { setShowPinModal(false); setEnteredPin(''); setSelectedStaffToSwitch(null); }}
                className="text-[#997519] hover:bg-[#FAF3E0] p-1.5 rounded-lg text-xs font-bold"
              >
                ✕ Batal
              </button>
            </div>

            {/* Select Staff Grid */}
            <div className="my-4">
              <label className="text-[11px] font-bold text-[#717684] uppercase tracking-wider block mb-2">
                Pilih Akun Kasir:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {allStaff.map(staff => (
                  <button
                    key={staff.id}
                    onClick={() => { setSelectedStaffToSwitch(staff); setEnteredPin(''); setPinError(''); }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 touch-btn transition ${selectedStaffToSwitch?.id === staff.id
                      ? 'border-[#D4AF37] bg-[#FAF3E0] ring-2 ring-[#D4AF37]/30'
                      : 'border-[#EAE3D2] bg-white hover:bg-[#F9F7F1]'
                      }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#D4AF37] text-white flex items-center justify-center font-bold text-xs">
                      {staff.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#18191B] truncate">{staff.name}</p>
                      <p className="text-[10px] text-[#717684] capitalize">{staff.role.replace('_', ' ')}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* PIN Display */}
            <div className="my-3 text-center">
              <label className="text-xs text-[#5E6470] font-medium block mb-1">
                {selectedStaffToSwitch ? `Masukkan PIN untuk ${selectedStaffToSwitch.name}` : 'Pilih kasir di atas terlebih dahulu'}
              </label>
              <div className="flex justify-center gap-3 my-2">
                {[0, 1, 2, 3, 4, 5].map(idx => (
                  <div
                    key={idx}
                    className={`w-9 h-11 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-lg transition-all ${enteredPin.length > idx
                      ? 'border-[#D4AF37] bg-[#FAF3E0] text-[#18191B]'
                      : 'border-[#EAE3D2] bg-[#FBFBFC] text-transparent'
                      }`}
                  >
                    {enteredPin.length > idx ? '●' : ''}
                  </div>
                ))}
              </div>
              {pinError && (
                <p className="text-xs text-rose-600 font-bold mt-1 flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {pinError}
                </p>
              )}
            </div>

            {/* Touchscreen Numpad */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  disabled={!selectedStaffToSwitch}
                  onClick={() => handlePinDigit(num.toString())}
                  className="h-12 bg-white hover:bg-[#FAF3E0] border border-[#E8DECA] rounded-xl text-lg font-bold text-[#18191B] touch-btn shadow-sm disabled:opacity-40"
                >
                  {num}
                </button>
              ))}
              <button
                disabled={!selectedStaffToSwitch || enteredPin.length === 0}
                onClick={handleBackspace}
                className="h-12 bg-[#F5F2EA] hover:bg-[#EAE3D2] border border-[#E8DECA] rounded-xl text-xs font-bold text-[#717684] touch-btn disabled:opacity-40"
              >
                HAPUS
              </button>
              <button
                disabled={!selectedStaffToSwitch}
                onClick={() => handlePinDigit('0')}
                className="h-12 bg-white hover:bg-[#FAF3E0] border border-[#E8DECA] rounded-xl text-lg font-bold text-[#18191B] touch-btn shadow-sm disabled:opacity-40"
              >
                0
              </button>
              <button
                disabled={!selectedStaffToSwitch || enteredPin.length < 6}
                onClick={handleVerifyPin}
                className="h-12 bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] hover:from-[#B38F2C] hover:to-[#8C6D23] text-white font-bold text-xs rounded-xl touch-btn shadow-md disabled:opacity-40"
              >
                MASUK
              </button>
            </div>

            {/* Quick Demo PIN note */}
            <p className="text-center text-[10px] text-[#997519] mt-3 bg-[#FAF3E0] p-1.5 rounded-lg border border-[#E8DECA]">
              💡 PIN Kasir Sholeh: <b>123456</b> | Owner Aldhiansyah: <b>112233</b> | Manager: <b>998877</b>
            </p>
          </div>
        </div>
      )}
    </>
  );
};
