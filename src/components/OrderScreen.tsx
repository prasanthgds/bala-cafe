/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MenuItem, CartItem } from '../types';
import { Coffee, Utensils, Search, ShoppingBag, Plus, Minus, Trash2, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderScreenProps {
  menuItems: MenuItem[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onCheckoutPress: () => void;
  onGoBack: () => void;
}

export default function OrderScreen({
  menuItems,
  cart,
  setCart,
  onCheckoutPress,
  onGoBack
}: OrderScreenProps) {
  // Two active sub-categories: "cafe" or "hotel" (initialized to null to let the user select between the two big buttons first as requested!)
  // User: "when i touch the button order it need to open a two icons named cafe and hotel"
  const [selectedCategory, setSelectedCategory] = useState<'cafe' | 'hotel' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  const filteredItems = useMemo(() => {
    if (!selectedCategory) return [];
    return menuItems.filter(
      item => 
        item.category === selectedCategory && 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuItems, selectedCategory, searchQuery]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string, decreaseOnly = false) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === itemId);
      if (!existing) return prev;
      
      if (decreaseOnly && existing.quantity > 1) {
        return prev.map(i => i.menuItem.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.menuItem.id !== itemId);
    });
  };

  const getQuantityInCart = (itemId: string) => {
    const item = cart.find(i => i.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const clearCart = () => {
    setCart([]);
  };

  const shouldShowBottomBar = selectedCategory !== null || totalItemsCount > 0;

  return (
    <div id="ordering-layout" className="flex-1 flex flex-col justify-between bg-[#F2F4F7] relative h-full overflow-hidden">
      
      {/* 1. INITIAL CATEGORY SELECTOR (CAFE vs HOTEL) */}
      {!selectedCategory ? (
        <div id="category-selector-gate" className="flex-1 flex flex-col justify-center items-center px-6 py-8 pb-32">
          <p className="text-xs font-extrabold tracking-widest text-slate-500 uppercase mb-8">
            Select Order Department
          </p>
          <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
            {/* CAFE LAUNCHER */}
            <button
              id="category-btn-cafe"
              onClick={() => setSelectedCategory('cafe')}
              className="bg-white border border-slate-200 hover:border-[#3B82F6]/40 hover:bg-blue-50/10 p-6 rounded-[28px] flex flex-col items-center justify-center gap-4 transition-all duration-300 active:scale-95 shadow-[0_8px_30px_rgba(0,0,0,0.015)] group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] group-hover:bg-[#3B82F6] group-hover:text-white transition-all duration-300">
                <Coffee className="w-8 h-8" />
              </div>
              <div className="text-center">
                <span className="text-base font-black text-slate-800 block group-hover:text-[#3B82F6] transition-colors">CAFE</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Tea, Coffee & Snacks</span>
              </div>
            </button>

            {/* HOTEL LAUNCHER */}
            <button
              id="category-btn-hotel"
              onClick={() => setSelectedCategory('hotel')}
              className="bg-white border border-slate-200 hover:border-emerald-500/40 hover:bg-emerald-50/10 p-6 rounded-[28px] flex flex-col items-center justify-center gap-4 transition-all duration-300 active:scale-95 shadow-[0_8px_30px_rgba(0,0,0,0.015)] group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <Utensils className="w-8 h-8" />
              </div>
              <div className="text-center">
                <span className="text-base font-black text-slate-800 block group-hover:text-emerald-500 transition-colors">HOTEL</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">South & North Meals</span>
              </div>
            </button>
          </div>

          <button
            id="back-welcome-btn"
            onClick={onGoBack}
            className="mt-12 text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-200 bg-white px-4 py-2 rounded-full cursor-pointer shadow-sm hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#3B82F6]" />
            Back to Dashboard
          </button>
        </div>
      ) : (
        /* 2. PRODUCT SELECTOR VIEW (SELECTED CAFE or HOTEL) */
        <div id="menu-items-view" className="flex-1 flex flex-col h-full overflow-hidden">
          
          {/* TOP DEPARTMENT SELECTOR MINI BAR */}
          <div className="bg-white p-2.5 flex justify-between items-center border-b border-slate-200 shrink-0">
            <div className="flex gap-1.5 p-0.5 bg-slate-100 rounded-xl border border-slate-200">
              <button
                id="mini-btn-cafe"
                onClick={() => { setSelectedCategory('cafe'); setSearchQuery(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${selectedCategory === 'cafe' ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Coffee className="w-3.5 h-3.5" />
                Cafe
              </button>
              <button
                id="mini-btn-hotel"
                onClick={() => { setSelectedCategory('hotel'); setSearchQuery(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${selectedCategory === 'hotel' ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Utensils className="w-3.5 h-3.5" />
                Hotel
              </button>
            </div>
            
            <button
              id="back-category-gate-btn"
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-[#3B82F6] font-black hover:text-blue-700 cursor-pointer flex items-center gap-1 bg-[#3B82F6]/5 hover:bg-[#3B82F6]/10 px-3 py-1.5 rounded-xl border border-[#3B82F6]/15"
            >
              Change Department
            </button>
          </div>

          {/* SEARCH BAR */}
          <div className="p-3 bg-white shrink-0 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="menu-search-input"
                type="text"
                placeholder={`Search ${selectedCategory === 'cafe' ? 'Cafe items (Tea, Coffee...)' : 'Hotel meals...'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-slate-800 text-xs py-2.5 pl-9 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#3B82F6] focus:bg-white transition-all font-bold placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-black"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* PRODUCT GRID CONTAINER */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-32">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-500 font-bold">No items found matching "{searchQuery}"</p>
                <p className="text-xs text-slate-400 mt-1">Check search query or add items in Admin Panel.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredItems.map(item => {
                  const qty = getQuantityInCart(item.id);
                  return (
                    <motion.div
                      id={`product-card-${item.id}`}
                      key={item.id}
                      layoutId={`product-${item.id}`}
                      className={`p-3.5 rounded-[22px] flex flex-col justify-between h-[120px] border transition-all shadow-[0_4px_12px_rgba(0,0,0,0.01)] ${qty > 0 ? 'bg-blue-50/40 border-[#3B82F6] shadow-[0_4px_15px_rgba(59,130,246,0.04)]' : 'bg-white border-slate-200 hover:bg-slate-50/50'}`}
                    >
                      <div>
                        <span className="text-[9px] text-slate-400 block font-extrabold uppercase tracking-widest">
                          {item.category}
                        </span>
                        <h4 className="text-xs font-black text-slate-800 mt-0.5 line-clamp-2 leading-snug">
                          {item.name}
                        </h4>
                      </div>

                      <div className="flex items-end justify-between mt-2">
                        <span className="text-sm font-extrabold text-[#3B82F6] font-mono">
                          ₹{item.price}
                        </span>

                        {qty === 0 ? (
                          <button
                            id={`add-to-cart-btn-${item.id}`}
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 rounded-xl bg-[#3B82F6] text-white flex items-center justify-center font-bold shadow-sm cursor-pointer hover:bg-blue-700 active:scale-90 transition-all"
                            aria-label={`Add ${item.name} to order`}
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                            <button
                              id={`decrease-cart-btn-${item.id}`}
                              onClick={() => removeFromCart(item.id, true)}
                              className="w-7 h-7 rounded-lg bg-white text-slate-600 flex items-center justify-center cursor-pointer border border-slate-200/50 hover:bg-slate-50 active:scale-90"
                              aria-label={`Decrease ${item.name} quantity`}
                            >
                              <Minus className="w-3 h-3 stroke-[2.5]" />
                            </button>
                            <span className="text-xs font-black text-[#3B82F6] font-mono min-w-4 text-center">
                              {qty}
                            </span>
                            <button
                              id={`increase-cart-btn-${item.id}`}
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center cursor-pointer hover:bg-blue-700 active:scale-90"
                              aria-label={`Increase ${item.name} quantity`}
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. DYNAMIC BOTTOM CART DRAWER & ACTION SECTION */}
      {shouldShowBottomBar && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-[0_-10px_30px_rgba(15,23,42,0.04)]">
          
          {/* COLLAPSIBLE CART SUMMARY SECTION */}
          {totalItemsCount > 0 && (
            <div className="border-b border-slate-100">
              {/* Header toggle for drawer */}
              <div
                id="cart-drawer-toggle"
                onClick={() => setIsCartExpanded(!isCartExpanded)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-slate-500 hover:text-slate-800 transition-colors cursor-pointer select-none"
              >
                <span className="text-xs font-black flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#3B82F6]" />
                  Selected Items ({totalItemsCount})
                </span>
                <div className="flex items-center gap-3">
                  <button
                    id="clear-cart-text-btn"
                    onClick={(e) => { e.stopPropagation(); clearCart(); }}
                    className="text-[9px] text-rose-600 hover:text-rose-700 font-extrabold tracking-wider uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-100 cursor-pointer"
                  >
                    Clear All
                  </button>
                  {isCartExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4 animate-bounce" />
                  )}
                </div>
              </div>

              {/* Cart list drawer expanded */}
              <AnimatePresence>
                {isCartExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-[#F8FAFC] max-h-52 overflow-y-auto"
                  >
                    <div className="p-3 space-y-1.5">
                      {cart.map((item) => (
                        <div 
                          id={`cart-row-${item.menuItem.id}`}
                          key={item.menuItem.id} 
                          className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100/80"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <span className="font-extrabold text-slate-800 block truncate">{item.menuItem.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono font-medium">
                              ₹{item.menuItem.price} x {item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black font-mono text-[#3B82F6] min-w-12 text-right">
                              ₹{item.menuItem.price * item.quantity}
                            </span>
                            <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 scale-90">
                              <button
                                id={`cart-drawer-dec-${item.menuItem.id}`}
                                onClick={() => removeFromCart(item.menuItem.id, true)}
                                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-1 text-[11px] font-black text-slate-800">{item.quantity}</span>
                              <button
                                id={`cart-drawer-inc-${item.menuItem.id}`}
                                onClick={() => addToCart(item.menuItem)}
                                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              id={`cart-drawer-del-${item.menuItem.id}`}
                              onClick={() => removeFromCart(item.menuItem.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer ml-1"
                              aria-label={`Delete ${item.menuItem.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ACTION FOOTER BAR */}
          <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
            {/* Back out button */}
            <button
              id="order-exit-btn"
              onClick={() => selectedCategory ? setSelectedCategory(null) : onGoBack()}
              className="px-4 py-3 text-xs font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:text-slate-800 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
            >
              Exit
            </button>

            {/* Total checkout trigger */}
            <button
              id="order-checkout-btn"
              disabled={totalItemsCount === 0}
              onClick={onCheckoutPress}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-xs tracking-wide flex items-center justify-between shadow-sm active:scale-99 transition-all cursor-pointer ${totalItemsCount > 0 ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white hover:from-blue-700 hover:to-blue-600 shadow-[0_4px_20px_rgba(59,130,246,0.25)]' : 'bg-slate-100 text-slate-400 border border-slate-200/80 cursor-not-allowed'}`}
            >
              <span className="flex items-center gap-1.5 font-black">
                <ShoppingBag className="w-4 h-4" />
                CHECKOUT & PRINT
              </span>
              <span className="font-mono text-sm bg-[#0F172A] text-white px-2.5 py-1 rounded-lg font-black border border-white/10 shadow-[0_0_8px_rgba(255,255,255,0.05)]">
                ₹{cartTotal.toLocaleString()}
              </span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
