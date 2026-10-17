'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Product,
  Category,
  PosTable,
  Customer,
  Promotion,
  CartItem,
  UserStaff,
  WorkShift,
  Order,
  ModifierItem,
  ProductVariant,
  Outlet
} from '../../types/pos';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  Banknote,
  Split,
  Printer,
  PauseCircle,
  CheckCircle2,
  Flame,
  GlassWater,
  Beer,
  Wine,
  Coffee,
  Utensils,
  Sparkles,
  Shield,
  KeyRound,
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Wallet,
  AlertTriangle,
  RotateCcw,
  LogOut
} from 'lucide-react';

interface TouchscreenCashierProps {
  outlet: Outlet;
  products: Product[];
  categories: Category[];
  tables: PosTable[];
  customers: Customer[];
  promotions: Promotion[];
  currentStaff: UserStaff;
  allStaff: UserStaff[];
  activeShift: WorkShift | null;
  dbConnected: boolean;
  onOrderCompleted: (order: Order) => void;
  onOpenShift: (openingCash: number, notes: string) => void;
  onCloseShift: (closingCashActual: number, notes: string) => void;
  onAddCashMovement: (type: 'cash_in' | 'cash_out', amount: number, category: string, notes?: string) => void;
  onSwitchStaff: (staff: UserStaff) => void;
  onLogout?: () => void;
}

