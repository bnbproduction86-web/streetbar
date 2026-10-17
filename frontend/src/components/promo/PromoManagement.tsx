'use client';

import React, { useState } from 'react';
import { Promotion } from '../../types/pos';
import { Tag, Plus, Clock, Percent, DollarSign, Gift, Check, Trash2 } from 'lucide-react';

interface PromoManagementProps {
  promotions: Promotion[];
  onAddPromotion: (promo: Promotion) => void;
  onTogglePromotion: (id: number) => void;
}

export const PromoManagement: React.FC<PromoManagementProps> = ({
  promotions,
  onAddPromotion,
  onTogglePromotion,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed_amount' | 'happy_hour'>('happy_hour');
  const [value, setValue] = useState<number>(25);
  const [minOrder, setMinOrder] = useState<number>(100000);
  const [maxDisc, setMaxDisc] = useState<number>(200000);
  const [startTime, setStartTime] = useState<string>('17:00');
  const [endTime, setEndTime] = useState<string>('20:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    onAddPromotion({
      id: Date.now(),
      name,
      code: code.toUpperCase(),
      type,
      discount_value: Number(value),
      min_order_amount: Number(minOrder),
      max_discount_amount: Number(maxDisc),
      start_time: type === 'happy_hour' ? startTime : undefined,
      end_time: type === 'happy_hour' ? endTime : undefined,
      days_active: 'Mon,Tue,Wed,Thu,Fri',
      is_active: true,
    });

    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setCode('');
    setValue(20);
    setMinOrder(100000);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#18191B]">Pengelolaan Promo & Happy Hour</h2>
          <p className="text-xs text-[#717684]">
            Atur diskon persentase, voucher nominal rupiah, dan jam Happy Hour khusus bar.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 touch-btn shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Promo Baru</span>
        </button>
      </div>

      {/* Promo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {promotions.map(promo => (
          <div
            key={promo.id}
            className={`p-4 rounded-2xl border transition-all bg-white flex flex-col justify-between ${
              promo.is_active ? 'border-[#EAE3D2] shadow-sm hover:border-[#D4AF37]' : 'border-gray-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-[#FAF3E0] text-[#997519] border border-[#E8DECA]">
                  {promo.code}
                </span>

                <button
                  onClick={() => onTogglePromotion(promo.id)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    promo.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {promo.is_active ? 'AKTIF' : 'NONAKTIF'}
                </button>
              </div>

              <h4 className="font-bold text-sm text-[#18191B]">{promo.name}</h4>

              <div className="mt-3 space-y-1 text-xs text-[#5E6470]">
                <p className="flex items-center gap-1.5">
                  <span className="font-bold text-[#18191B]">
                    {promo.type === 'percentage' || promo.type === 'happy_hour' 
                      ? `Diskon ${promo.discount_value}%` 
                      : `Potongan Rp ${promo.discount_value.toLocaleString('id-ID')}`}
                  </span>
                </p>
                <p>Minimal Order: Rp {promo.min_order_amount.toLocaleString('id-ID')}</p>
                {promo.type === 'happy_hour' && promo.start_time && (
                  <p className="flex items-center gap-1 text-amber-700 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Jam Aktif: {promo.start_time} - {promo.end_time} ({promo.days_active})
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#F5F2EA] flex justify-end">
              <button
                onClick={() => onTogglePromotion(promo.id)}
                className="text-xs font-bold text-[#997519] hover:underline"
              >
                {promo.is_active ? 'Nonaktifkan Promo' : 'Aktifkan Kembali'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Tambah Promo */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DECA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <h3 className="font-bold text-base text-[#18191B]">Tambah Promo / Happy Hour</h3>
              <button onClick={() => setShowAddModal(false)} className="text-xs text-[#717684]">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 my-4">
              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Nama Promo *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Happy Hour Cocktails 25% Off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">Kode Voucher *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: HAPPYHOUR"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-[#E8DECA] rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">Tipe Promo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                  >
                    <option value="happy_hour">Happy Hour (Otomatis Jam)</option>
                    <option value="percentage">Diskon Persentase (%)</option>
                    <option value="fixed_amount">Potongan Nominal (Rp)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">
                    {type === 'fixed_amount' ? 'Potongan (Rp) *' : 'Diskon (%) *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={value || ''}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold text-[#997519] border border-[#E8DECA] rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">Min. Pembelian Rp</label>
                  <input
                    type="number"
                    value={minOrder || ''}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                  />
                </div>
              </div>

              {type === 'happy_hour' && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-[#FAF8F3] rounded-xl border border-[#EAE3D2]">
                  <div>
                    <label className="text-[10px] font-bold text-[#717684] block mb-1">Jam Mulai</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-[#E8DECA] rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#717684] block mb-1">Jam Selesai</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-[#E8DECA] rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

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
                  Simpan Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
