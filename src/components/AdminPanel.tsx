/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MenuItem, Order } from '../types';
import { storage } from '../lib/storage';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Search, 
  Calendar, 
  TrendingUp, 
  RefreshCw, 
  ClipboardList, 
  Database, 
  FileText, 
  ShoppingBag, 
  Utensils, 
  Coffee, 
  ChevronLeft, 
  X, 
  TrendingDown, 
  Info,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onGoBack: () => void;
  onReprintOrder: (order: Order) => void;
  onOrderPress: () => void;
}

type AdminSubView = 'home' | 'hotel' | 'cafe' | 'billing_history';

export default function AdminPanel({
  menuItems,
  setMenuItems,
  orders,
  setOrders,
  onGoBack,
  onReprintOrder,
  onOrderPress
}: AdminPanelProps) {
  const [adminSubView, setAdminSubView] = useState<AdminSubView>('home');

  // --- MENU MANAGER STATES ---
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');

  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // --- PAST BILLS SEARCH ---
  const [historySearch, setHistorySearch] = useState('');

  // --- DATE/TIME METRICS & RANGE CALCULATIONS ---
  const now = useMemo(() => new Date(), [orders]);

  // 1. Daily Sales Metrics (Today)
  const dailyMetrics = useMemo(() => {
    const todayStr = now.toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.timestamp.startsWith(todayStr));
    const sales = todayOrders.reduce((sum, o) => sum + o.total, 0);
    return { count: todayOrders.length, sales };
  }, [orders, now]);

  // 2. Weekly Sales Metrics (Last 7 Days)
  const weeklyMetrics = useMemo(() => {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyOrders = orders.filter(o => {
      const oDate = new Date(o.timestamp);
      return oDate >= sevenDaysAgo && oDate <= now;
    });
    const sales = weeklyOrders.reduce((sum, o) => sum + o.total, 0);
    return { count: weeklyOrders.length, sales };
  }, [orders, now]);

  // 3. Monthly Sales Metrics (Last 30 Days)
  const monthlyMetrics = useMemo(() => {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthlyOrders = orders.filter(o => {
      const oDate = new Date(o.timestamp);
      return oDate >= thirtyDaysAgo && oDate <= now;
    });
    const sales = monthlyOrders.reduce((sum, o) => sum + o.total, 0);
    return { count: monthlyOrders.length, sales };
  }, [orders, now]);

  // --- PRODUCT CATEGORY DICTIONARY ---
  const itemCategoryMap = useMemo(() => {
    const map = new Map<string, 'cafe' | 'hotel'>();
    menuItems.forEach(item => map.set(item.name, item.category));
    return map;
  }, [menuItems]);

  // --- TOP SELLING LEADERS ---
  const topSales = useMemo(() => {
    const cafeMap: Record<string, { quantity: number; revenue: number }> = {};
    const hotelMap: Record<string, { quantity: number; revenue: number }> = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const cat = itemCategoryMap.get(item.name) || 'cafe';
        const targetMap = cat === 'cafe' ? cafeMap : hotelMap;
        if (!targetMap[item.name]) {
          targetMap[item.name] = { quantity: 0, revenue: 0 };
        }
        targetMap[item.name].quantity += item.quantity;
        targetMap[item.name].revenue += item.price * item.quantity;
      });
    });

    const cafeSorted = Object.entries(cafeMap)
      .map(([name, s]) => ({ name, quantity: s.quantity, revenue: s.revenue }))
      .sort((a, b) => b.quantity - a.quantity);

    const hotelSorted = Object.entries(hotelMap)
      .map(([name, s]) => ({ name, quantity: s.quantity, revenue: s.revenue }))
      .sort((a, b) => b.quantity - a.quantity);

    return {
      cafe: cafeSorted.slice(0, 5),
      hotel: hotelSorted.slice(0, 5)
    };
  }, [orders, itemCategoryMap]);

  // --- BILLS TRACKER SEARCH FILTER ---
  const filteredOrders = useMemo(() => {
    if (!historySearch.trim()) return orders;
    const query = historySearch.toLowerCase();
    return orders.filter(order => 
      order.formattedOrderNumber.toLowerCase().includes(query) ||
      order.orderNumber.toString() === query ||
      order.items.some(item => item.name.toLowerCase().includes(query)) ||
      order.paymentMethod.toLowerCase() === query
    );
  }, [orders, historySearch]);

  // --- ACTIONS ---
  const handleAddItem = (category: 'hotel' | 'cafe') => {
    if (!newItemName.trim() || !newItemPrice) {
      alert('Please fill out item name and price.');
      return;
    }
    const priceNum = parseFloat(newItemPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Price must be a valid positive number.');
      return;
    }

    const added = storage.addMenuItem({
      name: newItemName.trim(),
      price: priceNum,
      category
    });

    setMenuItems(prev => [...prev, added]);
    setNewItemName('');
    setNewItemPrice('');
    setIsAdding(false);
  };

  const handleStartEdit = (item: MenuItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemPrice(item.price.toString());
  };

  const handleSaveEdit = (item: MenuItem) => {
    if (!editItemName.trim() || !editItemPrice) {
      alert('Item name and price are required.');
      return;
    }
    const priceNum = parseFloat(editItemPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Invalid price amount.');
      return;
    }

    const updated = { ...item, name: editItemName.trim(), price: priceNum };
    storage.updateMenuItem(updated);
    setMenuItems(prev => prev.map(i => i.id === item.id ? updated : i));
    setEditingItemId(null);
  };

  const handleDeleteItem = (id: string) => {
    storage.deleteMenuItem(id);
    setMenuItems(prev => prev.filter(i => i.id !== id));
    setDeletingItemId(null);
  };

  const handleClearOrdersHistory = () => {
    if (window.confirm('Are you sure you want to delete ALL orders and sales history? This action is irreversible.')) {
      storage.clearAllOrders();
      setOrders([]);
      alert('Database cleared successfully.');
    }
  };

  const handleResetMenu = () => {
    if (window.confirm('Reset all items back to standard cafe/hotel defaults? Any custom items will be lost.')) {
      const reset = storage.resetMenuToDefault();
      setMenuItems(reset);
      alert('Menu database reset to defaults.');
    }
  };

  return (
    <div id="admin-panel-layout" className="flex-1 flex flex-col justify-between bg-[#F2F4F7] overflow-hidden">
      
      {/* -------------------- 1. HOME VIEW -------------------- */}
      {adminSubView === 'home' && (
        <div id="admin-home-view" className="flex-1 flex flex-col justify-between overflow-y-auto p-4 space-y-4">
          <div>
            {/* HERO TITLE */}
            <div className="mb-4 text-center">
              <span className="text-[10px] text-[#3B82F6] font-black uppercase tracking-widest block">ADMIN PORTAL</span>
              <h3 className="text-xl font-black text-slate-800">Store Management & Reports</h3>
            </div>

            {/* ACTION GRID NAVIGATION */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                id="admin-home-order-btn"
                onClick={onOrderPress}
                className="bg-[#3B82F6] hover:bg-blue-600 text-white p-4 rounded-[24px] flex flex-col justify-between h-28 text-left shadow-[0_8px_20px_rgba(59,130,246,0.15)] transition-all cursor-pointer border border-transparent active:scale-95"
              >
                <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
                <div>
                  <span className="text-xs font-black block">Take New Order</span>
                  <span className="text-[9px] text-white/80 font-semibold">Open Sales Cart</span>
                </div>
              </button>

              <button
                id="admin-home-history-btn"
                onClick={() => setAdminSubView('billing_history')}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 p-4 rounded-[24px] flex flex-col justify-between h-28 text-left shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <ClipboardList className="w-6 h-6 text-[#3B82F6] stroke-[2.5]" />
                <div>
                  <span className="text-xs font-black block">Billing History</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Track & Reprint bills</span>
                </div>
              </button>

              <button
                id="admin-home-hotel-btn"
                onClick={() => { setAdminSubView('hotel'); setIsAdding(false); setEditingItemId(null); setDeletingItemId(null); }}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 p-4 rounded-[24px] flex flex-col justify-between h-28 text-left shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Utensils className="w-6 h-6 text-emerald-500 stroke-[2.5]" />
                <div>
                  <span className="text-xs font-black block">Hotel Menu</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Edit meals & main items</span>
                </div>
              </button>

              <button
                id="admin-home-cafe-btn"
                onClick={() => { setAdminSubView('cafe'); setIsAdding(false); setEditingItemId(null); setDeletingItemId(null); }}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 p-4 rounded-[24px] flex flex-col justify-between h-28 text-left shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Coffee className="w-6 h-6 text-amber-500 stroke-[2.5]" />
                <div>
                  <span className="text-xs font-black block">Cafe Menu</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Edit teas, coffees & snacks</span>
                </div>
              </button>
            </div>

            {/* SALES REPORTS STATS CONTAINER */}
            <div className="space-y-3.5 mb-5">
              <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase block pl-1">SALES PERIOD REPORTS</span>
              
              <div className="grid grid-cols-1 gap-3">
                {/* DAILY SALES REPORT */}
                <div className="bg-white border border-slate-200 p-4 rounded-[24px] flex justify-between items-center shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center border border-blue-100">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-black block">DAILY SALES REPORT</span>
                      <span className="text-xs font-extrabold text-slate-700">{dailyMetrics.count} settled bills today</span>
                    </div>
                  </div>
                  <span className="text-lg font-black text-[#3B82F6] font-mono">₹{dailyMetrics.sales.toLocaleString()}</span>
                </div>

                {/* WEEKLY SALES REPORT */}
                <div className="bg-white border border-slate-200 p-4 rounded-[24px] flex justify-between items-center shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-black block">WEEKLY SALES REPORT</span>
                      <span className="text-xs font-extrabold text-slate-700">Past 7 days orders</span>
                    </div>
                  </div>
                  <span className="text-lg font-black text-emerald-600 font-mono">₹{weeklyMetrics.sales.toLocaleString()}</span>
                </div>

                {/* MONTHLY SALES REPORT */}
                <div className="bg-white border border-slate-200 p-4 rounded-[24px] flex justify-between items-center shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-black block">MONTHLY SALES REPORT</span>
                      <span className="text-xs font-extrabold text-slate-700">Past 30 days orders</span>
                    </div>
                  </div>
                  <span className="text-lg font-black text-amber-600 font-mono">₹{monthlyMetrics.sales.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* TOP ITEMS SOLD IN CAFE & HOTEL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TOP CAFE ITEMS */}
              <div className="bg-white border border-slate-200 p-4 rounded-[24px] space-y-3 shadow-xs">
                <span className="text-[10px] text-amber-600 font-black tracking-wider uppercase block">TOP ITEMS SOLD IN CAFE</span>
                {topSales.cafe.length === 0 ? (
                  <span className="text-[11px] text-slate-400 block py-2">No Cafe sales recorded yet</span>
                ) : (
                  <div className="space-y-2">
                    {topSales.cafe.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-100 last:border-0 last:pb-0">
                        <span className="font-extrabold text-slate-700 truncate max-w-[130px]">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 font-bold">x{item.quantity}</span>
                          <span className="font-black text-slate-800 font-mono text-[11px]">₹{item.revenue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TOP HOTEL ITEMS */}
              <div className="bg-white border border-slate-200 p-4 rounded-[24px] space-y-3 shadow-xs">
                <span className="text-[10px] text-emerald-600 font-black tracking-wider uppercase block">TOP ITEM SOLD IN HOTEL</span>
                {topSales.hotel.length === 0 ? (
                  <span className="text-[11px] text-slate-400 block py-2">No Hotel sales recorded yet</span>
                ) : (
                  <div className="space-y-2">
                    {topSales.hotel.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-100 last:border-0 last:pb-0">
                        <span className="font-extrabold text-slate-700 truncate max-w-[130px]">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 font-bold">x{item.quantity}</span>
                          <span className="font-black text-slate-800 font-mono text-[11px]">₹{item.revenue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* BACK TO MAIN PORTAL */}
          <div className="pt-3 border-t border-slate-200">
            <button
              id="admin-exit-home-btn"
              onClick={onGoBack}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
              BACK TO MAIN DASHBOARD
            </button>
          </div>
        </div>
      )}

      {/* -------------------- 2. HOTEL & CAFE MENU EDITORS -------------------- */}
      {(adminSubView === 'hotel' || adminSubView === 'cafe') && (
        <div id="admin-department-menu-view" className="flex-1 flex flex-col justify-between overflow-y-auto p-4 space-y-4">
          <div>
            {/* DEPARTMENT HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${adminSubView === 'hotel' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-amber-50 text-amber-500 border border-amber-100'}`}>
                  {adminSubView === 'hotel' ? <Utensils className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">MENU MANAGEMENT</span>
                  <h4 className="text-base font-black text-slate-800 capitalize">{adminSubView} Department</h4>
                </div>
              </div>

              <button
                id="reset-db-menu-btn"
                onClick={handleResetMenu}
                className="text-[9px] font-black text-slate-400 hover:text-[#3B82F6] flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg active:scale-95 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Default Menu
              </button>
            </div>

            {/* ADD ITEMS BUTTON / TRIGGER FORM */}
            <div className="mb-4">
              {!isAdding ? (
                <button
                  id="add-item-trigger-btn"
                  onClick={() => { setIsAdding(true); setNewItemName(''); setNewItemPrice(''); }}
                  className="w-full py-3 bg-white hover:bg-slate-50 text-slate-800 border-2 border-dashed border-slate-200 rounded-[20px] font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-99"
                >
                  <Plus className="w-4 h-4 text-[#3B82F6] stroke-[3]" />
                  ADD NEW {adminSubView.toUpperCase()} ITEM
                </button>
              ) : (
                <div className="bg-white border border-slate-200 p-4 rounded-[24px] space-y-3.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#3B82F6] font-black tracking-widest uppercase">ADD NEW PRODUCT SPEC</span>
                    <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <input
                      id="new-item-name-input"
                      type="text"
                      placeholder="Item Name (e.g., Idli Sambar, Special Tea)"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#3B82F6] focus:bg-white font-extrabold text-slate-700"
                    />

                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400">₹</span>
                      <input
                        id="new-item-price-input"
                        type="number"
                        placeholder="Price"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-3 py-2 text-xs focus:outline-none focus:border-[#3B82F6] focus:bg-white font-mono font-black text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      id="save-new-item-btn"
                      onClick={() => handleAddItem(adminSubView as 'hotel' | 'cafe')}
                      className="py-2.5 bg-[#3B82F6] text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 hover:bg-blue-600 cursor-pointer active:scale-95"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      Save Item
                    </button>
                    <button
                      id="cancel-new-item-btn"
                      onClick={() => setIsAdding(false)}
                      className="py-2.5 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* LIST OF ITEMS */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase block pl-1">MENU PRODUCTS LIST</span>
              
              <div className="space-y-2">
                {menuItems.filter(item => item.category === adminSubView).map(item => {
                  const isEditing = editingItemId === item.id;
                  const isDeleting = deletingItemId === item.id;

                  return (
                    <div 
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-[22px] p-3 shadow-xs transition-all"
                    >
                      {/* NORMAL MODE OR EDIT MODE OR DELETE CONFIRM MODE */}
                      {isEditing ? (
                        /* --- EDITING STATE --- */
                        <div className="space-y-2.5 p-1">
                          <span className="text-[9px] text-[#3B82F6] font-black uppercase">EDIT PRODUCT SPECS</span>
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editItemName}
                              onChange={(e) => setEditItemName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#3B82F6] focus:bg-white font-extrabold text-slate-700"
                            />
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400">₹</span>
                              <input
                                type="number"
                                value={editItemPrice}
                                onChange={(e) => setEditItemPrice(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-3 py-2 text-xs focus:outline-none focus:border-[#3B82F6] focus:bg-white font-mono font-black text-slate-800"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(item)}
                              className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-600 flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingItemId(null)}
                              className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer active:scale-95"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : isDeleting ? (
                        /* --- DELETING CONFIRMATION --- */
                        <div className="p-2 text-center bg-rose-50/50 border border-rose-100 rounded-xl space-y-2.5">
                          <p className="text-xs text-rose-700 font-extrabold">Are you sure to delete this item?</p>
                          <p className="text-[10px] text-slate-500 font-semibold truncate">"{item.name}" will be permanently removed.</p>
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg cursor-pointer active:scale-95"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingItemId(null)}
                              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-lg cursor-pointer active:scale-95"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* --- NORMAL ITEM ROW --- */
                        <div className="flex justify-between items-center">
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-extrabold text-slate-800 block truncate">{item.name}</span>
                            <span className="font-black text-[#3B82F6] font-mono text-xs block mt-0.5">₹{item.price}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-[#3B82F6] rounded-xl cursor-pointer active:scale-90 transition-all flex items-center gap-1 text-[10px] font-black"
                              title={`Edit name or price`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>

                            <button
                              onClick={() => { setDeletingItemId(item.id); setEditingItemId(null); }}
                              className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl cursor-pointer active:scale-90 transition-all flex items-center gap-1 text-[10px] font-black"
                              title={`Delete item`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* BACK TO HOME ACTION */}
          <div className="pt-3 border-t border-slate-200">
            <button
              id="admin-department-back-btn"
              onClick={() => setAdminSubView('home')}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
              BACK TO ADMIN DASHBOARD
            </button>
          </div>
        </div>
      )}

      {/* -------------------- 3. BILLING HISTORY VIEW -------------------- */}
      {adminSubView === 'billing_history' && (
        <div id="admin-history-tracker-view" className="flex-1 flex flex-col justify-between overflow-y-auto p-4 space-y-4">
          <div className="space-y-4">
            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="billing-history-search"
                type="text"
                placeholder="Search bills (e.g., #0001, Tea, Cash...)"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#3B82F6] font-bold text-slate-700 shadow-xs"
              />
            </div>

            {/* BILLS LIST */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase block pl-1">SETTLED TRANSACTION LOGS</span>
              
              {filteredOrders.length === 0 ? (
                <div className="text-center py-10 bg-white border border-slate-200 rounded-[24px]">
                  <p className="text-xs text-slate-400 font-bold">No matching bills found.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {filteredOrders.map(order => {
                    const dt = new Date(order.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });
                    const dDate = new Date(order.timestamp).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short'
                    });

                    return (
                      <div
                        id={`history-order-card-${order.id}`}
                        key={order.id}
                        className="bg-white border border-slate-200 rounded-[24px] p-3.5 space-y-2 text-xs flex flex-col justify-between shadow-xs"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-800">{order.formattedOrderNumber}</span>
                              <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${order.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : order.paymentMethod === 'UPI' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                {order.paymentMethod}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono font-bold mt-0.5 block">{dDate}, {dt} • Served by {order.servedBy === 'Worker' ? 'Employee' : order.servedBy}</span>
                          </div>
                          <span className="font-extrabold text-[#3B82F6] text-sm font-mono">₹{order.total}</span>
                        </div>

                        {/* Items */}
                        <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600 font-semibold space-y-0.5 border border-slate-100">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate pr-2">{it.name} x {it.quantity}</span>
                              <span className="shrink-0 text-slate-500 font-mono">₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* Reprint action */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            id={`reprint-bill-btn-history-${order.id}`}
                            onClick={() => onReprintOrder(order)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-black text-[#3B82F6] border border-slate-200 rounded-lg active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3 text-[#3B82F6]" />
                            REPRINT RECEIPT
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DANGER PURGE CARD */}
            <div className="bg-rose-50/50 p-4 border border-rose-100 rounded-[24px] space-y-2">
              <span className="text-[10px] text-rose-600 font-black tracking-wider uppercase block">DATABASE MAINTENANCE</span>
              <p className="text-[10px] text-slate-500 font-semibold leading-normal">Wiping the history cannot be undone. Always verify current records before running maintenance procedures.</p>
              <button
                id="wipe-db-orders-btn"
                onClick={handleClearOrdersHistory}
                className="w-full py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-700 text-[10px] font-black rounded-xl active:scale-98 transition-colors shadow-xs cursor-pointer"
              >
                WIPE ALL SYSTEM ORDERS HISTORY
              </button>
            </div>
          </div>

          {/* BACK ACTION */}
          <div className="pt-3 border-t border-slate-200">
            <button
              id="admin-history-back-btn"
              onClick={() => setAdminSubView('home')}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
              BACK TO ADMIN DASHBOARD
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
