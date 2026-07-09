/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, Order, PrinterSettings, SalesReport } from '../types';

// Default menu items as specified by the user
const DEFAULT_CAFE_ITEMS: MenuItem[] = [
  { id: 'c1', name: 'Tea', price: 15, category: 'cafe' },
  { id: 'c2', name: 'Masala Tea', price: 15, category: 'cafe' },
  { id: 'c3', name: 'Ginger Tea', price: 15, category: 'cafe' },
  { id: 'c4', name: 'Lemon Tea', price: 15, category: 'cafe' },
  { id: 'c5', name: 'Pistha Tea', price: 20, category: 'cafe' },
  { id: 'c6', name: 'Green Tea', price: 20, category: 'cafe' },
  { id: 'c7', name: 'Black Tea', price: 15, category: 'cafe' },
  { id: 'c8', name: 'Coffee', price: 20, category: 'cafe' },
  { id: 'c9', name: 'Black Coffee', price: 15, category: 'cafe' },
  { id: 'c10', name: 'Samosa', price: 15, category: 'cafe' },
  { id: 'c11', name: '500ml Water', price: 10, category: 'cafe' },
  { id: 'c12', name: '1L Water Bottle', price: 20, category: 'cafe' },
  { id: 'c13', name: '2L Water Bottle', price: 35, category: 'cafe' }
];

const DEFAULT_HOTEL_ITEMS: MenuItem[] = [
  { id: 'h1', name: 'Idli (2 Pcs)', price: 30, category: 'hotel' },
  { id: 'h2', name: 'Vada (1 Pc)', price: 15, category: 'hotel' },
  { id: 'h3', name: 'Plain Dosa', price: 50, category: 'hotel' },
  { id: 'h4', name: 'Masala Dosa', price: 65, category: 'hotel' },
  { id: 'h5', name: 'Poori Masala', price: 45, category: 'hotel' },
  { id: 'h6', name: 'Rava Upma', price: 30, category: 'hotel' },
  { id: 'h7', name: 'Veg Meals', price: 80, category: 'hotel' },
  { id: 'h8', name: 'Veg Fried Rice', price: 90, category: 'hotel' },
  { id: 'h9', name: 'Veg Biryani', price: 110, category: 'hotel' },
  { id: 'h10', name: 'Curd Rice', price: 40, category: 'hotel' }
];

const STORAGE_KEYS = {
  MENU_ITEMS: 'pos_menu_items',
  ORDERS: 'pos_orders',
  NEXT_ORDER_NUM: 'pos_next_order_number',
  PRINTER_SETTINGS: 'pos_printer_settings',
  SESSION: 'pos_user_session'
};

export const storage = {
  // --- MENU ITEMS ---
  getMenuItems(): MenuItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    if (!data) {
      const initial = [...DEFAULT_CAFE_ITEMS, ...DEFAULT_HOTEL_ITEMS];
      localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },

  saveMenuItems(items: MenuItem[]): void {
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
  },

  addMenuItem(item: Omit<MenuItem, 'id'>): MenuItem {
    const items = this.getMenuItems();
    const newItem: MenuItem = {
      ...item,
      id: 'item_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    };
    items.push(newItem);
    this.saveMenuItems(items);
    return newItem;
  },

  updateMenuItem(updatedItem: MenuItem): void {
    const items = this.getMenuItems();
    const index = items.findIndex(i => i.id === updatedItem.id);
    if (index !== -1) {
      items[index] = updatedItem;
      this.saveMenuItems(items);
    }
  },

  deleteMenuItem(id: string): void {
    const items = this.getMenuItems();
    const filtered = items.filter(i => i.id !== id);
    this.saveMenuItems(filtered);
  },

  resetMenuToDefault(): MenuItem[] {
    const initial = [...DEFAULT_CAFE_ITEMS, ...DEFAULT_HOTEL_ITEMS];
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(initial));
    return initial;
  },

  // --- ORDERS ---
  getOrders(): Order[] {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },

  saveOrder(order: Omit<Order, 'id' | 'orderNumber' | 'formattedOrderNumber'>): Order {
    const orders = this.getOrders();
    const nextNum = this.getNextOrderNumber();
    
    const formattedNum = '#' + nextNum.toString().padStart(4, '0');
    const newOrder: Order = {
      ...order,
      id: 'ord_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      orderNumber: nextNum,
      formattedOrderNumber: formattedNum
    };
    
    orders.unshift(newOrder); // Add to beginning (most recent first)
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    this.incrementOrderNumber(nextNum);
    
    return newOrder;
  },

  getNextOrderNumber(): number {
    const num = localStorage.getItem(STORAGE_KEYS.NEXT_ORDER_NUM);
    return num ? parseInt(num, 10) : 1;
  },

  incrementOrderNumber(current: number): void {
    localStorage.setItem(STORAGE_KEYS.NEXT_ORDER_NUM, (current + 1).toString());
  },

  clearAllOrders(): void {
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.setItem(STORAGE_KEYS.NEXT_ORDER_NUM, '1');
  },

  // --- PRINTER SETTINGS ---
  getPrinterSettings(): PrinterSettings {
    const data = localStorage.getItem(STORAGE_KEYS.PRINTER_SETTINGS);
    if (!data) {
      const initial: PrinterSettings = {
        paperWidth: '58mm',
        isConnected: false,
        mockDeviceName: 'RP58 Thermal Bluetooth Printer',
        autoPrintOnCheckout: true
      };
      localStorage.setItem(STORAGE_KEYS.PRINTER_SETTINGS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },

  savePrinterSettings(settings: PrinterSettings): void {
    localStorage.setItem(STORAGE_KEYS.PRINTER_SETTINGS, JSON.stringify(settings));
  },

  // --- SALES REPORT ---
  getSalesReport(dateStr: string): SalesReport {
    // dateStr in YYYY-MM-DD format
    const orders = this.getOrders();
    
    // Filter orders for the selected date
    const targetDate = new Date(dateStr);
    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return (
        orderDate.getFullYear() === targetDate.getFullYear() &&
        orderDate.getMonth() === targetDate.getMonth() &&
        orderDate.getDate() === targetDate.getDate()
      );
    });

    let totalSales = 0;
    const paymentMethods = { Cash: 0, Card: 0, UPI: 0 };
    const categoryBreakdown = { cafe: 0, hotel: 0 };
    const itemSalesMap: Record<string, { quantity: number; revenue: number }> = {};

    const menuItems = this.getMenuItems();
    const itemCategoryMap = new Map<string, 'cafe' | 'hotel'>();
    menuItems.forEach(item => itemCategoryMap.set(item.name, item.category));

    dayOrders.forEach(order => {
      totalSales += order.total;
      
      // Payment methods breakdown
      if (order.paymentMethod in paymentMethods) {
        paymentMethods[order.paymentMethod] += order.total;
      }

      // Items breakdown
      order.items.forEach(item => {
        const cat = itemCategoryMap.get(item.name) || 'cafe';
        categoryBreakdown[cat] += item.price * item.quantity;

        if (!itemSalesMap[item.name]) {
          itemSalesMap[item.name] = { quantity: 0, revenue: 0 };
        }
        itemSalesMap[item.name].quantity += item.quantity;
        itemSalesMap[item.name].revenue += item.price * item.quantity;
      });
    });

    const topItems = Object.entries(itemSalesMap)
      .map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // top 5 items

    return {
      date: dateStr,
      totalOrders: dayOrders.length,
      totalSales,
      paymentMethods,
      categoryBreakdown,
      topItems
    };
  }
};