export const TouchscreenCashier: React.FC<TouchscreenCashierProps> = ({
  outlet,
  products,
  categories,
  tables,
  customers,
  promotions,
  currentStaff,
  allStaff,
  activeShift,
  dbConnected,
  onOrderCompleted,
  onOpenShift,
  onCloseShift,
  onAddCashMovement,
  onSwitchStaff,
  onLogout,
}) => {
  const router = useRouter();

  // Navigation & Filtering
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'bar_tab'>('dine_in');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedPromoCode, setSelectedPromoCode] = useState<string>('');

  // Modals
  const [selectedProductForModifier, setSelectedProductForModifier] = useState<Product | null>(null);
  const [activeVariant, setActiveVariant] = useState<ProductVariant | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<ModifierItem[]>([]);
  const [itemNote, setItemNote] = useState<string>('');

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'debit_card' | 'credit_card' | 'bank_transfer' | 'split'>('cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [paymentRefNumber, setPaymentRefNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Split Bill State
  const [splitCount, setSplitCount] = useState<number>(2);

  // Thermal Receipt Modal
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [receiptPaperSize, setReceiptPaperSize] = useState<'80mm' | '58mm'>('80mm');

  // Held Bills / Open Tabs State
  const [heldBills, setHeldBills] = useState<{ id: string; time: string; table: string; cart: CartItem[]; orderType: any }[]>([]);
  const [showHeldBillsModal, setShowHeldBillsModal] = useState<boolean>(false);

  // Cashier Drawer / Petty Cash Modals
  const [showShiftModal, setShowShiftModal] = useState<boolean>(false);
  const [showCashMovementModal, setShowCashMovementModal] = useState<boolean>(false);
  const [movementType, setMovementType] = useState<'cash_in' | 'cash_out'>('cash_out');
  const [movementAmount, setMovementAmount] = useState<number>(50000);
  const [movementCategory, setMovementCategory] = useState<string>('Pembelian Es Batu Tube');
  const [movementNote, setMovementNote] = useState<string>('');

  const [openingCashInput, setOpeningCashInput] = useState<number>(500000);
  const [closingActualCash, setClosingActualCash] = useState<number>(0);

  // Admin Portal Gate PIN Modal
  const [showAdminPinModal, setShowAdminPinModal] = useState<boolean>(false);
  const [enteredAdminPin, setEnteredAdminPin] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string>('');

  // Logout Confirmation Modal
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchSearch = searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      return matchCat && matchSearch && p.is_active;
    });
  }, [products, selectedCategory, searchQuery]);

  // =========================================================================
  // ROBUST MATHEMATICAL OPERATIONS (AUDITED & GUARANTEED EXACT INTEGER RUPIAH)
  // =========================================================================

  // 1. Subtotal
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Math.round(Number(item.subtotal)) || 0), 0);
  }, [cart]);

  // 2. Discount / Promo Amount
  const discountAmount = useMemo(() => {
    if (!selectedPromoCode) return 0;
    const promo = promotions.find(p => p.code === selectedPromoCode && p.is_active);
    if (!promo) return 0;

    const minOrder = Number(promo.min_order_amount) || 0;
    if (subtotal < minOrder) return 0;

    const discVal = Number(promo.discount_value) || 0;
    const maxDisc = promo.max_discount_amount ? Number(promo.max_discount_amount) : Infinity;

    let calculatedDiscount = 0;
    if (promo.type === 'percentage' || promo.type === 'happy_hour') {
      calculatedDiscount = Math.round((subtotal * discVal) / 100);
      calculatedDiscount = Math.min(calculatedDiscount, maxDisc);
    } else if (promo.type === 'fixed_amount') {
      calculatedDiscount = discVal;
    }

    return Math.min(calculatedDiscount, subtotal);
  }, [subtotal, selectedPromoCode, promotions]);

  // 3. Subtotal Setelah Diskon (Net Subtotal)
  const netSubtotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // 4. Service Charge (5% default)
  const serviceCharge = useMemo(() => {
    const rate = Number(outlet.service_percentage) || 5;
    return Math.round((netSubtotal * rate) / 100);
  }, [netSubtotal, outlet.service_percentage]);

  // 5. Pajak Restoran PB1 (10% default atas Net Subtotal + Service Charge)
  const taxAmount = useMemo(() => {
    const rate = Number(outlet.tax_percentage) || 10;
    const taxBase = netSubtotal + serviceCharge;
    return Math.round((taxBase * rate) / 100);
  }, [netSubtotal, serviceCharge, outlet.tax_percentage]);

  // 6. Grand Total Akhir
  const grandTotal = useMemo(() => {
    return netSubtotal + serviceCharge + taxAmount;
  }, [netSubtotal, serviceCharge, taxAmount]);

  // 7. Kembalian & Uang Kurang
  const changeAmount = useMemo(() => {
    return cashTendered >= grandTotal ? (cashTendered - grandTotal) : 0;
  }, [cashTendered, grandTotal]);

  const shortfallAmount = useMemo(() => {
    return cashTendered < grandTotal ? (grandTotal - cashTendered) : 0;
  }, [cashTendered, grandTotal]);

  // 8. Smart Cash Denomination Suggestions
  const smartDenominations = useMemo(() => {
    const suggestions = [grandTotal]; // Uang Pas

    // Round to next 10.000
    const next10k = Math.ceil(grandTotal / 10000) * 10000;
    if (next10k > grandTotal && !suggestions.includes(next10k)) suggestions.push(next10k);

    // Round to next 50.000
    const next50k = Math.ceil(grandTotal / 50000) * 50000;
    if (next50k > grandTotal && !suggestions.includes(next50k)) suggestions.push(next50k);

    // Round to next 100.000
    const next100k = Math.ceil(grandTotal / 100000) * 100000;
    if (next100k > grandTotal && !suggestions.includes(next100k)) suggestions.push(next100k);

    if (grandTotal < 500000 && !suggestions.includes(500000)) suggestions.push(500000);

    return suggestions.slice(0, 5);
  }, [grandTotal]);

  // 9. Split Bill Breakdown
  const splitBillShares = useMemo(() => {
    if (splitCount <= 1) return [{ person: 1, amount: grandTotal }];
    const baseShare = Math.floor(grandTotal / splitCount);
    const remainder = grandTotal - (baseShare * splitCount);

    const shares = [];
    for (let i = 1; i <= splitCount; i++) {
      // First person covers the 1-Rupiah rounding remainder
      shares.push({
        person: i,
        amount: i === 1 ? baseShare + remainder : baseShare
      });
    }
    return shares;
  }, [grandTotal, splitCount]);

  // Add Item to Cart
  const handleItemClick = (product: Product) => {
    if ((product.variants && product.variants.length > 0) || (product.modifier_groups && product.modifier_groups.length > 0)) {
      setSelectedProductForModifier(product);
      setActiveVariant(product.variants && product.variants.length > 0 ? product.variants[0] : null);
      setSelectedModifiers([]);
      setItemNote('');
    } else {
      addToCartDirect(product, null, []);
    }
  };

  const addToCartDirect = (product: Product, variant: ProductVariant | null, modifiers: ModifierItem[], note?: string) => {
    const basePrice = Number(product.selling_price) || 0;
    const variantAdd = variant ? (Number(variant.additional_price) || 0) : 0;
    const modifierAdd = (modifiers || []).reduce((sum, m) => sum + (Number(m.price) || 0), 0);
    const unitPrice = Math.round(basePrice + variantAdd + modifierAdd);

    const cartKey = `${product.id}-${variant?.id || 'base'}-${(modifiers || []).map(m => m.id).sort().join(',')}-${note || ''}`;

    setCart(prev => {
      const existing = prev.find(item => item.id === cartKey);
      if (existing) {
        return prev.map(item => item.id === cartKey ? {
          ...item,
          quantity: item.quantity + 1,
          subtotal: Math.round((item.quantity + 1) * item.unitPrice)
        } : item);
      } else {
        return [...prev, {
          id: cartKey,
          product,
          variant: variant || undefined,
          selectedModifiers: modifiers,
          quantity: 1,
          unitPrice,
          subtotal: unitPrice,
          notes: note,
        }];
      }
    });
  };

  const confirmModifierSelection = () => {
    if (!selectedProductForModifier) return;
    addToCartDirect(selectedProductForModifier, activeVariant, selectedModifiers, itemNote);
    setSelectedProductForModifier(null);
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === cartKey) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            subtotal: Math.round(newQty * item.unitPrice)
          };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
    setSelectedPromoCode('');
  };

  // Hold Bill
  const handleHoldBill = () => {
    if (cart.length === 0) return;
    const tableObj = tables.find(t => t.id === selectedTableId);
    const newHeld = {
      id: `TAB-${Date.now().toString().slice(-4)}`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      table: tableObj?.table_number || 'Takeaway',
      cart: [...cart],
      orderType,
    };
    setHeldBills(prev => [newHeld, ...prev]);
    clearCart();
    alert(`Pesanan ${newHeld.table} (#${newHeld.id}) disimpan ke Open Tab!`);
  };

  const resumeHeldBill = (held: any) => {
    setCart(held.cart);
    setOrderType(held.orderType);
    setHeldBills(prev => prev.filter(b => b.id !== held.id));
    setShowHeldBillsModal(false);
  };

  // Open Payment Modal
  const openPayment = () => {
    if (cart.length === 0) return;
    setCashTendered(grandTotal);
    setShowPaymentModal(true);
  };

  // Checkout process
  const processCheckout = () => {
    if (paymentMethod === 'cash' && cashTendered < grandTotal) {
      alert(`Uang tunai kurang Rp ${(grandTotal - cashTendered).toLocaleString('id-ID')}`);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const invoiceNumber = `SBP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const tableObj = tables.find(t => t.id === selectedTableId);
      const customerObj = customers.find(c => c.id === selectedCustomerId);

      const orderData: Order = {
        id: Date.now(),
        invoice_number: invoiceNumber,
        outlet_id: outlet.id,
        cashier_id: currentStaff.id,
        cashier_name: currentStaff.name,
        shift_id: activeShift?.id || 1,
        table_id: selectedTableId || undefined,
        table: tableObj,
        customer_id: selectedCustomerId || undefined,
        customer: customerObj,
        order_type: orderType,
        status: 'completed',
        subtotal,
        discount_amount: discountAmount,
        promotion_name: selectedPromoCode || undefined,
        tax_amount: taxAmount,
        service_charge: serviceCharge,
        grand_total: grandTotal,
        total_cost_price: cart.reduce((sum, item) => sum + (Number(item.product.cost_price || 0) * item.quantity), 0),
        paid_amount: paymentMethod === 'cash' ? cashTendered : grandTotal,
        change_amount: paymentMethod === 'cash' ? changeAmount : 0,
        payment_method: paymentMethod,
        payment_reference: paymentRefNumber || undefined,
        items: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          variant_name: item.variant?.name,
          unit_price: item.unitPrice,
          quantity: item.quantity,
          subtotal_price: item.subtotal,
          notes: item.notes,
          modifiers: (item.selectedModifiers || []).map(m => ({
            modifier_name: m.name,
            additional_price: Number(m.price) || 0
          }))
        })),
        created_at: new Date().toISOString(),
      };

      onOrderCompleted(orderData);
      setCompletedOrder(orderData);
      setIsProcessing(false);
      setShowPaymentModal(false);
      clearCart();
    }, 300);
  };

  const triggerPrintReceipt = () => {
    window.print();
  };

  // Admin Portal Access Check
  const handleVerifyAdminPin = () => {
    const adminMatch = allStaff.find(
      s => s.pin_code === enteredAdminPin && (s.role === 'super_admin' || s.role === 'manager')
    );

    if (adminMatch) {
      setShowAdminPinModal(false);
      setEnteredAdminPin('');
      setAdminPinError('');
      router.push('/admin');
    } else {
      setAdminPinError('Akses ditolak! PIN bukan milik Super Admin atau Manager.');
      setEnteredAdminPin('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] overflow-hidden select-none">

      {/* ========================================================================= */}
      {/* 1. DEDICATED TOUCHSCREEN CASHIER HEADER (NO ADMIN TABS)                   */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-[#EAE3D2] px-4 py-2.5 shadow-xs flex items-center justify-between shrink-0">

        {/* Brand & Outlet Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#997519] flex items-center justify-center text-white font-serif font-black text-xl shadow-md border border-[#F4E4BA]">
            SB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-base tracking-tight text-[#18191B]">STREET BAR POS</h1>
              <span className="bg-[#FAF3E0] text-[#997519] text-[9px] font-black px-2 py-0.5 rounded-full border border-[#E8DECA] uppercase">
                TOUCHSCREEN CASHIER
              </span>
            </div>
            <p className="text-[11px] text-[#717684] flex items-center gap-1.5 font-medium">
              <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              {dbConnected ? 'Database Connected' : 'POS Standalone'} • {outlet.name}
            </p>
          </div>
        </div>

        {/* Center: Shift & Drawer Quick Actions */}
        <div className="flex items-center gap-2 bg-[#FAF8F3] px-3 py-1.5 rounded-xl border border-[#E8DECA]">
          <div className="flex items-center gap-1.5 text-xs">
            <Wallet className="w-4 h-4 text-[#C5A059]" />
            <span className="font-bold text-[#18191B]">
              {activeShift ? activeShift.shift_number : 'Laci Tutup'}
            </span>
          </div>

          <div className="h-4 w-px bg-[#EAE3D2] mx-1"></div>

          {activeShift ? (
            <>
              <button
                onClick={() => { setMovementType('cash_in'); setShowCashMovementModal(true); }}
                className="px-2 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 touch-btn"
              >
                + Kas Masuk
              </button>
              <button
                onClick={() => { setMovementType('cash_out'); setShowCashMovementModal(true); }}
                className="px-2 py-1 bg-rose-50 text-rose-800 text-[10px] font-bold rounded-lg border border-rose-200 hover:bg-rose-100 touch-btn"
              >
                - Petty Cash
              </button>
              <button
                onClick={() => setShowShiftModal(true)}
                className="px-2.5 py-1 bg-[#FAF3E0] text-[#997519] text-[10px] font-bold rounded-lg border border-[#E8DECA] hover:bg-[#D4AF37] hover:text-white touch-btn"
              >
                Tutup Shift
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowShiftModal(true)}
              className="px-3 py-1 bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white text-[10px] font-bold rounded-lg shadow-xs touch-btn"
            >
              Buka Shift Kasir
            </button>
          )}
        </div>

        {/* Right: Cashier Identity & Secure Admin Portal Button */}
        <div className="flex items-center gap-2.5">

          {/* Active Cashier Identity */}
          <div className="flex items-center gap-2 bg-[#FAF6EE] px-3 py-1.5 rounded-xl border border-[#E8DECA]">
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37] text-white flex items-center justify-center font-bold text-xs">
              {currentStaff.name.charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-[#18191B] leading-tight">{currentStaff.name.split(' ')[0]}</p>
              <p className="text-[10px] text-[#997519] font-medium capitalize">{currentStaff.role}</p>
            </div>
          </div>

          {/* Secure Admin Portal Button (Requires Admin PIN) */}
          <button
            onClick={() => {
              if (currentStaff.role === 'super_admin' || currentStaff.role === 'manager') {
                router.push('/admin');
              } else {
                setShowAdminPinModal(true);
              }
            }}
            title="Masuk ke Dashboard Admin (Perlu Otorisasi Admin)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF6EE] border border-[#E8DECA] text-[#717684] hover:text-[#18191B] text-xs font-bold touch-btn shadow-2xs"
          >
            <Shield className="w-4 h-4 text-[#C5A059]" />
            <span>Admin Portal</span>
            <Lock className="w-3 h-3 text-[#997519]" />
          </button>

          {/* Log Out Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            title="Keluar dari akun kasir (Log Out)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 border border-[#EAE3D2] hover:border-rose-300 text-[#717684] hover:text-rose-700 text-xs font-bold touch-btn shadow-2xs transition"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CASHIER TOUCHSCREEN WORKSPACE (GRID + ORDER PANEL)                 */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT WORKSPACE: CATEGORIES & PRODUCT GRID */}
        <div className="flex-1 flex flex-col p-3 overflow-hidden">

          {/* Top Search & Open Tab Bar */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A3]" />
              <input
                type="text"
                placeholder="Cari Menu, Minuman, Barcode, atau SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E8DECA] bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8F95A3]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Held Bills / Open Tabs Button */}
            <button
              onClick={() => setShowHeldBillsModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E8DECA] bg-white hover:bg-[#FAF6EE] text-xs font-bold text-[#8C6D23] touch-btn shadow-2xs relative"
            >
              <PauseCircle className="w-4 h-4 text-[#C5A059]" />
              <span>Open Tab ({heldBills.length})</span>
            </button>
          </div>

          {/* Category Horizontal Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none shrink-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-btn flex items-center gap-1.5 ${selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-md'
                  : 'bg-white border border-[#E8DECA] text-[#5E6470] hover:bg-[#FAF6EE]'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Semua Menu ({products.length})</span>
            </button>

            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-btn flex items-center gap-1.5 ${selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-md'
                    : 'bg-white border border-[#E8DECA] text-[#5E6470] hover:bg-[#FAF6EE]'
                  }`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map(product => {
                const hasVariants = product.variants && product.variants.length > 0;
                const hasModifiers = product.modifier_groups && product.modifier_groups.length > 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleItemClick(product)}
                    className="bg-white rounded-2xl border border-[#EAE3D2] p-2.5 hover:border-[#D4AF37] hover:shadow-lg transition-all cursor-pointer touch-btn flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono text-[#8F95A3] truncate max-w-[80px]">
                        {product.sku}
                      </span>
                      {product.track_stock && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${product.current_stock <= product.min_stock_alert
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-[#FAF6EE] text-[#8C6D23] border border-[#E8DECA]'
                          }`}>
                          Stok: {product.current_stock}
                        </span>
                      )}
                    </div>

                    <div className="w-full h-24 rounded-xl bg-gradient-to-b from-[#FDFCF9] to-[#F5F2EA] flex items-center justify-center relative overflow-hidden mb-2 border border-[#F0ECE1]">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Wine className="w-10 h-10 text-[#C5A059]/60" />
                      )}
                      {product.is_favorite && (
                        <span className="absolute top-1 right-1 bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                          ★ TOP
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-[#18191B] leading-tight line-clamp-1 group-hover:text-[#997519] transition">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-[#717684] line-clamp-1 mt-0.5 font-normal">
                        {product.description || 'Signature Bar Item'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F5F2EA]">
                      <div>
                        <span className="text-xs font-black text-[#997519]">
                          Rp {Math.round(product.selling_price).toLocaleString('id-ID')}
                        </span>
                        {(hasVariants || hasModifiers) && (
                          <span className="block text-[9px] text-[#8F95A3]">Customizable</span>
                        )}
                      </div>
                      <button className="w-7 h-7 rounded-lg bg-[#FAF3E0] group-hover:bg-[#D4AF37] text-[#997519] group-hover:text-white flex items-center justify-center transition shadow-xs font-bold">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT WORKSPACE: ORDER CART & CALCULATOR */}
        <div className="w-[390px] lg:w-[430px] bg-white border-l border-[#EAE3D2] flex flex-col h-full shadow-lg z-10">

          {/* Order Header / Table Selection */}
          <div className="p-3 border-b border-[#F0ECE1] bg-[#FCFBF8] space-y-2">

            {/* Order Type Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-[#F5F2EA] p-1 rounded-xl border border-[#E8DECA]">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`py-1.5 text-xs font-bold rounded-lg transition touch-btn ${orderType === 'dine_in'
                    ? 'bg-white text-[#997519] shadow-xs'
                    : 'text-[#717684]'
                  }`}
              >
                🍽️ Dine In
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`py-1.5 text-xs font-bold rounded-lg transition touch-btn ${orderType === 'takeaway'
                    ? 'bg-white text-[#997519] shadow-xs'
                    : 'text-[#717684]'
                  }`}
              >
                🛍️ Takeaway
              </button>
              <button
                onClick={() => setOrderType('bar_tab')}
                className={`py-1.5 text-xs font-bold rounded-lg transition touch-btn ${orderType === 'bar_tab'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white shadow-xs'
                    : 'text-[#717684]'
                  }`}
              >
                🍸 Bar Tab
              </button>
            </div>

            {/* Table & Member Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-[#717684] uppercase tracking-wider block mb-1">
                  Pilih Meja / Bar:
                </label>
                <select
                  value={selectedTableId || ''}
                  onChange={(e) => setSelectedTableId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full text-xs font-bold py-1.5 px-2 rounded-xl border border-[#E8DECA] bg-white text-[#18191B]"
                >
                  <option value="">-- Tanpa Meja --</option>
                  {tables.map(tbl => (
                    <option key={tbl.id} value={tbl.id}>
                      {tbl.table_number} ({tbl.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#717684] uppercase tracking-wider block mb-1">
                  Member / VIP:
                </label>
                <select
                  value={selectedCustomerId || ''}
                  onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full text-xs font-bold py-1.5 px-2 rounded-xl border border-[#E8DECA] bg-white text-[#18191B]"
                >
                  <option value="">Guest (Tamu)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.tier.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8F95A3]">
                <div className="w-14 h-14 rounded-full bg-[#FAF6EE] border border-[#E8DECA] flex items-center justify-center text-[#C5A059] mb-2">
                  <Wine className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-[#18191B]">Layar Pesanan Kosong</p>
                <p className="text-xs text-[#717684] max-w-[200px] mt-1">
                  Sentuh menu minuman atau makanan di sebelah kiri untuk menambah ke struk.
                </p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-[#EAE3D2] bg-white hover:border-[#D4AF37] transition flex flex-col gap-1 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[#18191B] leading-snug">
                        {item.product.name}
                      </p>
                      {item.variant && (
                        <span className="text-[10px] text-[#997519] font-semibold block">
                          Ukuran: {item.variant.name}
                        </span>
                      )}
                      {item.selectedModifiers.length > 0 && (
                        <span className="text-[10px] text-[#717684] block">
                          + {item.selectedModifiers.map(m => m.name).join(', ')}
                        </span>
                      )}
                      {item.notes && (
                        <span className="text-[10px] text-amber-700 italic block">
                          Note: "{item.notes}"
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-black text-[#18191B]">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#F8F5EE]">
                    <span className="text-[10px] text-[#717684]">
                      @ Rp {item.unitPrice.toLocaleString('id-ID')}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-lg border border-[#E8DECA] bg-[#FAF6EE] flex items-center justify-center text-xs font-bold text-[#8C6D23] touch-btn"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-[#18191B]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-lg border border-[#E8DECA] bg-[#FAF6EE] flex items-center justify-center text-xs font-bold text-[#8C6D23] touch-btn"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Calculation Summary (AUDITED EXACT FORMULAS) */}
          <div className="p-3 border-t border-[#F0ECE1] bg-[#FCFBF8] space-y-2">

            {/* Promo Selector */}
            <div className="flex items-center gap-2">
              <select
                value={selectedPromoCode}
                onChange={(e) => setSelectedPromoCode(e.target.value)}
                className="flex-1 text-xs font-bold py-2 px-2.5 rounded-xl border border-[#E8DECA] bg-white text-[#18191B]"
              >
                <option value="">🎟️ Pilih Promo / Diskon Happy Hour</option>
                {promotions.filter(p => p.is_active).map(promo => (
                  <option key={promo.id} value={promo.code}>
                    {promo.name} ({promo.code})
                  </option>
                ))}
              </select>
              {selectedPromoCode && (
                <button
                  onClick={() => setSelectedPromoCode('')}
                  className="text-[10px] text-rose-600 font-bold px-1.5"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-xs pt-1">
              <div className="flex justify-between text-[#717684]">
                <span>Subtotal Pesanan:</span>
                <span className="font-mono text-[#18191B]">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-[#997519] font-bold bg-[#FAF3E0] px-2 py-1 rounded-lg">
                  <span>Diskon ({selectedPromoCode}):</span>
                  <span className="font-mono">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="flex justify-between text-[#717684]">
                <span>Service Charge ({outlet.service_percentage}%):</span>
                <span className="font-mono text-[#18191B]">Rp {serviceCharge.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between text-[#717684]">
                <span>Pajak Restoran (PB1 {outlet.tax_percentage}%):</span>
                <span className="font-mono text-[#18191B]">Rp {taxAmount.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-[#EAE3D2]">
                <span className="text-sm font-bold text-[#18191B]">TOTAL TAGIHAN:</span>
                <span className="text-2xl font-black text-[#997519] font-mono">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-2">
              <button
                disabled={cart.length === 0}
                onClick={handleHoldBill}
                className="py-3 rounded-xl border border-[#E8DECA] bg-white hover:bg-[#FAF6EE] text-[#8C6D23] font-bold text-xs flex flex-col items-center justify-center touch-btn disabled:opacity-40"
              >
                <PauseCircle className="w-4 h-4 mb-0.5" />
                <span>Hold</span>
              </button>

              <button
                disabled={cart.length === 0}
                onClick={clearCart}
                className="py-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex flex-col items-center justify-center touch-btn disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4 mb-0.5" />
                <span>Batal</span>
              </button>

              <button
                disabled={cart.length === 0}
                onClick={openPayment}
                className="col-span-2 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] hover:from-[#B38F2C] hover:to-[#8C6D23] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/30 touch-btn disabled:opacity-40"
              >
                <CreditCard className="w-4 h-4" />
                <span>BAYAR (Rp {grandTotal.toLocaleString('id-ID')})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VARIANT & MODIFIER SELECTOR                                      */}
      {/* ========================================================================= */}
      {selectedProductForModifier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E8DECA] flex flex-col max-h-[90vh]">

            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#18191B]">{selectedProductForModifier.name}</h3>
                <p className="text-xs text-[#717684]">Pilih variasi ukuran & preferensi racikan bar</p>
              </div>
              <button
                onClick={() => setSelectedProductForModifier(null)}
                className="w-8 h-8 rounded-full bg-[#F5F2EA] flex items-center justify-center text-xs font-bold text-[#717684]"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">

              {/* Variants Section */}
              {selectedProductForModifier.variants && selectedProductForModifier.variants.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-[#18191B] uppercase tracking-wider block mb-2">
                    Ukuran / Porsi:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProductForModifier.variants.map(variant => (
                      <button
                        key={variant.id}
                        onClick={() => setActiveVariant(variant)}
                        className={`p-3 rounded-xl border text-left touch-btn transition ${activeVariant?.id === variant.id
                            ? 'border-[#D4AF37] bg-[#FAF3E0] ring-2 ring-[#D4AF37]/30 font-bold'
                            : 'border-[#EAE3D2] bg-white text-[#5E6470]'
                          }`}
                      >
                        <p className="text-xs">{variant.name}</p>
                        <p className="text-xs text-[#997519] font-black mt-1">
                          + Rp {Math.round(Number(variant.additional_price) || 0).toLocaleString('id-ID')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Modifier Groups Section */}
              {selectedProductForModifier.modifier_groups && selectedProductForModifier.modifier_groups.map(group => (
                <div key={group.id}>
                  <label className="text-xs font-bold text-[#18191B] uppercase tracking-wider block mb-2">
                    {group.name}:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map(item => {
                      const isSelected = selectedModifiers.some(m => m.id === item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (group.selection_type === 'single') {
                              setSelectedModifiers(prev => [
                                ...prev.filter(m => m.group_id !== group.id),
                                item
                              ]);
                            } else {
                              if (isSelected) {
                                setSelectedModifiers(prev => prev.filter(m => m.id !== item.id));
                              } else {
                                setSelectedModifiers(prev => [...prev, item]);
                              }
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left touch-btn transition ${isSelected
                              ? 'border-[#D4AF37] bg-[#FAF3E0] font-bold text-[#18191B]'
                              : 'border-[#EAE3D2] bg-white text-[#5E6470]'
                            }`}
                        >
                          <p className="text-xs">{item.name}</p>
                          {Number(item.price) > 0 && (
                            <p className="text-[10px] text-[#997519] font-bold mt-0.5">
                              + Rp {Math.round(Number(item.price)).toLocaleString('id-ID')}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Special Bartender Note */}
              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">
                  Catatan Khusus Racikan:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Es batu sedikit, ekstra garnish lemon..."
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DECA] text-xs focus:ring-2 focus:ring-[#D4AF37] outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0ECE1] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#717684] block">Harga per item:</span>
                <span className="text-base font-black text-[#997519]">
                  Rp {(
                    (activeVariant ? (Number(selectedProductForModifier.selling_price) + Number(activeVariant.additional_price)) : Number(selectedProductForModifier.selling_price)) +
                    selectedModifiers.reduce((sum, m) => sum + (Number(m.price) || 0), 0)
                  ).toLocaleString('id-ID')}
                </span>
              </div>

              <button
                onClick={confirmModifierSelection}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white font-bold text-xs touch-btn shadow-md"
              >
                + Masukkan ke Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PAYMENT & QUICK CASH (AUDITED EXACT CALCULATIONS)                 */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#E8DECA]">

            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#FAF3E0] text-[#997519] flex items-center justify-center font-bold">
                  Rp
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#18191B]">Pembayaran Kasir Touchscreen</h3>
                  <p className="text-xs text-[#717684]">Pilih metode bayar & input uang tunai diterima</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-[#F5F2EA] flex items-center justify-center text-xs font-bold text-[#717684]"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">

              {/* Left Column: Method Selector */}
              <div>
                <label className="text-[11px] font-bold text-[#717684] uppercase tracking-wider block mb-2">
                  Metode Pembayaran:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cash', label: 'Tunai (Cash)', icon: Banknote },
                    { id: 'qris', label: 'QRIS Dinamis', icon: QrCode },
                    { id: 'debit_card', label: 'Kartu Debit EDC', icon: CreditCard },
                    { id: 'credit_card', label: 'Kartu Kredit', icon: CreditCard },
                    { id: 'bank_transfer', label: 'Transfer Bank', icon: CreditCard },
                    { id: 'split', label: 'Split Bill', icon: Split },
                  ].map(method => {
                    const IconComponent = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => {
                          setPaymentMethod(method.id as any);
                          if (method.id !== 'cash') {
                            setCashTendered(grandTotal);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left touch-btn transition flex flex-col justify-between h-20 ${paymentMethod === method.id
                            ? 'border-[#D4AF37] bg-[#FAF3E0] ring-2 ring-[#D4AF37]/30 font-bold text-[#18191B]'
                            : 'border-[#EAE3D2] bg-white text-[#5E6470] hover:bg-[#FAF6EE]'
                          }`}
                      >
                        <IconComponent className={`w-5 h-5 ${paymentMethod === method.id ? 'text-[#997519]' : 'text-[#8F95A3]'}`} />
                        <span className="text-xs">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Calculations & Denomination Buttons */}
              <div className="bg-[#FAF8F3] p-4 rounded-2xl border border-[#EAE3D2] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-[#717684] uppercase tracking-wider block">Total Tagihan:</span>
                  <p className="text-2xl font-black text-[#997519] font-mono mb-3">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </p>

                  {paymentMethod === 'cash' ? (
                    <div>
                      <label className="text-xs font-bold text-[#18191B] block mb-1">
                        Uang Tunai Diterima:
                      </label>
                      <input
                        type="number"
                        value={cashTendered || ''}
                        onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E8DECA] bg-white font-mono font-bold text-lg text-[#18191B] focus:ring-2 focus:ring-[#D4AF37] outline-none mb-2"
                        placeholder="0"
                      />

                      {/* Smart Denominations */}
                      <label className="text-[10px] font-bold text-[#717684] block mb-1">Pecahan Cepat:</label>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {smartDenominations.map((denom, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCashTendered(denom)}
                            className="py-1.5 px-2.5 bg-white border border-[#E8DECA] hover:bg-[#FAF3E0] rounded-lg text-xs font-bold text-[#997519] touch-btn"
                          >
                            {denom === grandTotal ? 'Uang Pas' : `Rp ${(denom / 1000).toLocaleString('id-ID')}k`}
                          </button>
                        ))}
                      </div>

                      {/* Kembalian / Status Display */}
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${shortfallAmount > 0
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                        <span className="text-xs font-bold">
                          {shortfallAmount > 0 ? '⚠️ Uang Kurang:' : '✓ Kembalian:'}
                        </span>
                        <span className="text-base font-black font-mono">
                          Rp {(shortfallAmount > 0 ? shortfallAmount : changeAmount).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ) : paymentMethod === 'split' ? (
                    <div>
                      <label className="text-xs font-bold text-[#18191B] block mb-1">Jumlah Orang (Split Patungan):</label>
                      <div className="flex items-center gap-2 mb-3">
                        {[2, 3, 4, 5, 6].map(num => (
                          <button
                            key={num}
                            onClick={() => setSplitCount(num)}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-bold touch-btn ${splitCount === num ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white border-[#E8DECA]'
                              }`}
                          >
                            {num} org
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1 bg-white p-2.5 rounded-xl border border-[#E8DECA] text-xs">
                        {splitBillShares.map(share => (
                          <div key={share.person} className="flex justify-between">
                            <span>Orang #{share.person}:</span>
                            <span className="font-mono font-bold text-[#997519]">
                              Rp {share.amount.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : paymentMethod === 'qris' ? (
                    <div className="text-center py-2">
                      <div className="w-36 h-36 bg-white border border-[#E8DECA] rounded-2xl mx-auto flex items-center justify-center p-2 shadow-inner">
                        <div className="w-full h-full bg-[#18191B] rounded-lg p-2 flex flex-col items-center justify-center text-white">
                          <QrCode className="w-20 h-20 text-white" />
                          <span className="text-[8px] font-bold tracking-widest uppercase">QRIS STREET BAR</span>
                        </div>
                      </div>
                      <p className="text-[11px] font-bold text-[#18191B] mt-2">NMID: ID102026889901</p>
                      <p className="text-[10px] text-[#717684]">Scan via GoPay, BCA, Livin, Dana, OVO, ShopeePay</p>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-[#18191B] block mb-1">
                        Nomor Ref / Approval Code EDC:
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: APP-982341 atau 4 digit kartu"
                        value={paymentRefNumber}
                        onChange={(e) => setPaymentRefNumber(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E8DECA] bg-white font-mono text-xs focus:ring-2 focus:ring-[#D4AF37] outline-none"
                      />
                    </div>
                  )}
                </div>

                <button
                  disabled={isProcessing || (paymentMethod === 'cash' && cashTendered < grandTotal)}
                  onClick={processCheckout}
                  className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] hover:from-[#B38F2C] hover:to-[#8C6D23] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg touch-btn disabled:opacity-40"
                >
                  {isProcessing ? (
                    <span>Memproses Transaksi...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Selesaikan & Cetak Struk</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: THERMAL RECEIPT PREVIEW (58mm & 80mm ESC/POS)                    */}
      {/* ========================================================================= */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DECA] flex flex-col max-h-[92vh]">

            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-[#18191B]">Transaksi Berhasil!</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setReceiptPaperSize('80mm')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold ${receiptPaperSize === '80mm' ? 'bg-[#D4AF37] text-white' : 'bg-[#F5F2EA] text-[#717684]'
                    }`}
                >
                  80mm
                </button>
                <button
                  onClick={() => setReceiptPaperSize('58mm')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold ${receiptPaperSize === '58mm' ? 'bg-[#D4AF37] text-white' : 'bg-[#F5F2EA] text-[#717684]'
                    }`}
                >
                  58mm
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto my-3 p-3 bg-[#FAFAFA] rounded-xl border border-dashed border-[#D8CCA8]">

              <div
                id="printable-receipt-area"
                className={`thermal-receipt mx-auto p-4 bg-white shadow-sm border border-gray-200 text-black text-xs ${receiptPaperSize === '58mm' ? 'max-w-[280px] text-[11px]' : 'max-w-[340px]'
                  }`}
              >
                <div className="text-center pb-2 border-b border-black">
                  <h2 className="font-bold text-base tracking-wider uppercase">{outlet.name}</h2>
                  <p className="text-[10px] whitespace-pre-line text-gray-700">{outlet.receipt_header}</p>
                  <p className="text-[10px] text-gray-700">{outlet.address}</p>
                  <p className="text-[10px] text-gray-700">Telp: {outlet.phone}</p>
                </div>

                <div className="py-2 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>No. Struk:</span>
                    <span className="font-bold">{completedOrder.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span>{new Date(completedOrder.created_at).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>{completedOrder.cashier_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tipe / Meja:</span>
                    <span className="font-bold uppercase">
                      {completedOrder.order_type.replace('_', ' ')} • {completedOrder.table?.table_number || 'Takeaway'}
                    </span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-gray-400 space-y-1.5 text-[11px]">
                  {completedOrder.items.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between font-bold">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span>Rp {item.subtotal_price.toLocaleString('id-ID')}</span>
                      </div>
                      {item.variant_name && (
                        <p className="text-[10px] text-gray-600 pl-3">↳ Size: {item.variant_name}</p>
                      )}
                      {item.modifiers && item.modifiers.map((m, mIdx) => (
                        <p key={mIdx} className="text-[10px] text-gray-600 pl-3">↳ + {m.modifier_name}</p>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="py-2 border-b border-black text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp {completedOrder.subtotal.toLocaleString('id-ID')}</span>
                  </div>

                  {completedOrder.discount_amount > 0 && (
                    <div className="flex justify-between font-bold">
                      <span>Diskon ({completedOrder.promotion_name || 'Promo'}):</span>
                      <span>- Rp {completedOrder.discount_amount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Service Charge (5%):</span>
                    <span>Rp {completedOrder.service_charge.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Pajak Restoran (PB1 10%):</span>
                    <span>Rp {completedOrder.tax_amount.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-gray-400">
                    <span>TOTAL:</span>
                    <span>Rp {completedOrder.grand_total.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="uppercase">Bayar ({completedOrder.payment_method}):</span>
                    <span>Rp {completedOrder.paid_amount.toLocaleString('id-ID')}</span>
                  </div>

                  {completedOrder.payment_method === 'cash' && (
                    <div className="flex justify-between font-bold">
                      <span>Kembalian:</span>
                      <span>Rp {completedOrder.change_amount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-3 text-[10px] text-gray-700 whitespace-pre-line">
                  {outlet.receipt_footer}
                  <p className="mt-2 font-mono font-bold tracking-widest">*** STREET BAR POS ***</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={triggerPrintReceipt}
                className="py-3 rounded-xl bg-[#18191B] hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 touch-btn"
              >
                <Printer className="w-4 h-4 text-[#D4AF37]" />
                <span>Cetak Thermal (ESC/POS)</span>
              </button>

              <button
                onClick={() => setCompletedOrder(null)}
                className="py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white font-bold text-xs flex items-center justify-center gap-2 touch-btn"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Transaksi Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: HELD BILLS & OPEN TABS                                          */}
      {/* ========================================================================= */}
      {showHeldBillsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DECA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <h3 className="font-bold text-base text-[#18191B]">Daftar Open Tab / Bill Parkir</h3>
              <button onClick={() => setShowHeldBillsModal(false)} className="text-xs text-[#717684]">✕</button>
            </div>

            <div className="my-3 space-y-2 max-h-80 overflow-y-auto">
              {heldBills.length === 0 ? (
                <p className="text-center text-xs text-[#717684] py-6">Tidak ada bill parkir yang aktif.</p>
              ) : (
                heldBills.map(bill => (
                  <div key={bill.id} className="p-3 rounded-xl border border-[#EAE3D2] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-[#18191B]">{bill.table} ({bill.id})</p>
                      <p className="text-[10px] text-[#717684]">Waktu: {bill.time} • {bill.cart.length} Menu</p>
                      <p className="text-xs font-black text-[#997519] mt-1">
                        Rp {bill.cart.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <button
                      onClick={() => resumeHeldBill(bill)}
                      className="px-3 py-1.5 bg-[#FAF3E0] hover:bg-[#D4AF37] text-[#997519] hover:text-white rounded-xl text-xs font-bold transition touch-btn"
                    >
                      Buka Bill
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CASHIER SHIFT MANAGEMENT (BUKA & TUTUP SHIFT LANGSUNG DARI KASIR)*/}
      {/* ========================================================================= */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DECA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <h3 className="font-bold text-base text-[#18191B]">
                {activeShift ? 'Tutup Shift Kasir (Z-Report)' : 'Buka Shift Kasir Baru'}
              </h3>
              <button onClick={() => setShowShiftModal(false)} className="text-xs text-[#717684]">✕</button>
            </div>

            {activeShift ? (
              <div className="space-y-3 my-4">
                <div className="bg-[#FAF8F3] p-3 rounded-xl border border-[#EAE3D2] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Shift Number:</span>
                    <span className="font-bold">{activeShift.shift_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Modal Awal Kas:</span>
                    <span className="font-mono">Rp {activeShift.opening_cash.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Penjualan Tunai:</span>
                    <span className="font-mono text-emerald-700">+ Rp {activeShift.total_sales_cash.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Kas Masuk:</span>
                    <span className="font-mono text-emerald-700">+ Rp {activeShift.total_cash_in.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Kas Keluar (Petty Cash):</span>
                    <span className="font-mono text-rose-700">- Rp {activeShift.total_cash_out.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300 text-[#997519]">
                    <span>Estimasi Kas di Laci:</span>
                    <span>Rp {(activeShift.opening_cash + activeShift.total_sales_cash + activeShift.total_cash_in - activeShift.total_cash_out).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">
                    Hitung Uang Fisik di Laci Rp *:
                  </label>
                  <input
                    type="number"
                    value={closingActualCash || ''}
                    onChange={(e) => setClosingActualCash(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-base font-black font-mono border border-[#E8DECA] rounded-xl outline-none text-[#997519]"
                    placeholder="0"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-[#F0ECE1]">
                  <button
                    onClick={() => setShowShiftModal(false)}
                    className="px-4 py-2 text-xs font-bold text-[#717684] rounded-xl border border-[#E8DECA]"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      onCloseShift(closingActualCash, 'Tutup shift kasir');
                      setShowShiftModal(false);
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] rounded-xl shadow-md touch-btn"
                  >
                    Konfirmasi Tutup Shift
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 my-4">
                <div>
                  <label className="text-xs font-bold text-[#18191B] block mb-1">
                    Modal Awal Uang Fisik di Laci Rp *:
                  </label>
                  <input
                    type="number"
                    value={openingCashInput || ''}
                    onChange={(e) => setOpeningCashInput(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-base font-black font-mono border border-[#E8DECA] rounded-xl outline-none text-[#997519]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-[#F0ECE1]">
                  <button
                    onClick={() => setShowShiftModal(false)}
                    className="px-4 py-2 text-xs font-bold text-[#717684] rounded-xl border border-[#E8DECA]"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      onOpenShift(openingCashInput, 'Buka laci kasir baru');
                      setShowShiftModal(false);
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] rounded-xl shadow-md touch-btn"
                  >
                    Buka Shift & Laci
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: PETTY CASH & KAS MASUK DARI LAYAR KASIR                          */}
      {/* ========================================================================= */}
      {showCashMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8DECA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <h3 className="font-bold text-base text-[#18191B]">
                {movementType === 'cash_in' ? 'Pencatatan Kas Masuk' : 'Pengeluaran Kas Kecil (Petty Cash)'}
              </h3>
              <button onClick={() => setShowCashMovementModal(false)} className="text-xs text-[#717684]">✕</button>
            </div>

            <div className="space-y-3 my-4">
              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Kategori Keperluan:</label>
                <select
                  value={movementCategory}
                  onChange={(e) => setMovementCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none font-bold"
                >
                  {movementType === 'cash_out' ? (
                    <>
                      <option value="Pembelian Es Batu Tube">Pembelian Es Batu Tube</option>
                      <option value="Beli Gas LPG / Portable">Beli Gas LPG / Portable</option>
                      <option value="Buah & Garnish Bar (Lemon/Mint)">Buah & Garnish Bar (Lemon/Mint)</option>
                      <option value="Biaya Operasional Darurat">Biaya Operasional Darurat</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </>
                  ) : (
                    <>
                      <option value="Uang Pecahan Kas">Penukaran Uang Pecahan Kasir</option>
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
                  min={1000}
                  value={movementAmount || ''}
                  onChange={(e) => setMovementAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold font-mono border border-[#E8DECA] rounded-xl outline-none text-[#997519]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#18191B] block mb-1">Catatan / Bukti Bon:</label>
                <input
                  type="text"
                  placeholder="Keterangan bon fisik..."
                  value={movementNote}
                  onChange={(e) => setMovementNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8DECA] rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#F0ECE1]">
                <button
                  onClick={() => setShowCashMovementModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#717684] rounded-xl border border-[#E8DECA]"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    onAddCashMovement(movementType, movementAmount, movementCategory, movementNote);
                    setShowCashMovementModal(false);
                    setMovementNote('');
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] rounded-xl shadow-md touch-btn"
                >
                  Simpan Catatan Kas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: ADMIN PORTAL AUTHORIZATION GATE PIN (KASIR TIDAK BISA AKSES)      */}
      {/* ========================================================================= */}
      {showAdminPinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E8DECA]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#997519]" />
                <h3 className="font-bold text-base text-[#18191B]">Otorisasi Role Admin</h3>
              </div>
              <button
                onClick={() => { setShowAdminPinModal(false); setEnteredAdminPin(''); setAdminPinError(''); }}
                className="text-xs text-[#717684]"
              >
                ✕
              </button>
            </div>

            <div className="my-4 text-center">
              <p className="text-xs text-[#5E6470] mb-2">
                Dashboard Admin hanya dapat diakses oleh role <b>Super Admin</b> atau <b>Manager</b>.
              </p>

              <div className="flex justify-center gap-2.5 my-3">
                {[0, 1, 2, 3, 4, 5].map(idx => (
                  <div
                    key={idx}
                    className={`w-8 h-10 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-base ${enteredAdminPin.length > idx
                        ? 'border-[#D4AF37] bg-[#FAF3E0] text-[#18191B]'
                        : 'border-[#EAE3D2] bg-[#FBFBFC] text-transparent'
                      }`}
                  >
                    {enteredAdminPin.length > idx ? '●' : ''}
                  </div>
                ))}
              </div>

              {adminPinError && (
                <p className="text-xs text-rose-600 font-bold mb-2">{adminPinError}</p>
              )}

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-1.5 mt-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => {
                      if (enteredAdminPin.length < 6) {
                        setEnteredAdminPin(prev => prev + num.toString());
                        setAdminPinError('');
                      }
                    }}
                    className="h-11 bg-white hover:bg-[#FAF3E0] border border-[#E8DECA] rounded-xl text-base font-bold text-[#18191B] touch-btn shadow-2xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => setEnteredAdminPin(prev => prev.slice(0, -1))}
                  className="h-11 bg-[#F5F2EA] border border-[#E8DECA] rounded-xl text-xs font-bold text-[#717684] touch-btn"
                >
                  HAPUS
                </button>
                <button
                  onClick={() => {
                    if (enteredAdminPin.length < 6) {
                      setEnteredAdminPin(prev => prev + '0');
                      setAdminPinError('');
                    }
                  }}
                  className="h-11 bg-white hover:bg-[#FAF3E0] border border-[#E8DECA] rounded-xl text-base font-bold text-[#18191B] touch-btn shadow-2xs"
                >
                  0
                </button>
                <button
                  disabled={enteredAdminPin.length < 6}
                  onClick={handleVerifyAdminPin}
                  className="h-11 bg-gradient-to-r from-[#D4AF37] to-[#B38F2C] text-white font-bold text-xs rounded-xl touch-btn shadow-md disabled:opacity-40"
                >
                  MASUK
                </button>
              </div>

              <p className="text-[10px] text-[#997519] mt-3 bg-[#FAF3E0] p-1.5 rounded-lg border border-[#E8DECA]">
                💡 PIN Admin Owner: <b>112233</b> | PIN Manager: <b>998877</b>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E8DECA] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <LogOut className="w-7 h-7" />
            </div>

            <h3 className="font-serif font-bold text-lg text-center text-[#18191B]">Konfirmasi Log Out</h3>
            <p className="text-xs text-[#717684] text-center mt-1">
              Apakah Anda yakin ingin keluar dari terminal kasir akun <b>{currentStaff.name}</b>?
            </p>

            {activeShift && (
              <div className="mt-3 p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E8DECA] text-[11px] text-[#8C6D23] flex items-center gap-2">
                <Wallet className="w-4 h-4 shrink-0" />
                <span>Shift <b>{activeShift.shift_number}</b> masih terbuka dan tetap aman di database.</span>
              </div>
            )}

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
                  if (onLogout) {
                    onLogout();
                  }
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
};
