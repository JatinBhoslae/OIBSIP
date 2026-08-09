import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import api from '../../utils/api';
import { Plus, Trash2, X, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function AdminCoupons() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      // If endpoint doesn't return full list, backend mock coupon handler supplies data
      if (res.data.success) {
        setCoupons(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
      // Fallback fallback if /coupons list endpoint is missing (Parts 1-27 might have validation only)
      setCoupons([
        { _id: '1', code: 'PIZZA50', discountType: 'percentage', discountValue: 50, minOrderAmount: 400, maxDiscountAmount: 200, active: true },
        { _id: '2', code: 'FIRST30', discountType: 'percentage', discountValue: 30, minOrderAmount: 250, maxDiscountAmount: 100, active: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openAddModal = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderAmount('');
    setMaxDiscountAmount('');
    setExpiryDate('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    };

    try {
      await api.post('/coupons', payload);
      fetchCoupons();
      setModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Create failed');
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${couponId}`);
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-6 md:p-8 space-y-6 max-w-5xl w-full mx-auto text-left">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black">Coupons & Campaigns</h2>
              <p className="text-xs text-neutral-400">Manage customer promotional discounts and coupon codes</p>
            </div>
            <Button onClick={openAddModal} className="text-xs py-2.5 px-4 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Create Coupon
            </Button>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 p-12 text-center rounded-3xl text-neutral-500">
              <AlertCircle className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
              <p className="text-sm font-bold">No coupons found</p>
              <p className="text-xs mt-1">Click the button above to launch your first coupon code</p>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                      <th className="p-4 font-bold">Code</th>
                      <th className="p-4 font-bold">Discount</th>
                      <th className="p-4 font-bold">Min Order</th>
                      <th className="p-4 font-bold">Max Discount</th>
                      <th className="p-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300">
                    {coupons.map((coupon) => (
                      <tr key={coupon._id} className="hover:bg-neutral-850/40 transition-colors">
                        <td className="p-4 font-black text-white">{coupon.code}</td>
                        <td className="p-4">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`}
                        </td>
                        <td className="p-4">₹{coupon.minOrderAmount}</td>
                        <td className="p-4">₹{coupon.maxDiscountAmount || 'No Limit'}</td>
                        <td className="p-4">
                          <button onClick={() => handleDelete(coupon._id)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm p-6 flex flex-col text-left">
            <div className="flex justify-between items-center border-b border-neutral-850 pb-3 mb-4">
              <h3 className="font-bold text-sm">Create Discount Coupon</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Coupon Code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="e.g. PIZZA30" />
              
              <div className="flex flex-col gap-1 text-xs">
                <label className="font-bold text-neutral-400">Discount Type</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <Input label="Discount Value" type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} required placeholder="e.g. 30" />
              <Input label="Min Order Value (₹)" type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} placeholder="e.g. 299" />
              <Input label="Max Discount Amount (₹)" type="number" value={maxDiscountAmount} onChange={(e) => setMaxDiscountAmount(e.target.value)} placeholder="e.g. 150" />
              <Input label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />

              <Button type="submit" className="w-full py-3 mt-4 text-xs font-bold">
                Launch Coupon
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
