import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import api from '../../utils/api';
import { Save, ShieldAlert, Wifi, Globe, Clock } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function AdminSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Settings Fields
  const [storeName, setStoreName] = useState('PizzaHub HQ Delhi');
  const [storeStatus, setStoreStatus] = useState('OPEN');
  const [deliveryBaseFee, setDeliveryBaseFee] = useState(40);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(500);
  const [lowStockAlertLimit, setLowStockAlertLimit] = useState(10);
  const [gstPercentage, setGstPercentage] = useState(5);
  const [loyaltyMultiplier, setLoyaltyMultiplier] = useState(1);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success && res.data.data) {
        const s = res.data.data;
        setStoreName(s.storeName || 'PizzaHub HQ Delhi');
        setStoreStatus(s.storeStatus || 'OPEN');
        setDeliveryBaseFee(s.deliveryBaseFee || 40);
        setFreeDeliveryThreshold(s.freeDeliveryThreshold || 500);
        setLowStockAlertLimit(s.lowStockAlertLimit || 10);
        setGstPercentage(s.gstPercentage || 5);
        setLoyaltyMultiplier(s.loyaltyMultiplier || 1);
      }
    } catch (err) {
      console.warn('Backend custom settings schema uninitialized, using defaults');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      storeName,
      storeStatus,
      deliveryBaseFee: Number(deliveryBaseFee),
      freeDeliveryThreshold: Number(freeDeliveryThreshold),
      lowStockAlertLimit: Number(lowStockAlertLimit),
      gstPercentage: Number(gstPercentage),
      loyaltyMultiplier: Number(loyaltyMultiplier),
    };

    try {
      await api.post('/admin/settings', payload);
      alert('Settings updated successfully');
    } catch (err) {
      // Direct local simulation override if settings endpoint is unmounted
      localStorage.setItem('pizzahub_admin_settings', JSON.stringify(payload));
      alert('Settings updated locally (Mock override)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-6 md:p-8 space-y-6 max-w-4xl w-full mx-auto text-left">
          <div>
            <h2 className="text-xl font-black">System Settings</h2>
            <p className="text-xs text-neutral-400">Configure global parameters, pricing rates, and business logic thresholds</p>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Box 1: Store Operations */}
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-4">
                <h3 className="font-bold text-xs flex items-center gap-2 border-b border-neutral-850 pb-2 uppercase tracking-wider text-neutral-400">
                  <Clock className="w-4 h-4 text-[#FF6B00]" /> Store Operations
                </h3>
                <Input label="Store Display Name" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-neutral-400">Status</label>
                  <select value={storeStatus} onChange={(e) => setStoreStatus(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white">
                    <option value="OPEN">Open (Accepting Orders)</option>
                    <option value="BUSY">Busy (Higher Delivery Times)</option>
                    <option value="CLOSED">Closed (Catalog View Only)</option>
                  </select>
                </div>
              </div>

              {/* Box 2: Pricing & Logistics */}
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-4">
                <h3 className="font-bold text-xs flex items-center gap-2 border-b border-neutral-850 pb-2 uppercase tracking-wider text-neutral-400">
                  <Globe className="w-4 h-4 text-[#FF6B00]" /> Logistics & Financials
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Base Delivery Fee (₹)" type="number" value={deliveryBaseFee} onChange={(e) => setDeliveryBaseFee(e.target.value)} required />
                  <Input label="Free Delivery Above (₹)" type="number" value={freeDeliveryThreshold} onChange={(e) => setFreeDeliveryThreshold(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="GST Tax Rate (%)" type="number" value={gstPercentage} onChange={(e) => setGstPercentage(e.target.value)} required />
                  <Input label="Loyalty Multiplier" type="number" value={loyaltyMultiplier} onChange={(e) => setLoyaltyMultiplier(e.target.value)} required />
                </div>
              </div>

              {/* Box 3: Safety & Thresholds */}
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-4 md:col-span-2">
                <h3 className="font-bold text-xs flex items-center gap-2 border-b border-neutral-850 pb-2 uppercase tracking-wider text-neutral-400">
                  <ShieldAlert className="w-4 h-4 text-[#FF6B00]" /> Alerts & Threshold Limits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Low Stock Warning Limit" type="number" value={lowStockAlertLimit} onChange={(e) => setLowStockAlertLimit(e.target.value)} required />
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 text-[10px] text-neutral-500 flex items-center gap-2.5">
                    <Wifi className="w-8 h-8 text-[#FF6B00] shrink-0 animate-pulse" />
                    <p>Alert warnings are checked hourly by the inventory monitor scheduler. Dispatches email warnings for ingredients below this limit.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-850 flex justify-end">
                  <Button type="submit" disabled={saving} className="py-2.5 px-6 text-xs flex items-center gap-2 font-bold">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </div>

            </form>
          )}
        </main>
      </div>
    </div>
  );
}
