/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'cafe' | 'hotel';
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string; // Unique GUID or ID for DB
  orderNumber: number; // e.g., 1, 2, 3...
  formattedOrderNumber: string; // e.g., "#0001", "#0002"
  timestamp: string; // ISO String
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  tendered: number;
  change: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI';
  servedBy: 'Admin' | 'Worker';
}

export interface SalesReport {
  date: string;
  totalOrders: number;
  totalSales: number;
  paymentMethods: {
    Cash: number;
    Card: number;
    UPI: number;
  };
  categoryBreakdown: {
    cafe: number;
    hotel: number;
  };
  topItems: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

export interface PrinterSettings {
  paperWidth: '58mm' | '80mm';
  isConnected: boolean;
  mockDeviceName: string;
  autoPrintOnCheckout: boolean;
}
