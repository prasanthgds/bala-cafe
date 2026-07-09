/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, PrinterSettings } from '../types';
import { Printer, RefreshCw, Smartphone, Check, Wifi, Info, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ReceiptPrinterProps {
  order: Order | null;
  printerSettings: PrinterSettings;
  setPrinterSettings: React.Dispatch<React.SetStateAction<PrinterSettings>>;
  onDone: () => void;
}

export default function ReceiptPrinter({
  order,
  printerSettings,
  setPrinterSettings,
  onDone
}: ReceiptPrinterProps) {
  const [isBluetoothSearching, setIsBluetoothSearching] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  // Play realistic buzzing thermal printer sound using Web Audio API
  const playPrintSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const duration = 1.6; // seconds
      const steps = 14;
      
      for (let i = 0; i < steps; i++) {
        const time = ctx.currentTime + (i * duration) / steps;
        
        // Oscillator for mechanical buzz
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110 + Math.random() * 20, time);
        
        gainNode.gain.setValueAtTime(0.05, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + 0.1);
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  const handleConnectBluetooth = () => {
    setIsBluetoothSearching(true);
    setAvailablePrinters([]);
    
    // Simulate Bluetooth discovery scan
    setTimeout(() => {
      setAvailablePrinters([
        'RP58 Handheld Thermal (58mm)',
        'MPT-II Mini Bluetooth (58mm)',
        'Epson TM-T88VI Desktop (80mm)',
        'Star Micronics TSP100 (80mm)'
      ]);
      setIsBluetoothSearching(false);
    }, 1500);
  };

  const selectPrinter = (name: string) => {
    const is80 = name.toLowerCase().includes('80mm');
    setPrinterSettings({
      isConnected: true,
      mockDeviceName: name,
      paperWidth: is80 ? '80mm' : '58mm',
      autoPrintOnCheckout: printerSettings.autoPrintOnCheckout
    });
    setAvailablePrinters([]);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    playPrintSound();
    
    // Simulate printing complete spinner
    setTimeout(() => {
      setIsPrinting(false);
      // Trigger native browser printing as well (styled specifically for receipts via print stylesheet)
      window.print();
    }, 1800);
  };

  if (!order) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-5 text-center">
        <Printer className="w-12 h-12 text-slate-600 mb-2" />
        <p className="text-sm font-semibold text-slate-400">No active receipt to print</p>
        <button
          onClick={onDone}
          className="mt-4 px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-bold rounded-lg cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const formattedDate = new Date(order.timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div id="receipt-printer-panel" className="flex-1 flex flex-col justify-between p-4 bg-[#F2F4F7] overflow-y-auto">
      
      {/* 1. BLUETOOTH CONTROL PANEL */}
      <div className="bg-white p-3.5 rounded-[24px] border border-slate-200 shrink-0 mb-4 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
        <div className="flex justify-between items-start mb-2.5">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${printerSettings.isConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-black">PRINTER CHANNEL</span>
              <h4 className="text-xs font-black text-slate-800 leading-normal">
                {printerSettings.isConnected ? printerSettings.mockDeviceName : 'Bluetooth Disconnected'}
              </h4>
            </div>
          </div>
          
          <button
            id="bt-search-btn"
            onClick={handleConnectBluetooth}
            disabled={isBluetoothSearching}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 cursor-pointer active:scale-95 disabled:opacity-40"
            title="Scan for BT printers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBluetoothSearching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Available Bluetooth Scan List */}
        {availablePrinters.length > 0 && (
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-2.5 space-y-1">
            <span className="text-[9px] text-[#3B82F6] font-black uppercase block mb-1 tracking-wider">Select Thermal Printer:</span>
            {availablePrinters.map(p => (
              <button
                key={p}
                onClick={() => selectPrinter(p)}
                className="w-full text-left p-2 hover:bg-white text-xs font-bold text-slate-700 flex items-center justify-between rounded-lg cursor-pointer border border-transparent hover:border-slate-200/60 shadow-xs"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  {p}
                </span>
                <span className="text-[9px] font-black text-[#3B82F6] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">CONNECT</span>
              </button>
            ))}
          </div>
        )}

        {/* Paper width toggler */}
        <div className="flex justify-between items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
          <span className="text-[10px] font-black text-slate-500 pl-2 uppercase tracking-wider">Format Roll</span>
          <div className="flex gap-1">
            {(['58mm', '80mm'] as const).map(width => (
              <button
                key={width}
                onClick={() => setPrinterSettings(prev => ({ ...prev, paperWidth: width }))}
                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${printerSettings.paperWidth === width ? 'bg-[#3B82F6] text-white font-black shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
              >
                {width}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. LIVE receipt PREVIEW (Simulates paper roll) */}
      <div className="flex-1 flex items-center justify-center py-2 px-1">
        <div 
          id="paper-receipt-container"
          className={`bg-white text-slate-950 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] font-mono text-left relative flex flex-col justify-between shrink-0 transition-all duration-300 border border-slate-200 rounded-lg ${printerSettings.paperWidth === '58mm' ? 'w-[250px] text-[10px]' : 'w-[320px] text-xs'}`}
        >
          {/* Top jagged cut edge simulation */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[linear-gradient(45deg,transparent_33.333%,#000_33.333%,#000_66.667%,transparent_66.667%),linear-gradient(-45deg,transparent_33.333%,#000_33.333%,#000_66.667%,transparent_66.667%)] bg-[size:6px_6px] -translate-y-1 opacity-10" />

          {/* RECEIPT HEADER */}
          <div className="text-center space-y-1">
            <h5 className="font-extrabold text-sm uppercase tracking-wide">CAFE & HOTEL DELIGHTS</h5>
            <p className="text-[9px] opacity-80 uppercase">Offline Android Mobile POS</p>
            <p className="text-[9px] opacity-75">Main Road, Junction Stop</p>
            <div className="border-b border-dashed border-slate-900/60 my-2" />
          </div>

          {/* METADATA */}
          <div className="space-y-0.5 text-[9px] opacity-90">
            <div className="flex justify-between">
              <span>ORDER: {order.formattedOrderNumber}</span>
              <span className="font-bold">{order.servedBy.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>DATE & TIME:</span>
              <span className="font-bold">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>PAY MODE:</span>
              <span className="font-black text-slate-900">{order.paymentMethod.toUpperCase()}</span>
            </div>
          </div>
          <div className="border-b border-dashed border-slate-900/60 my-2" />

          {/* ITEMS LIST TABLE */}
          <div className="space-y-1">
            <div className="flex justify-between font-bold text-[9px] opacity-75 uppercase">
              <span className="w-1/2">Item Description</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/3 text-right">Amt</span>
            </div>
            <div className="border-b border-slate-950/40 my-1" />
            
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start leading-snug">
                <span className="w-1/2 truncate font-semibold">{item.name}</span>
                <span className="w-1/6 text-center">{item.quantity}</span>
                <span className="w-1/3 text-right font-bold">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-slate-900/60 my-2.5" />

          {/* TOTALS & BREAKDOWN */}
          <div className="space-y-1">
            <div className="flex justify-between font-extrabold text-sm">
              <span>NET TOTAL:</span>
              <span>₹{order.total}</span>
            </div>
            {order.paymentMethod === 'Cash' && (
              <>
                <div className="flex justify-between text-[9px] opacity-80">
                  <span>Tendered Cash:</span>
                  <span>₹{order.tendered}</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold">
                  <span>Balance Return:</span>
                  <span>₹{order.change}</span>
                </div>
              </>
            )}
          </div>

          <div className="border-b border-dashed border-slate-900/60 my-3" />

          {/* BARCODE REPRESENTATION & FOOTER */}
          <div className="text-center space-y-1.5">
            {/* Mock Barcode pattern */}
            <div className="flex justify-center items-center h-8 gap-0.5 opacity-90 mx-auto w-4/5 select-none" aria-label="Order barcode decoration">
              {[1,3,1,2,4,1,3,2,1,2,4,1,2,1,3,2,4,1,2,1,3].map((w, index) => (
                <div key={index} className="h-full bg-slate-950" style={{ width: `${w * 1.5}px` }} />
              ))}
            </div>
            
            <p className="text-[8px] tracking-widest font-bold font-mono text-slate-800">
              *ORD{order.orderNumber.toString().padStart(6, '0')}*
            </p>
            <p className="text-[9px] font-bold uppercase tracking-tight">Thank You! Please Visit Again</p>
            <p className="text-[7px] tracking-wider text-slate-500 font-sans">Powered by Mobile POS client</p>
          </div>

          {/* Bottom jagged cut edge simulation */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[linear-gradient(45deg,transparent_33.333%,#000_33.333%,#000_66.667%,transparent_66.667%),linear-gradient(-45deg,transparent_33.333%,#000_33.333%,#000_66.667%,transparent_66.667%)] bg-[size:6px_6px] translate-y-1 rotate-180 opacity-10" />
        </div>
      </div>

      {/* 3. TRIGGER ACTION BUTTONS */}
      <div className="pt-4 border-t border-slate-200 shrink-0 space-y-2">
        <button
          id="print-action-btn"
          disabled={isPrinting}
          onClick={handlePrint}
          className="w-full py-3.5 bg-[#3B82F6] hover:bg-blue-700 active:scale-99 text-white font-black text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.2)] cursor-pointer"
        >
          {isPrinting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              PRINTING IN PROGRESS...
            </>
          ) : (
            <>
              <Printer className="w-4 h-4 text-white" />
              PRINT RECEIPT NOW
            </>
          )}
        </button>

        <button
          id="receipt-done-btn"
          onClick={onDone}
          className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 active:bg-slate-900 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          DONE / NEW ORDER
        </button>
      </div>

      {/* DETACHED SCREEN STYLE FOR PHYSICAL PRINTING SUPPORT */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #paper-receipt-container, #paper-receipt-container * {
            visibility: visible;
          }
          #paper-receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: ${printerSettings.paperWidth === '58mm' ? '58mm' : '80mm'} !important;
            box-shadow: none !important;
            border: none !important;
            padding: 2mm !important;
            margin: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}
