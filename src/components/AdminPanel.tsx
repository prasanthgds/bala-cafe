/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MenuItem, Order, SalesReport } from '../types';
import { storage } from '../lib/storage';
import { Plus, Trash2, Edit3, Check, Search, Calendar, Landmark, Coins, TrendingUp, RefreshCw, Layers, ClipboardList, Database, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminPanelProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onGoBack: () => void;
  onReprintOrder: (order: Order) => void;
}

type AdminTab = 'menu' | 'report' | 'history';

export default function AdminPanel({
  menuItems,
  setMenuItems,
  orders,
  setOrders,
  onGoBack,
  onReprintOrder
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('menu');

  // --- MENU MANAGER STATE ---
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'cafe' | 'hotel'>('cafe');
  const [menuSearch, setMenuSearch] = useState('');

  // --- REPORT STATE ---
  const [reportDate, setReportDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // --- HISTORY SEARCH STATE ---
  const [historySearch, setHistorySearch] = useState('');

  // --- DERIVED METRICS ---
  const report: SalesReport = useMemo(() => {
    return storage.getSalesReport(reportDate);
  }, [orders, reportDate, menuItems]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(menuSearch.toLowerCase())
    );
  }, [menuItems, menuSearch]);

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

  // --- HANDLERS ---
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
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
      category: newItemCategory
    });

    setMenuItems(prev => [...prev, added]);
    setNewItemName('');
    setNewItemPrice('');
    alert(`"${added.name}" added successfully to ${added.category}!`);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from menu?`)) {
      storage.deleteMenuItem(id);
      setMenuItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const startEditingPrice = (item: MenuItem) => {
    setEditingItemId(item.id);
    setEditingPrice(item.price.toString());
  };

  const saveEditedPrice = (item: MenuItem) => {
    const priceNum = parseFloat(editingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Invalid price amount.');
      return;
    }
    const updated = { ...item, price: priceNum };
    storage.updateMenuItem(updated);
    setMenuItems(prev => prev.map(i => i.id === item.id ? updated : i));
    setEditingItemId(null);
  };

  const handleResetMenu = () => {
    if (window.confirm('Reset all items back to standard cafe/hotel defaults? Any custom items will be lost.')) {
      const reset = storage.resetMenuToDefault();
      setMenuItems(reset);
    }
  };

  const handleClearOrdersHistory = () => {
    if (window.confirm('CRITICAL ACTION: Are you sure you want to delete ALL orders and sales history? This action is irreversible.')) {
      storage.clearAllOrders();
      setOrders([]);
      alert('Orders database cleared successfully.');
    }
  };

  return (
    <div id="admin-panel-layout" className="flex-1 flex flex-col justify-between bg-[#F2F4F7]">
      
      {/* ADMIN PANEL NAVIGATION TABS */}
      <div className="bg-slate-200/60 p-1 flex shrink-0 z-10 rounded-2xl mx-4 mt-4 mb-2 border border-slate-300/40">
        {(['menu', 'report', 'history'] as AdminTab[]).map(tab => (
          <button
            key={tab}
            id={`admin-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === tab ? 'bg-[#3B82F6] text-white shadow-[0_4px_12px_rgba(59,130,246,0.2)]' : 'text-slate-500 hover:text-slate-850'}`}
          >
            {tab === 'menu' && <Layers className="w-3.5 h-3.5" />}
            {tab === 'report' && <TrendingUp className="w-3.5 h-3.5" />}
            {tab === 'history' && <ClipboardList className="w-3.5 h-3.5" />}
            {tab === 'menu' ? 'Menu Editor' : tab === 'report' ? 'Sales Report' : 'Bills Tracker'}
          </button>
        ))}
      </div>

      {/* ACTIVE TAB CONTENT WINDOW */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* 1. MENU EDITOR PANEL */}
        {activeTab === 'menu' && (
          <div id="tab-menu-editor" className="space-y-4">
            
            {/* ADD ITEM CARD FORM */}
            <form onSubmit={handleAddItem} className="bg-white p-4 rounded-[24px] border border-slate-200/80 space-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
              <span className="text-[9px] text-[#3B82F6] font-black uppercase block tracking-widest">ADD NEW PRODUCT</span>
              
              <div className="space-y-2.5">
                <input
                  id="admin-add-name"
                  type="text"
                  placeholder="Item Name (e.g. Special Ginger Tea)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#3B82F6] focus:bg-white font-bold"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">₹</span>
                    <input
                      id="admin-add-price"
                      type="number"
                      step="any"
                      placeholder="Price"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-3 py-2 text-xs focus:outline-none focus:border-[#3B82F6] focus:bg-white font-extrabold font-mono text-slate-800"
                    />
                  </div>

                  <select
                    id="admin-add-category"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as 'cafe' | 'hotel')}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#3B82F6] focus:bg-white font-extrabold text-slate-700"
                  >
                    <option value="cafe">☕ CAFE DEPT</option>
                    <option value="hotel">🍛 HOTEL DEPT</option>
                  </select>
                </div>
              </div>

              <button
                id="admin-add-item-btn"
                type="submit"
                className="w-full py-2.5 bg-[#3B82F6] hover:bg-blue-700 active:scale-97 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(59,130,246,0.2)] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                ADD PRODUCT TO DATABASE
              </button>
            </form>

            {/* SEARCH AND CONTROL OPTIONS */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                <input
                  id="admin-menu-search"
                  type="text"
                  placeholder="Search products in list..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#3B82F6] font-bold text-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.01)]"
                />
              </div>
              <button
                id="admin-reset-defaults-btn"
                onClick={handleResetMenu}
                className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-slate-400 hover:text-[#3B82F6] shadow-[0_4px_12px_rgba(0,0,0,0.01)]"
                title="Reset to default menus"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* MENU ITEMS LIST */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase block pl-1 tracking-widest">MENU ITEMS ({filteredMenuItems.length})</span>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredMenuItems.map(item => (
                  <div
                    id={`menu-editor-item-${item.id}`}
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-[18px] p-3 flex justify-between items-center text-xs shadow-[0_4px_10px_rgba(0,0,0,0.01)]"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${item.category === 'cafe' ? 'bg-blue-50 text-[#3B82F6] border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {item.category}
                        </span>
                        <h5 className="font-extrabold text-slate-800 truncate">{item.name}</h5>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {editingItemId === item.id ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-slate-400 text-xs">₹</span>
                          <input
                            id={`edit-price-input-${item.id}`}
                            type="number"
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(e.target.value)}
                            className="w-16 bg-slate-50 border border-[#3B82F6] rounded-lg px-1.5 py-1 text-xs text-center text-[#3B82F6] font-bold font-mono focus:outline-none"
                            autoFocus
                          />
                          <button
                            id={`save-price-btn-${item.id}`}
                            onClick={() => saveEditedPrice(item)}
                            className="p-1.5 bg-emerald-500 text-white rounded-lg cursor-pointer hover:bg-emerald-600 active:scale-90"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#3B82F6] font-mono">₹{item.price}</span>
                          <button
                            id={`edit-price-trigger-${item.id}`}
                            onClick={() => startEditingPrice(item)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 cursor-pointer active:scale-90"
                            aria-label={`Edit ${item.name} price`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <button
                        id={`delete-item-btn-${item.id}`}
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-lg cursor-pointer active:scale-90"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 2. DALY SALES REPORT PANEL */}
        {activeTab === 'report' && (
          <div id="tab-sales-report" className="space-y-4">
            
            {/* DATE CONTROLLER */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-3.5 flex justify-between items-center shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#3B82F6]" />
                Select Sales Date:
              </span>
              <input
                id="report-date-picker"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#3B82F6] cursor-pointer"
              />
            </div>

            {/* HIGH LEVEL METRIC CARDS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-[24px] border border-slate-200/80 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Total Sales Amount</span>
                <span className="text-xl font-black text-[#3B82F6] font-mono mt-1">₹{report.totalSales.toLocaleString()}</span>
              </div>
              <div className="bg-white p-4 rounded-[24px] border border-slate-200/80 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Receipts Settled</span>
                <span className="text-xl font-black text-slate-800 font-mono mt-1">{report.totalOrders} Bills</span>
              </div>
            </div>

            {/* REVENUE CATEGORY SPLIT */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-4 space-y-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">DEPARTMENT REVENUE SHARE</span>
              
              <div className="space-y-2">
                {/* Cafe bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-700 font-bold mb-1">
                    <span className="flex items-center gap-1">☕ Cafe Share</span>
                    <span className="font-mono font-black text-[#3B82F6]">₹{report.categoryBreakdown.cafe.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 border border-slate-200 overflow-hidden">
                    <div 
                      className="bg-[#3B82F6] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${report.totalSales > 0 ? (report.categoryBreakdown.cafe / report.totalSales) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Hotel bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-700 font-bold mb-1">
                    <span className="flex items-center gap-1">🍛 Hotel Share</span>
                    <span className="font-mono font-black text-emerald-600">₹{report.categoryBreakdown.hotel.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 border border-slate-200 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${report.totalSales > 0 ? (report.categoryBreakdown.hotel / report.totalSales) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT TYPE PIE/BAR CHART SPLIT */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-4 space-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">PAYMENT SETTLEMENT TYPES</span>
              
              <div className="space-y-2.5">
                {(['Cash', 'UPI', 'Card'] as const).map(type => {
                  const val = report.paymentMethods[type];
                  const pct = report.totalSales > 0 ? (val / report.totalSales) * 100 : 0;
                  const color = type === 'Cash' ? 'bg-emerald-500' : type === 'UPI' ? 'bg-sky-500' : 'bg-indigo-500';
                  
                  return (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 w-16">
                        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                        <span className="font-bold text-slate-700">{type}</span>
                      </div>
                      <div className="flex-1 mx-3 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                        <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono font-bold text-slate-800 min-w-16 text-right">
                        ₹{val.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LEADERBOARD: TOP SELLING ITEMS */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-4 space-y-2 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">TOP 5 DEMAND PRODUCTS</span>
              
              {report.topItems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No item sales records for this date.</p>
              ) : (
                <div className="space-y-1.5 pt-1">
                  {report.topItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black w-4 text-[#3B82F6]">#{index + 1}</span>
                        <span className="font-black text-slate-800">{item.name}</span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className="text-[10px] text-slate-500 font-medium">x{item.quantity} units</span>
                        <span className="font-bold font-mono text-emerald-600">₹{item.revenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 3. PAST RECEIPTS HISTORY TRACKER */}
        {activeTab === 'history' && (
          <div id="tab-bills-tracker" className="space-y-4">
            
            {/* SEARCH BAR */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="bills-tracker-search"
                type="text"
                placeholder="Search bills (e.g., #0001, Tea, Cash...)"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#3B82F6] font-bold text-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.01)]"
              />
            </div>

            {/* ORDERS ACCORDION LIST */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase block pl-1 tracking-wider">SETTLED BILLS ({filteredOrders.length})</span>
              
              {filteredOrders.length === 0 ? (
                <div className="text-center py-10 bg-white border border-slate-200 rounded-[24px] shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
                  <p className="text-xs text-slate-400">No settled bills matching criteria.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
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
                        id={`past-bill-card-${order.id}`}
                        key={order.id}
                        className="bg-white border border-slate-200 rounded-[24px] p-3.5 space-y-2 text-xs flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.015)]"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-800">{order.formattedOrderNumber}</span>
                              <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${order.paymentMethod === 'Cash' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : order.paymentMethod === 'UPI' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                {order.paymentMethod}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono font-medium mt-0.5 block">{dDate}, {dt} • Served by {order.servedBy}</span>
                          </div>
                          <span className="font-extrabold text-[#3B82F6] text-sm font-mono">₹{order.total}</span>
                        </div>

                        {/* Order Items */}
                        <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600 font-medium space-y-0.5 border border-slate-100">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate pr-2">{it.name} x {it.quantity}</span>
                              <span className="shrink-0 text-slate-500 font-mono">₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            id={`reprint-bill-btn-${order.id}`}
                            onClick={() => onReprintOrder(order)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-black text-[#3B82F6] hover:text-blue-700 border border-slate-200 rounded-lg active:scale-95 cursor-pointer flex items-center gap-1 transition-all"
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

            {/* CRITICAL DATA OPERATION CARD */}
            <div className="bg-rose-50/50 p-4 rounded-[24px] border border-rose-100 space-y-2.5 shadow-sm">
              <span className="text-[10px] text-rose-600 font-black tracking-wider uppercase block flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                DANGER MAINTENANCE ZONE
              </span>
              <p className="text-[10px] text-slate-500 font-medium">These actions directly erase database files in offline localStorage memory. Double-check before wiping records.</p>
              
              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  id="admin-clear-history-btn"
                  onClick={handleClearOrdersHistory}
                  className="py-2.5 bg-rose-50 hover:bg-rose-100/60 active:scale-98 border border-rose-200 text-rose-600 text-[10px] font-black tracking-wider rounded-xl cursor-pointer"
                >
                  WIPE ALL BILLS & SALES HISTORY
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ADMIN CONTROL BACK BUTTON */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <button
          id="admin-exit-btn"
          onClick={onGoBack}
          className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 active:bg-slate-900 text-white font-black text-xs rounded-xl border border-slate-900 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition-colors"
        >
          Exit Admin Dashboard
        </button>
      </div>

    </div>
  );
}
