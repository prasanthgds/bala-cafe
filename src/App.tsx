/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import AndroidFrame from './components/AndroidFrame';
import WelcomeScreen from './components/WelcomeScreen';
import OrderScreen from './components/OrderScreen';
import CheckoutModal from './components/CheckoutModal';
import ReceiptPrinter from './components/ReceiptPrinter';
import AdminPanel from './components/AdminPanel';
import { storage } from './lib/storage';
import { MenuItem, Order, CartItem, PrinterSettings } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // --- CORE SYSTEM STATES ---
  const [currentUser, setCurrentUser] = useState<'Admin' | 'Worker' | null>(null);
  
  // Navigation Screens: 'welcome' | 'order' | 'print' | 'admin'
  const [activeScreen, setActiveScreen] = useState<'welcome' | 'order' | 'print' | 'admin'>('welcome');
  
  // Menu database state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // Order history database state
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Current active ordering cart
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Currently displaying receipt in print module
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  
  // Checkout slider sheet toggler
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Printer Bluetooth configurations
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(() => storage.getPrinterSettings());

  // --- INITIALIZE OFFLINE DATABASES ---
  useEffect(() => {
    setMenuItems(storage.getMenuItems());
    setOrders(storage.getOrders());
  }, []);

  // Save printer settings upon update
  useEffect(() => {
    storage.savePrinterSettings(printerSettings);
  }, [printerSettings]);

  // --- COMPUTED REAL-TIME METRICS ---
  const todayStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const report = storage.getSalesReport(todayStr);
    return {
      count: report.totalOrders,
      sales: report.totalSales
    };
  }, [orders]);

  // Total cart pricing calculation
  const cartTotal = useMemo(() => {
    return cart.reduce((tot, item) => tot + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  // --- BUSINESS LOGIC FLOW HANDLERS ---
  
  const handleOpenOrdering = () => {
    setActiveScreen('order');
  };

  const handleOpenAdmin = () => {
    if (currentUser === 'Admin') {
      setActiveScreen('admin');
    } else {
      alert('Access Denied. Please log in as Administrator.');
    }
  };

  const handleOpenPrinterSettings = () => {
    // Open print view directly with mock connect prompts
    if (orders.length > 0) {
      setActiveOrder(orders[0]); // Load most recent bill as template
    } else {
      // Create empty/dummy template order if database is completely empty
      const dummyOrder: Order = {
        id: 'dummy',
        orderNumber: 0,
        formattedOrderNumber: '#0000',
        timestamp: new Date().toISOString(),
        items: [{ id: 'dummy_it', name: 'Standard Product (Template)', price: 0, quantity: 1 }],
        total: 0,
        tendered: 0,
        change: 0,
        paymentMethod: 'Cash',
        servedBy: 'Worker'
      };
      setActiveOrder(dummyOrder);
    }
    setActiveScreen('print');
  };

  const handleCheckoutConfirm = (paymentMethod: 'Cash' | 'Card' | 'UPI', tendered: number, change: number) => {
    if (cart.length === 0) return;

    // Compile items list structure
    const orderItems = cart.map(c => ({
      id: c.menuItem.id,
      name: c.menuItem.name,
      price: c.menuItem.price,
      quantity: c.quantity
    }));

    // Package order structure
    const newOrderPayload = {
      timestamp: new Date().toISOString(),
      items: orderItems,
      total: cartTotal,
      tendered: paymentMethod === 'Cash' ? tendered : cartTotal,
      change: paymentMethod === 'Cash' ? change : 0,
      paymentMethod,
      servedBy: currentUser || 'Worker'
    };

    // Save order sequentially and fetch complete model
    const savedOrder = storage.saveOrder(newOrderPayload);

    // Update list state
    setOrders(prev => [savedOrder, ...prev]);
    
    // Set checkout print target
    setActiveOrder(savedOrder);
    
    // Clear ordering cart
    setCart([]);
    setIsCheckoutOpen(false);

    // Navigate to printer
    setActiveScreen('print');
  };

  const handleReprintOrder = (historicOrder: Order) => {
    setActiveOrder(historicOrder);
    setActiveScreen('print');
  };

  const handleBackToDashboard = () => {
    setActiveScreen('welcome');
  };

  // Screen header title calculation
  const screenTitle = useMemo(() => {
    switch (activeScreen) {
      case 'welcome':
        return currentUser ? 'Dashboard' : 'Welcome Login';
      case 'order':
        return 'Create Order';
      case 'print':
        return 'Thermal Printer';
      case 'admin':
        return 'Supervisor Portal';
      default:
        return 'Mobile POS';
    }
  }, [activeScreen, currentUser]);

  return (
    <AndroidFrame
      title={screenTitle}
      showBackBtn={activeScreen !== 'welcome'}
      onBackPress={activeScreen !== 'welcome' ? handleBackToDashboard : undefined}
      onHomePress={currentUser ? handleBackToDashboard : undefined}
    >
      <div className="flex-1 flex flex-col relative h-full">
        <AnimatePresence mode="wait">
          {activeScreen === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <WelcomeScreen
                onOrderPress={handleOpenOrdering}
                onAdminPress={handleOpenAdmin}
                onHistoryPress={() => setActiveScreen('admin')} // Links to past bills
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                todayStats={todayStats}
                printerStatus={{ isConnected: printerSettings.isConnected, name: printerSettings.mockDeviceName }}
                onPrinterSettingsPress={handleOpenPrinterSettings}
              />
            </motion.div>
          )}

          {activeScreen === 'order' && (
            <motion.div
              key="order"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <OrderScreen
                menuItems={menuItems}
                cart={cart}
                setCart={setCart}
                onCheckoutPress={() => setIsCheckoutOpen(true)}
                onGoBack={handleBackToDashboard}
              />
            </motion.div>
          )}

          {activeScreen === 'print' && (
            <motion.div
              key="print"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              <ReceiptPrinter
                order={activeOrder}
                printerSettings={printerSettings}
                setPrinterSettings={setPrinterSettings}
                onDone={() => {
                  setActiveOrder(null);
                  setActiveScreen('welcome');
                }}
              />
            </motion.div>
          )}

          {activeScreen === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <AdminPanel
                menuItems={menuItems}
                setMenuItems={setMenuItems}
                orders={orders}
                setOrders={setOrders}
                onGoBack={handleBackToDashboard}
                onReprintOrder={handleReprintOrder}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* RECEIVE PAYMENT CHECKOUT MODAL SHEET */}
        <AnimatePresence>
          {isCheckoutOpen && (
            <CheckoutModal
              total={cartTotal}
              onConfirm={handleCheckoutConfirm}
              onCancel={() => setIsCheckoutOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </AndroidFrame>
  );
}
