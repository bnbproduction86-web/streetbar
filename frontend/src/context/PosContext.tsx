'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Outlet, 
  UserStaff, 
  Category, 
  Product, 
  PosTable, 
  Customer, 
  Promotion, 
  WorkShift, 
  Order, 
  CashMovement 
} from '../types/pos';
import { 
  initialOutlet, 
  initialStaff, 
  initialCategories, 
  initialProducts, 
  initialTables, 
  initialCustomers, 
  initialPromotions, 
  initialShift, 
  sampleCompletedOrders 
} from '../data/mockData';
import { posApi } from '../services/api';

interface PosContextType {
  currentUser: UserStaff | null;
  outlet: Outlet;
  allStaff: UserStaff[];
  categories: Category[];
  products: Product[];
  tables: PosTable[];
  customers: Customer[];
  promotions: Promotion[];
  orders: Order[];
  activeShift: WorkShift | null;
  cashMovements: CashMovement[];
  dbConnected: boolean;
  
  // Auth methods
  loginWithPin: (pin: string) => Promise<{ success: boolean; user?: UserStaff; error?: string }>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; user?: UserStaff; error?: string }>;
  logout: () => void;
  setCurrentUser: (user: UserStaff | null) => void;
  
  // POS Operations
  createOrder: (orderData: Partial<Order>) => Promise<Order>;
  openShift: (openingCash: number, notes: string) => Promise<void>;
  closeShift: (closingCashActual: number, notes: string) => Promise<{ diff: number; shift: WorkShift } | null>;
  recordCashMovement: (type: 'cash_in' | 'cash_out', amount: number, category: string, notes?: string) => Promise<void>;
  
  // Product / Inventory
  addProduct: (product: any) => Promise<void>;
  updateProduct: (id: number, product: any) => Promise<void>;
  adjustStock: (id: number, adjustment: { type: string; quantity: number; notes: string }) => Promise<void>;
  
  // Promo
  addPromotion: (promo: any) => Promise<void>;
  togglePromotion: (id: number) => Promise<void>;
  
  // Table
  updateTableStatus: (id: number, status: string, guest?: string) => Promise<void>;
  
  // Staff User Management
  addUser: (staff: any) => Promise<void>;
  updateUser: (id: number, staff: any) => Promise<void>;
  
  refreshData: () => Promise<void>;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export const PosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<UserStaff | null>(null);
  const [outlet, setOutlet] = useState<Outlet>(initialOutlet);
  const [allStaff, setAllStaff] = useState<UserStaff[]>(initialStaff);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [tables, setTables] = useState<PosTable[]>(initialTables);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [orders, setOrders] = useState<Order[]>(sampleCompletedOrders);
  const [activeShift, setActiveShift] = useState<WorkShift | null>(initialShift);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([
    {
      id: 1,
      shift_id: 1,
      user_id: 3,
      userName: 'Nabila Putri',
      type: 'cash_in',
      amount: 100000,
      category: 'Uang Pecahan Kas',
      notes: 'Penukaran uang kecil Rp 2.000 & Rp 5.000 dari bank',
      created_at: '2026-10-16T12:30:00.000Z',
    },
    {
      id: 2,
      shift_id: 1,
      user_id: 3,
      userName: 'Nabila Putri',
      type: 'cash_out',
      amount: 50000,
      category: 'Pembelian Es Batu Tube',
      notes: 'Beli 2 karung es batu kristal darurat',
      created_at: '2026-10-16T13:45:00.000Z',
    }
  ]);
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  // Restore session from localStorage on client
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('streetbar_user');
      if (savedUser) {
        setCurrentUserState(JSON.parse(savedUser));
      } else {
        // Default to Kasir Nabila for seamless testing
        setCurrentUserState(initialStaff[2]);
      }
    } catch {
      setCurrentUserState(initialStaff[2]);
    }
  }, []);

  const setCurrentUser = (user: UserStaff | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('streetbar_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('streetbar_user');
    }
  };

  // Sync data with MariaDB via Laravel API
  const refreshData = async () => {
    try {
      const data = await posApi.getInitData();
      if (data) {
        setDbConnected(true);
        if (data.outlet) setOutlet(data.outlet);
        if (data.categories?.length) setCategories(data.categories);
        if (data.products?.length) {
          // Normalize prices to numbers
          const normalized = data.products.map((p: any) => ({
            ...p,
            cost_price: Number(p.cost_price) || 0,
            selling_price: Number(p.selling_price) || 0,
            current_stock: Number(p.current_stock) || 0,
            min_stock_alert: Number(p.min_stock_alert) || 5,
            variants: (p.variants || []).map((v: any) => ({
              ...v,
              additional_price: Number(v.additional_price) || 0,
              cost_price: Number(v.cost_price) || 0,
            })),
            modifier_groups: (p.modifier_groups || []).map((mg: any) => ({
              ...mg,
              items: (mg.items || []).map((m: any) => ({
                ...m,
                price: Number(m.price) || 0,
                cost_price: Number(m.cost_price) || 0,
              }))
            }))
          }));
          setProducts(normalized);
        }
        if (data.tables?.length) setTables(data.tables);
        if (data.promotions?.length) setPromotions(data.promotions);
        if (data.customers?.length) setCustomers(data.customers);
        if (data.current_shift) {
          setActiveShift(data.current_shift);
        } else {
          setActiveShift(null);
        }
        if (data.users?.length) {
          const mappedUsers = data.users.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || '',
            pin_code: u.pin_code,
            role: u.role,
            avatar_url: u.avatar_url,
            is_active: Boolean(u.is_active),
          }));
          setAllStaff(mappedUsers);
        }
        if (data.orders?.length) {
          const mappedOrders = data.orders.map((o: any) => ({
            id: o.id,
            invoice_number: o.invoice_number,
            outlet_id: o.outlet_id,
            cashier_id: o.cashier_id,
            cashier_name: o.cashier?.name || 'Kasir',
            shift_id: o.shift_id,
            table_id: o.table_id,
            table: o.table,
            customer_id: o.customer_id,
            customer: o.customer,
            order_type: o.order_type,
            status: o.status,
            subtotal: Math.round(Number(o.subtotal) || 0),
            discount_amount: Math.round(Number(o.discount_amount) || 0),
            promotion_name: o.promotion?.name,
            tax_amount: Math.round(Number(o.tax_amount) || 0),
            service_charge: Math.round(Number(o.service_charge) || 0),
            grand_total: Math.round(Number(o.grand_total) || 0),
            total_cost_price: Math.round(Number(o.total_cost_price) || 0),
            paid_amount: Math.round(Number(o.paid_amount) || 0),
            change_amount: Math.round(Number(o.change_amount) || 0),
            payment_method: o.payment_method,
            payment_reference: o.payment_reference,
            notes: o.notes,
            items: (o.items || []).map((it: any) => ({
              product_id: it.product_id,
              product_name: it.product_name,
              variant_name: it.variant_name,
              unit_price: Math.round(Number(it.unit_price) || 0),
              quantity: Math.round(Number(it.quantity) || 1),
              subtotal_price: Math.round(Number(it.subtotal_price) || 0),
              notes: it.notes,
              modifiers: (it.modifiers || []).map((m: any) => ({
                id: m.modifier_item_id,
                name: m.modifier_name,
                price: Math.round(Number(m.additional_price) || 0),
              }))
            })),
            created_at: o.created_at,
          }));
          setOrders(mappedOrders);
        }
        if (data.cash_movements?.length) {
          const mappedMovements = data.cash_movements.map((cm: any) => ({
            id: cm.id,
            shift_id: cm.shift_id,
            user_id: cm.user_id,
            userName: cm.user?.name || 'Staff',
            type: cm.type,
            amount: Math.round(Number(cm.amount) || 0),
            category: cm.category,
            notes: cm.notes,
            receipt_proof_url: cm.receipt_proof_url,
            created_at: cm.created_at,
          }));
          setCashMovements(mappedMovements);
        }
      }
    } catch {
      // Fallback in memory
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Auth: PIN Login
  const loginWithPin = async (pin: string) => {
    // Check local list first
    const localMatch = allStaff.find(s => s.pin_code === pin && s.is_active);
    if (localMatch) {
      setCurrentUser(localMatch);
      return { success: true, user: localMatch };
    }

    // Try API verification directly against MariaDB users table
    const apiUser = await posApi.pinLogin(pin);
    if (apiUser) {
      setCurrentUser(apiUser);
      return { success: true, user: apiUser };
    }

    return { success: false, error: 'PIN salah atau akun kasir tidak aktif!' };
  };

  // Auth: Email Login
  const loginWithEmail = async (email: string, pass: string) => {
    const localMatch = allStaff.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (localMatch) {
      setCurrentUser(localMatch);
      return { success: true, user: localMatch };
    }

    const apiUser = await posApi.login(email, pass);
    if (apiUser) {
      setCurrentUser(apiUser);
      return { success: true, user: apiUser };
    }

    return { success: false, error: 'Email atau password tidak cocok!' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Create Order with direct MariaDB persistence & exact calculations
  const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fallbackInvoice = `SBP-${datePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const fullOrder: Order = {
      id: Date.now(),
      invoice_number: fallbackInvoice,
      outlet_id: outlet.id,
      cashier_id: currentUser?.id || 3,
      cashier_name: currentUser?.name || 'Kasir',
      shift_id: activeShift?.id || 1,
      table_id: orderData.table_id,
      table: tables.find(t => t.id === orderData.table_id),
      customer_id: orderData.customer_id,
      customer: customers.find(c => c.id === orderData.customer_id),
      order_type: orderData.order_type || 'dine_in',
      status: 'completed',
      subtotal: Math.round(Number(orderData.subtotal) || 0),
      discount_amount: Math.round(Number(orderData.discount_amount) || 0),
      promotion_name: orderData.promotion_name,
      tax_amount: Math.round(Number(orderData.tax_amount) || 0),
      service_charge: Math.round(Number(orderData.service_charge) || 0),
      grand_total: Math.round(Number(orderData.grand_total) || 0),
      total_cost_price: Math.round(Number(orderData.total_cost_price) || 0),
      paid_amount: Math.round(Number(orderData.paid_amount) || 0),
      change_amount: Math.round(Number(orderData.change_amount) || 0),
      payment_method: orderData.payment_method || 'cash',
      payment_reference: orderData.payment_reference,
      notes: orderData.notes,
      items: (orderData.items || []).map(i => ({
        product_id: i.product_id,
        product_name: i.product_name,
        variant_name: i.variant_name,
        unit_price: Math.round(Number(i.unit_price) || 0),
        quantity: Math.round(Number(i.quantity) || 1),
        subtotal_price: Math.round(Number(i.subtotal_price) || 0),
        notes: i.notes,
        modifiers: i.modifiers || [],
      })),
      created_at: new Date().toISOString(),
    };

    setOrders(prev => [fullOrder, ...prev]);

    // Send directly to Laravel API -> MariaDB orders, order_items, order_item_modifiers
    try {
      const apiRes = await posApi.submitOrder({
        cashier_id: fullOrder.cashier_id,
        shift_id: fullOrder.shift_id,
        table_id: fullOrder.table_id,
        customer_id: fullOrder.customer_id,
        order_type: fullOrder.order_type,
        items: fullOrder.items,
        subtotal: fullOrder.subtotal,
        discount_amount: fullOrder.discount_amount,
        tax_amount: fullOrder.tax_amount,
        service_charge: fullOrder.service_charge,
        grand_total: fullOrder.grand_total,
        paid_amount: fullOrder.paid_amount,
        change_amount: fullOrder.change_amount,
        payment_method: fullOrder.payment_method,
        payment_reference: fullOrder.payment_reference,
        notes: fullOrder.notes,
      });

      if (apiRes?.status === 'success' && apiRes?.data) {
        fullOrder.id = apiRes.data.id;
        fullOrder.invoice_number = apiRes.data.invoice_number;
        // Re-sync fresh state from database
        await refreshData();
      }
    } catch {
      // Offline fallback
    }

    return fullOrder;
  };

  // Open Shift
  const openShift = async (openingCash: number, notes: string) => {
    const shiftNumber = `SHIFT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`;
    const newShift: WorkShift = {
      id: Date.now(),
      outlet_id: outlet.id,
      cashier_id: currentUser?.id || 3,
      cashier: currentUser || initialStaff[2],
      shift_number: shiftNumber,
      opening_cash: Math.round(openingCash),
      total_cash_in: 0,
      total_cash_out: 0,
      total_sales_cash: 0,
      total_sales_non_cash: 0,
      total_orders_count: 0,
      status: 'open',
      opened_at: new Date().toISOString(),
      notes,
    };
    setActiveShift(newShift);

    try {
      await posApi.openShift(currentUser?.id || 3, Math.round(openingCash), notes);
      await refreshData();
    } catch {
      // In-memory
    }
  };

  // Close Shift
  const closeShift = async (closingCashActual: number, notes: string) => {
    if (!activeShift) return null;
    const expected = activeShift.opening_cash + activeShift.total_sales_cash + activeShift.total_cash_in - activeShift.total_cash_out;
    const diff = closingCashActual - expected;

    const closed: WorkShift = {
      ...activeShift,
      closing_cash_actual: closingCashActual,
      closing_cash_expected: expected,
      cash_difference: diff,
      status: 'closed',
      closed_at: new Date().toISOString(),
      notes,
    };

    setActiveShift(null);

    try {
      await posApi.closeShift(activeShift.id, closingCashActual, notes);
      await refreshData();
    } catch {
      // In-memory
    }

    return { diff, shift: closed };
  };

  // Record Cash Movement
  const recordCashMovement = async (type: 'cash_in' | 'cash_out', amount: number, category: string, notes?: string) => {
    const roundedAmount = Math.round(amount);
    const newEntry: CashMovement = {
      id: Date.now(),
      shift_id: activeShift?.id || 1,
      user_id: currentUser?.id || 3,
      userName: currentUser?.name || 'Kasir',
      type,
      amount: roundedAmount,
      category,
      notes,
      created_at: new Date().toISOString(),
    };

    setCashMovements(prev => [newEntry, ...prev]);

    if (activeShift) {
      try {
        await posApi.recordCashMovement({
          shift_id: activeShift.id,
          user_id: currentUser?.id || 3,
          type,
          amount: roundedAmount,
          category,
          notes,
        });
        await refreshData();
      } catch {
        // In-memory
      }
    }
  };

  // Products CRUD
  const addProduct = async (productData: any) => {
    const payload = {
      category_id: productData.category_id || 1,
      name: productData.name,
      sku: productData.sku,
      barcode: productData.barcode || null,
      unit: productData.unit || 'glass',
      cost_price: Math.round(Number(productData.cost_price) || 0),
      selling_price: Math.round(Number(productData.selling_price) || 0),
      track_stock: Boolean(productData.track_stock),
      current_stock: Math.round(Number(productData.current_stock) || 0),
      min_stock_alert: Math.round(Number(productData.min_stock_alert) || 5),
      is_favorite: Boolean(productData.is_favorite),
      description: productData.description || null,
    };

    try {
      await posApi.addProduct(payload);
      await refreshData();
    } catch {
      setProducts(prev => [{ ...productData, id: Date.now() }, ...prev]);
    }
  };

  const updateProduct = async (id: number, productData: any) => {
    try {
      await posApi.updateProduct(id, productData);
      await refreshData();
    } catch {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...productData } : p));
    }
  };

  const adjustStock = async (id: number, adjustment: { type: string; quantity: number; notes: string }) => {
    try {
      await posApi.adjustStock(id, {
        type: adjustment.type,
        quantity: adjustment.quantity,
        notes: adjustment.notes,
        user_id: currentUser?.id || 1,
      });
      await refreshData();
    } catch {
      const qtyChange = adjustment.type === 'waste_spoilage' ? -Math.abs(adjustment.quantity) : adjustment.quantity;
      setProducts(prev => prev.map(p => {
        if (p.id === id) {
          return { ...p, current_stock: Math.max(0, p.current_stock + qtyChange) };
        }
        return p;
      }));
    }
  };

  // Promotions CRUD
  const addPromotion = async (promoData: any) => {
    const payload = {
      name: promoData.name,
      code: promoData.code,
      type: promoData.type,
      discount_value: Number(promoData.discount_value) || 0,
      min_order_amount: Number(promoData.min_order_amount) || 0,
      max_discount_amount: Number(promoData.max_discount_amount) || null,
      start_time: promoData.start_time || null,
      end_time: promoData.end_time || null,
      days_active: promoData.days_active || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      is_active: promoData.is_active !== undefined ? promoData.is_active : true,
    };

    try {
      await posApi.addPromotion(payload);
      await refreshData();
    } catch {
      setPromotions(prev => [{ ...promoData, id: Date.now() }, ...prev]);
    }
  };

  const togglePromotion = async (id: number) => {
    try {
      await posApi.togglePromotion(id);
      await refreshData();
    } catch {
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
    }
  };

  // Tables
  const updateTableStatus = async (id: number, status: string, guest?: string) => {
    try {
      await posApi.updateTableStatus(id, status, guest);
      await refreshData();
    } catch {
      setTables(prev => prev.map(t => t.id === id ? { ...t, status: status as any, current_guest_name: guest } : t));
    }
  };

  // Staff Users CRUD
  const addUser = async (userData: any) => {
    const payload = {
      outlet_id: outlet.id || 1,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || null,
      role: userData.role || 'cashier',
      pin_code: userData.pin_code,
      password: 'password123',
      is_active: userData.is_active !== undefined ? userData.is_active : true,
    };

    try {
      await posApi.addUser(payload);
      await refreshData();
    } catch {
      setAllStaff(prev => [{ ...userData, id: Date.now() }, ...prev]);
    }
  };

  const updateUser = async (id: number, userData: any) => {
    try {
      await posApi.updateUser(id, userData);
      await refreshData();
    } catch {
      setAllStaff(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u));
    }
  };

  return (
    <PosContext.Provider value={{
      currentUser,
      outlet,
      allStaff,
      categories,
      products,
      tables,
      customers,
      promotions,
      orders,
      activeShift,
      cashMovements,
      dbConnected,
      loginWithPin,
      loginWithEmail,
      logout,
      setCurrentUser,
      createOrder,
      openShift,
      closeShift,
      recordCashMovement,
      addProduct,
      updateProduct,
      adjustStock,
      addPromotion,
      togglePromotion,
      updateTableStatus,
      addUser,
      updateUser,
      refreshData,
    }}>
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
};
