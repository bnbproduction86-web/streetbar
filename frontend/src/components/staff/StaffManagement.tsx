'use client';

import React, { useState } from 'react';
import { UserStaff } from '../../types/pos';
import { Users, Plus, KeyRound, ShieldCheck, UserCheck, ShieldAlert, Edit2 } from 'lucide-react';

interface StaffManagementProps {
  staffList: UserStaff[];
  onAddStaff: (staff: any) => void;
  onUpdateStaff: (id: number, staff: any) => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  staffList,
  onAddStaff,
  onUpdateStaff,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<UserStaff | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'super_admin' | 'manager' | 'cashier' | 'bartender'>('cashier');
  const [pin, setPin] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || pin.length !== 6) return;

    onAddStaff({
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@streetbar.id`,
      phone,
      role,
      pin_code: pin,
      is_active: true,
    });

    setShowAddModal(false);
    resetForm();
  };

  const handleUpdatePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || pin.length !== 6) return;

    onUpdateStaff(selectedStaff.id, {
      ...selectedStaff,
      pin_code: pin,
      role,
    });

    setSelectedStaff(null);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setRole('cashier');
    setPin('');
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#18191B]">Kelola Kasir, Bartender & Otorisasi PIN</h2>
          <p className="text-xs text-[#717684]">
            Daftarkan staf kasir baru, tetapkan role, dan atur 6-digit PIN akses cepat touchscreen.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 touch-btn shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kasir / Staf Baru</span>
        </button>
      </div>

      {/* Staff Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {staffList.map(staff => (
          <div
            key={staff.id}
            className={`p-4 rounded-2xl border transition-all bg-white flex flex-col justify-between ${
              staff.is_active ? 'border-[#EAE3D2] shadow-sm hover:border-[#D4AF37]' : 'border-gray-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {staff.name.charAt(0)}
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  staff.role === 'super_admin' 
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : staff.role === 'manager'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : staff.role === 'cashier'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {staff.role.replace('_', ' ')}
                </span>
              </div>

              <h4 className="font-bold text-sm text-[#18191B]">{staff.name}</h4>
              <p className="text-xs text-[#717684] truncate">{staff.email}</p>

              <div className="mt-3 p-2 bg-[#FAF8F3] rounded-xl border border-[#F0ECE1] flex items-center justify-between text-xs">
                <span className="text-[#717684] flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#997519]" />
                  PIN Kasir:
                </span>
                <span className="font-mono font-bold text-[#18191B] tracking-widest">
                  {staff.pin_code}
                </span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#F5F2EA] flex items-center justify-between">
              <span className={`text-[10px] font-bold ${staff.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                {staff.is_active ? '● Aktif' : '○ Nonaktif'}
              </span>

              <button
                onClick={() => { setSelectedStaff(staff); setPin(staff.pin_code); setRole(staff.role); }}
                className="text-xs font-bold text-[#997519] hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah PIN</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Tambah Staf Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DECA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <h3 className="font-bold text-base text-[#18191B]">Tambah Kasir / Karyawan Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-xs text-[#717684]">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 my-4">
              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rendi Pratama"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">Role Jabatan *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none font-bold"
                  >
                    <option value="cashier">Kasir (Cashier)</option>
                    <option value="bartender">Bartender / Barista</option>
                    <option value="manager">Outlet Manager</option>
                    <option value="super_admin">Super Admin / Owner</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">6-Digit PIN *</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="Contoh: 123456"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold tracking-widest border border-[#E8DECA] rounded-xl outline-none text-[#997519]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Email (Opsional)</label>
                <input
                  type="email"
                  placeholder="rendi@streetbar.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#F0ECE1]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#717684] rounded-xl border border-[#E8DECA]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] rounded-xl shadow-md touch-btn"
                >
                  Daftarkan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ubah PIN Staf */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E8DECA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <h3 className="font-bold text-base text-[#18191B]">Ubah PIN / Role Staf</h3>
              <button onClick={() => setSelectedStaff(null)} className="text-xs text-[#717684]">✕</button>
            </div>

            <form onSubmit={handleUpdatePinSubmit} className="space-y-3 my-4">
              <p className="text-xs text-[#717684]">
                Mengubah otorisasi PIN untuk <b>{selectedStaff.name}</b>
              </p>

              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Role Jabatan:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none font-bold"
                >
                  <option value="cashier">Kasir (Cashier)</option>
                  <option value="bartender">Bartender / Barista</option>
                  <option value="manager">Outlet Manager</option>
                  <option value="super_admin">Super Admin / Owner</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">PIN 6-Digit Baru:</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold tracking-widest border border-[#E8DECA] rounded-xl outline-none text-[#997519]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#F0ECE1]">
                <button
                  type="button"
                  onClick={() => setSelectedStaff(null)}
                  className="px-4 py-2 text-xs font-bold text-[#717684] rounded-xl border border-[#E8DECA]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] rounded-xl shadow-md touch-btn"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
