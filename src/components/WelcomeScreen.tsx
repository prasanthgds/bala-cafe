/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, ShieldCheck, KeyRound, ShoppingCart, Settings, Printer, History, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface WelcomeScreenProps {
  onOrderPress: () => void;
  onAdminPress: () => void;
  onHistoryPress: () => void;
  currentUser: 'Admin' | 'Worker' | null;
  setCurrentUser: (user: 'Admin' | 'Worker' | null) => void;
  todayStats: { count: number; sales: number };
  printerStatus: { isConnected: boolean; name: string };
  onPrinterSettingsPress: () => void;
}

export default function WelcomeScreen({
  onOrderPress,
  onAdminPress,
  onHistoryPress,
  currentUser,
  setCurrentUser,
  todayStats,
  printerStatus,
  onPrinterSettingsPress
}: WelcomeScreenProps) {
  const [role, setRole] = useState<'Worker' | 'Admin'>('Worker');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleKeypadPress = (val: string) => {
    setError('');
    if (val === 'C') {
      setPin('');
    } else if (val === '⌫') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 6) {
      const newPin = pin + val;
      setPin(newPin);
      
      // Auto-submit if 6 digits for Admin
      if (newPin.length === 6) {
        setTimeout(() => {
          if (newPin === '123456') {
            setCurrentUser('Admin');
            setError('');
            setPin('');
          } else {
            setError('Incorrect PIN code. Try again!');
            setPin('');
          }
        }, 150);
      }
    }
  };  return (
    <div id="welcome-container" className="flex-1 flex flex-col p-5 bg-[#F2F4F7]">
      
      {/* HEADER HERO BANNER */}
      <div className="text-center py-5">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center justify-center w-14 h-14 bg-[#3B82F6] text-white rounded-[20px] shadow-[0_8px_30px_rgba(59,130,246,0.15)] mb-3"
        >
          <ShoppingCart className="w-7 h-7" />
        </motion.div>
        <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">MOBILE POS</h2>
        <p className="text-xs text-slate-500 mt-0.5">Smart Ordering & Thermal Print System</p>
      </div>

      {!currentUser ? (
        /* LOGIN MODE */
        <div id="login-panel" className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full">
          <div>
            {/* ROLE SELECTOR */}
            <div className="bg-slate-200/60 p-1 rounded-2xl flex border border-slate-300/40 mb-5">
              <button
                id="role-worker-btn"
                onClick={() => { setRole('Worker'); setPin(''); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${role === 'Worker' ? 'bg-[#3B82F6] text-white shadow-[0_4px_12px_rgba(59,130,246,0.2)]' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <User className="w-4 h-4" />
                Employee Login
              </button>
              <button
                id="role-admin-btn"
                onClick={() => { setRole('Admin'); setPin(''); setError(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${role === 'Admin' ? 'bg-[#3B82F6] text-white shadow-[0_4px_12px_rgba(59,130,246,0.2)]' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Login
              </button>
            </div>

            {/* LOGIN INPUT / AREA */}
            {role === 'Worker' ? (
              <div className="text-center py-8">
                <button
                  id="direct-employee-login-btn"
                  onClick={() => {
                    setCurrentUser('Worker');
                    setError('');
                  }}
                  className="px-6 py-4 bg-[#3B82F6] hover:bg-blue-600 active:scale-95 text-white font-black text-sm rounded-2xl shadow-[0_8px_30px_rgba(59,130,246,0.25)] flex items-center justify-center gap-2 cursor-pointer w-full transition-all"
                >
                  <User className="w-5 h-5 text-white animate-pulse" />
                  LOG IN AS EMPLOYEE
                </button>
                <p className="text-[10px] text-slate-400 mt-3 font-semibold">No PIN code required for Employee access</p>
              </div>
            ) : (
              <div className="text-center mb-4">
                <span className="text-xs text-slate-500 block mb-2.5 font-bold">
                  Enter Admin Security PIN
                </span>
                <div className="flex justify-center gap-3 py-2">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                        i < pin.length 
                          ? 'bg-[#3B82F6] border-[#3B82F6] scale-110 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                          : 'border-slate-300 bg-white'
                      }`}
                    />
                  ))}
                </div>
                {error && (
                  <div className="text-xs text-rose-600 mt-2.5 font-semibold animate-pulse">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* TOUCH KEYPAD - ONLY FOR ADMIN */}
          {role === 'Admin' && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((char) => (
                <button
                  id={`keypad-${char === '⌫' ? 'back' : char === 'C' ? 'clear' : char}`}
                  key={char}
                  onClick={() => handleKeypadPress(char)}
                  className={`h-14 rounded-2xl text-lg font-black flex items-center justify-center transition-all cursor-pointer ${
                    char === 'C' 
                      ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 active:scale-95' 
                      : char === '⌫' 
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 border border-slate-200' 
                      : 'bg-white text-[#0F172A] border border-slate-200/80 hover:bg-slate-50 active:scale-95 shadow-[0_2px_8px_rgba(0,0,0,0.015)]'
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* LOGGED IN MAIN MENU */
        <div id="main-portal" className="flex-1 flex flex-col justify-between">
          
          {/* USER WELCOME BADGE */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-4 flex items-center justify-between mb-4 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                {currentUser === 'Admin' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                ) : (
                  <User className="w-5 h-5 text-[#3B82F6]" />
                )}
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block tracking-wider uppercase font-extrabold">
                  Logged in as
                </span>
                <span className="text-sm font-black text-[#0F172A]">
                  {currentUser === 'Admin' ? 'Store Administrator' : 'Employee Assistant'}
                </span>
              </div>
            </div>
            <button
              id="logout-btn"
              onClick={() => { setCurrentUser(null); setError(''); }}
              className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl transition-colors cursor-pointer"
            >
              Log Out
            </button>
          </div>

          {/* MAIN TOP-UP ACTION: ORDER BUTTON */}
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <div className="relative">
              {/* Outer pulsing decoration ring */}
              <div className="absolute -inset-4 rounded-full bg-[#3B82F6]/10 animate-ping duration-1000" />
              <div className="absolute -inset-2 rounded-full bg-[#3B82F6]/5" />
              
              <button
                id="big-order-btn"
                onClick={onOrderPress}
                className="relative w-44 h-44 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white font-black text-2xl flex flex-col items-center justify-center shadow-[0_15px_35px_rgba(59,130,246,0.35)] border-4 border-white active:scale-95 transition-all cursor-pointer group"
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ShoppingCart className="w-10 h-10 mb-1 group-hover:scale-110 transition-transform text-white" />
                </motion.div>
                ORDER
                <span className="text-[9px] uppercase font-bold tracking-widest text-white/80 mt-1">
                  Tap to Start
                </span>
              </button>
            </div>
          </div>

          {/* UTILITY CONTROL CARDS */}
          <div className="space-y-3">
            {/* PRINTER QUICK STATUS CARD */}
            <div 
              id="printer-quick-card"
              onClick={onPrinterSettingsPress}
              className="bg-white hover:bg-slate-50 border border-slate-200 rounded-[24px] p-4 flex items-center justify-between cursor-pointer active:scale-99 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.015)]"
            >
              <div className="flex items-center gap-2.5">
                <Printer className={`w-4 h-4 ${printerStatus.isConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs font-black text-slate-800 block">Thermal Printer Support</span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {printerStatus.isConnected ? printerStatus.name : 'Printer disconnected'}
                  </span>
                </div>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${printerStatus.isConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {printerStatus.isConnected ? 'ONLINE' : 'CONNECT'}
              </span>
            </div>

            {/* DASHBOARD ACTION BUTTONS & ADMIN SNEAK PEEK */}
            <div className="grid grid-cols-2 gap-3">
              <button
                id="welcome-history-btn"
                onClick={onHistoryPress}
                className="bg-white hover:bg-slate-50 border border-slate-200 rounded-[24px] p-4 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between h-24 shadow-[0_8px_30px_rgba(0,0,0,0.015)]"
              >
                <History className="w-4 h-4 text-[#3B82F6]" />
                <div>
                  <span className="text-xs font-black text-slate-800 block">Bills History</span>
                  <span className="text-[10px] text-slate-500 font-medium">Search & Reprint</span>
                </div>
              </button>

              {currentUser === 'Admin' ? (
                <button
                  id="welcome-admin-btn"
                  onClick={onAdminPress}
                  className="bg-white hover:bg-blue-50/20 border border-slate-200 hover:border-blue-100 rounded-[24px] p-4 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between h-24 shadow-[0_8px_30px_rgba(0,0,0,0.015)]"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <div>
                    <span className="text-xs font-black text-slate-800 block">Admin Panel</span>
                    <span className="text-[10px] text-slate-500 font-medium">Products & Reports</span>
                  </div>
                </button>
              ) : (
                <div className="bg-slate-200/40 border border-slate-300/40 rounded-[24px] p-4 text-left opacity-75 flex flex-col justify-between h-24 select-none">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-xs font-black text-slate-500 block">Admin Mode</span>
                    <span className="text-[10px] text-slate-400 font-medium">Requires Admin PIN</span>
                  </div>
                </div>
              )}
            </div>

            {/* QUICK TODAY SUMMARY */}
            <div className="bg-white rounded-[20px] p-3.5 border border-slate-200 flex justify-between items-center text-xs text-slate-600 font-sans shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
              <span className="flex items-center gap-1.5 font-bold text-slate-600">
                Today's Orders: <strong className="text-slate-900 font-mono font-black">{todayStats.count}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-600">
                Sales: <strong className="text-[#3B82F6] font-mono font-black">₹{todayStats.sales.toLocaleString()}</strong>
              </span>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
