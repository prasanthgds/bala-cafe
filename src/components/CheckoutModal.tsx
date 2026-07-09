/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wallet, Landmark, QrCode, Coins, ArrowRight, X, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface CheckoutModalProps {
  total: number;
  onConfirm: (paymentMethod: 'Cash' | 'Card' | 'UPI', tendered: number, change: number) => void;
  onCancel: () => void;
}

export default function CheckoutModal({
  total,
  onConfirm,
  onCancel
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('Cash');
  const [tenderedStr, setTenderedStr] = useState('');
  
  const tendered = parseFloat(tenderedStr) || 0;
  const change = Math.max(0, tendered - total);
  const isTenderedSufficient = tendered >= total || paymentMethod !== 'Cash';

  // Set default tendered for card/UPI to exact total, but empty for cash so they can enter it
  useEffect(() => {
    if (paymentMethod !== 'Cash') {
      setTenderedStr(total.toString());
    } else {
      setTenderedStr('');
    }
  }, [paymentMethod, total]);

  const handleShortcut = (amount: number) => {
    setPaymentMethod('Cash');
    setTenderedStr(amount.toString());
  };

  const handleKeypad = (char: string) => {
    if (paymentMethod !== 'Cash') {
      setPaymentMethod('Cash');
      setTenderedStr('');
    }
    
    if (char === 'C') {
      setTenderedStr('');
    } else if (char === '⌫') {
      setTenderedStr(prev => prev.slice(0, -1));
    } else if (char === '.') {
      if (!tenderedStr.includes('.')) {
        setTenderedStr(prev => prev + '.');
      }
    } else {
      setTenderedStr(prev => prev + char);
    }
  };

  const handleQuickAdd = (amount: number) => {
    setPaymentMethod('Cash');
    const current = parseFloat(tenderedStr) || 0;
    setTenderedStr((current + amount).toString());
  };

  return (
    <div id="checkout-overlay" className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
      <motion.div
        id="checkout-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-[#F2F4F7] border-t border-slate-200 rounded-t-[32px] p-5 flex flex-col max-h-[92%] overflow-y-auto shadow-[0_-15px_40px_rgba(0,0,0,0.08)]"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#3B82F6]" />
            <h3 className="text-base font-black text-slate-800">Receive Amount</h3>
          </div>
          <button
            id="checkout-close-btn"
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRICE DISPLAY */}
        <div className="py-4 flex justify-between items-center">
          <div className="text-left">
            <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">Total Amount Due</span>
            <span className="text-3xl font-black text-slate-800 block font-mono">₹{total.toLocaleString()}</span>
          </div>

          <div className="text-right">
            <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">Change Due</span>
            <span className={`text-2xl font-black block font-mono ${change > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
              ₹{paymentMethod === 'Cash' ? change.toLocaleString() : '0'}
            </span>
          </div>
        </div>

        {/* PAYMENT METHOD SELECTOR */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            id="pay-method-cash"
            onClick={() => setPaymentMethod('Cash')}
            className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${paymentMethod === 'Cash' ? 'bg-[#3B82F6] text-white border-[#3B82F6] font-black shadow-[0_4px_12px_rgba(59,130,246,0.2)] scale-102' : 'bg-white text-slate-500 border-slate-250 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <Wallet className="w-4 h-4" />
            <span className="text-[10px] font-black">CASH</span>
          </button>

          <button
            id="pay-method-upi"
            onClick={() => setPaymentMethod('UPI')}
            className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${paymentMethod === 'UPI' ? 'bg-[#3B82F6] text-white border-[#3B82F6] font-black shadow-[0_4px_12px_rgba(59,130,246,0.2)] scale-102' : 'bg-white text-slate-500 border-slate-250 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <QrCode className="w-4 h-4" />
            <span className="text-[10px] font-black">UPI / QR</span>
          </button>

          <button
            id="pay-method-card"
            onClick={() => setPaymentMethod('Card')}
            className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${paymentMethod === 'Card' ? 'bg-[#3B82F6] text-white border-[#3B82F6] font-black shadow-[0_4px_12px_rgba(59,130,246,0.2)] scale-102' : 'bg-white text-slate-500 border-slate-250 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <Landmark className="w-4 h-4" />
            <span className="text-[10px] font-black">CARD</span>
          </button>
        </div>

        {paymentMethod === 'Cash' ? (
          /* CASH KEYPAD & SHORTCUTS */
          <div className="space-y-3">
            {/* TENDERED DISPLAY */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-right relative flex items-center justify-between shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase absolute left-3">Received</span>
              <input
                id="tendered-input"
                type="text"
                readOnly
                value={tenderedStr ? `₹${tenderedStr}` : '₹0'}
                className="w-full bg-transparent text-right font-mono text-2xl font-black text-[#3B82F6] focus:outline-none"
              />
            </div>

            {/* CURRENCY SHORTCUTS */}
            <div>
              <span className="text-[9px] text-slate-400 font-extrabold tracking-wide block mb-1">CASH SHORTCUTS</span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  id="shortcut-exact"
                  onClick={() => handleShortcut(total)}
                  className="py-2 text-[10px] font-black bg-white text-[#3B82F6] border border-slate-250 hover:border-slate-350 rounded-lg active:scale-95 cursor-pointer shadow-xs"
                >
                  Exact (₹{total})
                </button>
                {[50, 100, 500].map((amt) => (
                  <button
                    id={`shortcut-${amt}`}
                    key={amt}
                    disabled={amt < total}
                    onClick={() => handleShortcut(amt)}
                    className={`py-2 text-[10px] font-black rounded-lg active:scale-95 cursor-pointer shadow-xs ${amt >= total ? 'bg-white text-slate-700 border border-slate-250 hover:bg-slate-50' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-40'}`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                {[10, 20, 100].map((addAmt) => (
                  <button
                    id={`shortcut-add-${addAmt}`}
                    key={addAmt}
                    onClick={() => handleQuickAdd(addAmt)}
                    className="py-1.5 text-[10px] font-extrabold bg-white text-slate-600 hover:text-slate-800 border border-slate-250 hover:border-slate-300 rounded-lg active:scale-95 cursor-pointer shadow-xs"
                  >
                    + ₹{addAmt}
                  </button>
                ))}
              </div>
            </div>

            {/* TOUCH KEYPAD */}
            <div className="grid grid-cols-4 gap-2">
              {['1', '2', '3', '⌫', '4', '5', '6', 'C', '7', '8', '9', '.', '0', '00'].map((char) => {
                const isSpecial = char === '⌫' || char === 'C';
                return (
                  <button
                    id={`checkout-keypad-${char === '⌫' ? 'back' : char === 'C' ? 'clear' : char}`}
                    key={char}
                    onClick={() => handleKeypad(char)}
                    className={`h-11 rounded-xl text-sm font-black flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-xs ${isSpecial ? 'bg-white text-rose-500 border border-slate-250 hover:bg-rose-50/20' : 'bg-white text-slate-700 border border-slate-250 hover:bg-slate-50'}`}
                  >
                    {char}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* DIGITAL METHOD INFOGRAPHIC */
          <div className="bg-white p-6 rounded-[24px] border border-slate-200 text-center py-10 my-4 flex flex-col items-center gap-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm animate-pulse">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">Instant Digital Payment</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto font-bold leading-normal">
                Customer will pay complete amount of <strong className="text-[#3B82F6]">₹{total}</strong> using {paymentMethod === 'UPI' ? 'UPI Mobile App or Dynamic QR code scanner' : 'Card Swipe Terminal'}.
              </p>
            </div>
          </div>
        )}

        {/* BOTTOM CONFIRMATION TRIGGER */}
        <div className="pt-4 border-t border-slate-200 mt-4 flex items-center gap-2">
          <button
            id="checkout-cancel-btn"
            onClick={onCancel}
            className="px-4 py-3 text-xs font-black text-slate-500 bg-white border border-slate-250 rounded-xl active:scale-95 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors shrink-0 shadow-xs"
          >
            Cancel
          </button>
          
          <button
            id="checkout-confirm-btn"
            disabled={!isTenderedSufficient}
            onClick={() => onConfirm(paymentMethod, tendered, change)}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-99 transition-all cursor-pointer ${isTenderedSufficient ? 'bg-[#3B82F6] hover:bg-blue-700 text-white shadow-[0_4px_15px_rgba(59,130,246,0.2)]' : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'}`}
          >
            CONFIRM & PRINT RECEIPT
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {paymentMethod === 'Cash' && !isTenderedSufficient && (
          <p className="text-[10px] text-rose-500 font-extrabold text-center mt-2">
            Insufficient Amount! Tendered amount must be greater than or equal to ₹{total}.
          </p>
        )}
      </motion.div>
    </div>
  );
}
