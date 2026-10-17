'use client';

import React, { useState } from 'react';
import { Product, Category } from '../../types/pos';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  ArrowUpDown, 
  Edit3, 
  CheckCircle, 
  Trash2,
  Boxes,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

interface ProductManagementProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: any) => void;
  onUpdateProduct: (id: number, updated: any) => void;
  onAdjustStock: (id: number, adjustment: { type: string; quantity: number; notes: string }) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onAdjustStock,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | 'all'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // New Product Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [catId, setCatId] = useState<number>(categories[0]?.id || 1);
  const [unit, setUnit] = useState('glass');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [minAlert, setMinAlert] = useState<number>(5);
  const [desc, setDesc] = useState('');

  // Stock Opname Form State
  const [adjType, setAdjType] = useState<'restock' | 'adjustment' | 'waste_spoilage'>('restock');
  const [adjQty, setAdjQty] = useState<number>(10);
  const [adjNotes, setAdjNotes] = useState('');

  const filtered = products.filter(p => {
    const matchCat = selectedCat === 'all' || p.category_id === selectedCat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    return matchCat && matchSearch;
  });

  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || sellingPrice <= 0) return;

    onAddProduct({
      id: Date.now(),
      category_id: Number(catId),
      name,
      sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
      barcode,
      unit,
      cost_price: Number(costPrice),
      selling_price: Number(sellingPrice),
      track_stock: true,
      current_stock: Number(stock),
      min_stock_alert: Number(minAlert),
      description: desc,
      is_favorite: false,
      is_active: true,
    });

    setShowAddModal(false);
    resetForm();
  };

  const handleSaveStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    onAdjustStock(selectedProduct.id, {
      type: adjType,
      quantity: Number(adjQty),
      notes: adjNotes || `Penyesuaian stok ${adjType}`,
    });

    setShowStockModal(false);
    setSelectedProduct(null);
    setAdjNotes('');
  };

  const resetForm = () => {
    setName('');
    setSku('');
    setBarcode('');
    setCostPrice(0);
    setSellingPrice(0);
    setStock(10);
    setDesc('');
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      
      {/* Top Banner & Quick Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAE3D2] shadow-sm">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#18191B]">Katalog Menu & Pengelolaan Stok</h2>
          <p className="text-xs text-[#717684]">
            Kelola harga pokok (HPP), harga jual bar, stok minuman, dan opname bahan baku.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 touch-btn shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu / Barang Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-[#EAE3D2] shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A3]" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama menu, SKU, atau barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="text-xs font-bold py-2 px-3 border border-[#E8DECA] rounded-xl bg-white text-[#18191B] outline-none"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3D2] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F3] text-[#717684] uppercase font-bold text-[10px] tracking-wider border-b border-[#EAE3D2]">
              <tr>
                <th className="p-3">Nama Menu & SKU</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Harga Pokok (HPP)</th>
                <th className="p-3">Harga Jual</th>
                <th className="p-3">Margin Laba</th>
                <th className="p-3 text-center">Stok Fisik</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F2EA]">
              {filtered.map(product => {
                const margin = product.selling_price > 0 
                  ? Math.round(((product.selling_price - product.cost_price) / product.selling_price) * 100) 
                  : 0;

                return (
                  <tr key={product.id} className="hover:bg-[#FCFBF8] transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#FAF6EE] border border-[#E8DECA] flex items-center justify-center font-bold text-xs text-[#997519] overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            'SB'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[#18191B]">{product.name}</p>
                          <p className="font-mono text-[10px] text-[#717684]">{product.sku}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-[#5E6470] font-medium">
                      {categories.find(c => c.id === product.category_id)?.name || 'General'}
                    </td>

                    <td className="p-3 font-mono text-[#5E6470]">
                      Rp {product.cost_price.toLocaleString('id-ID')}
                    </td>

                    <td className="p-3 font-mono font-bold text-[#997519]">
                      Rp {product.selling_price.toLocaleString('id-ID')}
                    </td>

                    <td className="p-3">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        +{margin}%
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        product.current_stock <= product.min_stock_alert
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-[#FAF6EE] text-[#8C6D23] border border-[#E8DECA]'
                      }`}>
                        {product.current_stock} {product.unit}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => { setSelectedProduct(product); setShowStockModal(true); }}
                        className="px-2.5 py-1 bg-[#FAF3E0] hover:bg-[#D4AF37] text-[#997519] hover:text-white rounded-lg font-bold text-[11px] transition touch-btn mr-1.5"
                      >
                        Opname / Atur Stok
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Menu Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E8DECA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <h3 className="font-serif font-bold text-lg text-[#18191B]">Tambah Menu / Minuman Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#717684] text-xs">✕</button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="space-y-3 my-4">
              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Nama Menu *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Golden Smoked Old Fashioned"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">Kategori *</label>
                  <select
                    value={catId}
                    onChange={(e) => setCatId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">Satuan</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                  >
                    <option value="glass">Glass (Gelas)</option>
                    <option value="shot">Shot (30ml)</option>
                    <option value="bottle">Bottle (Botol)</option>
                    <option value="pint">Pint (500ml)</option>
                    <option value="portion">Portion (Porsi Makanan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">Harga Pokok (HPP) Rp</label>
                  <input
                    type="number"
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">Harga Jual Kasir Rp *</label>
                  <input
                    type="number"
                    required
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none font-bold text-[#997519]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">Stok Awal</label>
                  <input
                    type="number"
                    value={stock || ''}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">Peringatan Minimal Stok</label>
                  <input
                    type="number"
                    value={minAlert || ''}
                    onChange={(e) => setMinAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Deskripsi / Komposisi</label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                  placeholder="Bahan racikan, aroma, dll..."
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
                  Simpan Produk Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Penyesuaian Stok / Stock Opname */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DECA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <div>
                <h3 className="font-bold text-base text-[#18191B]">Penyesuaian Stok & Opname</h3>
                <p className="text-xs text-[#717684]">{selectedProduct.name} (Stok Saat Ini: {selectedProduct.current_stock})</p>
              </div>
              <button onClick={() => setShowStockModal(false)} className="text-[#717684] text-xs">✕</button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-3 my-4">
              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Jenis Penyesuaian:</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                >
                  <option value="restock">Restock (Barang Masuk / Pembelian)</option>
                  <option value="adjustment">Koreksi Opname (Selisih Fisik)</option>
                  <option value="waste_spoilage">Waste / Spoilage (Rusak / Tumpah / Kadaluarsa)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Jumlah Unit ({selectedProduct.unit}):</label>
                <input
                  type="number"
                  required
                  value={adjQty}
                  onChange={(e) => setAdjQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none font-bold text-[#997519]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Alasan / Catatan Opname:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penerimaan PO #989, botol pecah di bar counter, dll"
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#F0ECE1]">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#717684] rounded-xl border border-[#E8DECA]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] rounded-xl shadow-md touch-btn"
                >
                  Simpan Perubahan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
