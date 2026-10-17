import { 
  Order, 
  WorkShift, 
  CashMovement, 
  Product, 
  Promotion, 
  UserStaff, 
  Customer, 
  PosTable 
} from '../types/pos';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const posApi = {
  // 1. Initial Bundle from MariaDB via Laravel
  async getInitData() {
    try {
      const res = await fetch(`${API_BASE}/pos/init`, { cache: 'no-store' });
      if (!res.ok) throw new Error('API offline');
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },

  // 2. Authentication
  async pinLogin(pinCode: string): Promise<UserStaff | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/pin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin_code: pinCode })
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data.user;
    } catch {
      return null;
    }
  },

  async login(email: string, password: string): Promise<UserStaff | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data.user;
    } catch {
      return null;
    }
  },

  // 3. Orders & Transactions
  async submitOrder(orderPayload: any) {
    try {
      const res = await fetch(`${API_BASE}/pos/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (!res.ok) throw new Error('Failed to submit order');
      return await res.json();
    } catch {
      return null;
    }
  },

  async getOrders(params?: { status?: string; date?: string; cashier_id?: number }) {
    try {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/pos/orders?${query}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },

  async getOrderDetails(id: number) {
    try {
      const res = await fetch(`${API_BASE}/pos/orders/${id}`);
      if (!res.ok) throw new Error('Failed to fetch order details');
      return await res.json();
    } catch {
      return null;
    }
  },

  async voidOrder(id: number, managerPin: string, reason: string) {
    try {
      const res = await fetch(`${API_BASE}/pos/orders/${id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manager_pin: managerPin, void_reason: reason })
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // 4. Products & Stock Opname
  async getProducts() {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },

  async addProduct(payload: any) {
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateProduct(id: number, payload: any) {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async adjustStock(productId: number, payload: { type: string; quantity: number; notes: string; user_id: number }) {
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // 5. Shift & Cash Drawer
  async getCurrentShift() {
    try {
      const res = await fetch(`${API_BASE}/shifts/current`);
      if (!res.ok) throw new Error('Failed to fetch shift');
      return await res.json();
    } catch {
      return null;
    }
  },

  async getShiftHistory() {
    try {
      const res = await fetch(`${API_BASE}/shifts/history`);
      if (!res.ok) throw new Error('Failed to fetch shift history');
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },

  async openShift(cashierId: number, openingCash: number, notes?: string) {
    try {
      const res = await fetch(`${API_BASE}/shifts/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashier_id: cashierId, opening_cash: openingCash, notes })
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async closeShift(shiftId: number, closingCashActual: number, notes?: string) {
    try {
      const res = await fetch(`${API_BASE}/shifts/${shiftId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closing_cash_actual: closingCashActual, notes })
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async recordCashMovement(payload: { shift_id: number; user_id: number; type: 'cash_in' | 'cash_out'; amount: number; category: string; notes?: string }) {
    try {
      const res = await fetch(`${API_BASE}/shifts/cash-movement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // 6. Promotions
  async getPromotions() {
    try {
      const res = await fetch(`${API_BASE}/promotions`);
      if (!res.ok) throw new Error('Failed to fetch promotions');
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },

  async addPromotion(payload: any) {
    try {
      const res = await fetch(`${API_BASE}/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async togglePromotion(id: number) {
    try {
      const res = await fetch(`${API_BASE}/promotions/${id}/toggle`, {
        method: 'PATCH'
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // 7. Customers
  async getCustomers() {
    try {
      const res = await fetch(`${API_BASE}/customers`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },

  async addCustomer(payload: any) {
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // 8. Tables
  async getTables() {
    try {
      const res = await fetch(`${API_BASE}/tables`);
      if (!res.ok) throw new Error('Failed to fetch tables');
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },

  async updateTableStatus(id: number, status: string, guestName?: string) {
    try {
      const res = await fetch(`${API_BASE}/tables/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, current_guest_name: guestName })
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // 9. Users / Staff Management
  async getUsers() {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },

  async addUser(payload: any) {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateUser(id: number, payload: any) {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // 10. Reports
  async getDashboardReport() {
    try {
      const res = await fetch(`${API_BASE}/reports/dashboard`);
      if (!res.ok) throw new Error('Failed to fetch report');
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },

  async getSalesReport(startDate?: string, endDate?: string) {
    try {
      const query = new URLSearchParams({ start_date: startDate || '', end_date: endDate || '' }).toString();
      const res = await fetch(`${API_BASE}/reports/sales?${query}`);
      if (!res.ok) throw new Error('Failed to fetch sales report');
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  }
};
