/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Battery, Signal, ArrowLeft, Home, Square } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  onBackPress?: () => void;
  onHomePress?: () => void;
  title?: string;
  showBackBtn?: boolean;
}

export default function AndroidFrame({
  children,
  onBackPress,
  onHomePress,
  title = 'Mobile POS',
  showBackBtn = false
}: AndroidFrameProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="android-device-wrapper" className="min-h-screen bg-[#0F172A] flex items-center justify-center p-0 md:p-6 select-none font-sans overflow-hidden">
      {/* Outer Phone Shell - Only visible on desktop/md+ viewports */}
      <div 
        id="phone-shell" 
        className="relative w-full h-screen md:h-[840px] md:w-[412px] md:rounded-[42px] md:border-[10px] md:border-[#1E293B] bg-[#F2F4F7] md:shadow-[0_25px_60px_-15px_rgba(15,23,42,0.55)] flex flex-col overflow-hidden transition-all duration-300"
      >
        {/* Mock Notch / Camera pill for desktop view */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-[#1E293B] rounded-b-2xl z-50 pointer-events-none" />

        {/* Mock Status Bar */}
        <div className="bg-[#0F172A] text-white/90 px-5 pt-4 pb-1.5 flex justify-between items-center text-xs font-semibold z-40 select-none border-b border-slate-800/30">
          <span className="font-medium tracking-tight">{time}</span>
          <div className="flex items-center gap-1.5 opacity-90">
            <Signal className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 rotate-0" />
          </div>
        </div>

        {/* Dynamic App Header */}
        <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0 z-40">
          <div className="flex items-center gap-3">
            {showBackBtn && onBackPress ? (
              <button 
                id="header-back-btn"
                onClick={onBackPress}
                className="p-1.5 hover:bg-slate-800 active:bg-slate-700 rounded-full transition-colors cursor-pointer"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-[#3B82F6]" />
              </button>
            ) : (
              <div className="w-1.5 h-7 bg-[#3B82F6] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            )}
            <h1 className="font-extrabold tracking-tight text-base text-slate-100">{title}</h1>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-white/90 border border-white/15 shadow-[0_1px_5px_rgba(255,255,255,0.05)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              OFFLINE OK
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#F2F4F7] text-[#1A1C1E] flex flex-col relative">
          {children}
        </div>

        {/* Mock Android Navigation Bar */}
        <div className="bg-[#0F172A] py-3.5 flex justify-around items-center border-t border-slate-800/40 shrink-0 z-40">
          <button 
            id="nav-back-btn"
            onClick={onBackPress} 
            disabled={!onBackPress}
            className={`p-2 rounded-full transition-all ${onBackPress ? 'text-slate-400 hover:bg-slate-800 active:text-white active:scale-95 cursor-pointer' : 'text-slate-700 cursor-not-allowed'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button 
            id="nav-home-btn"
            onClick={onHomePress}
            disabled={!onHomePress}
            className={`p-2 rounded-full transition-all ${onHomePress ? 'text-[#3B82F6] hover:bg-slate-800 active:scale-95 cursor-pointer' : 'text-slate-700 cursor-not-allowed'}`}
          >
            <Home className="w-5 h-5" />
          </button>
          <button 
            id="nav-recents-btn"
            className="p-2 text-slate-700 rounded-full cursor-not-allowed"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
