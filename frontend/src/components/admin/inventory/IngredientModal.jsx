import React, { useState, useEffect } from 'react';
import { X, Upload, Package, DollarSign, UserCheck, Image as ImageIcon } from 'lucide-react';
import Button from '../../common/Button';
import Input from '../../common/Input';

export default function IngredientModal({
  isOpen,
  onClose,
  onSubmit,
  ingredient,
  loading,
}) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'vegetable',
    description: '',
    image: '',
    unit: 'pcs',
    price: 20,
    purchasePrice: 10,
    quantity: 100,
    minimumStock: 15,
    maximumStock: 500,
    supplierName: 'Fresh Veggies Co.',
    supplierPhone: '+91 98765 43210',
    supplierEmail: 'supplier@freshveggies.com',
    isAvailable: true,
  });

  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name || '',
        category: ingredient.category || 'vegetable',
        description: ingredient.description || '',
        image: ingredient.image || '',
        unit: ingredient.unit || 'pcs',
        price: ingredient.price !== undefined ? ingredient.price : (ingredient.sellingPrice || 0),
        purchasePrice: ingredient.purchasePrice || 0,
        quantity: ingredient.quantity !== undefined ? ingredient.quantity : (ingredient.stock || 0),
        minimumStock: ingredient.minimumStock || ingredient.threshold || 10,
        maximumStock: ingredient.maximumStock || 500,
        supplierName: ingredient.supplierName || 'General Foods',
        supplierPhone: ingredient.supplierPhone || '',
        supplierEmail: ingredient.supplierEmail || '',
        isAvailable: ingredient.isAvailable !== undefined ? ingredient.isAvailable : true,
      });
      setImagePreview(ingredient.image || '');
    } else {
      setFormData({
        name: '',
        category: 'vegetable',
        description: '',
        image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=400',
        unit: 'pcs',
        price: 20,
        purchasePrice: 10,
        quantity: 100,
        minimumStock: 15,
        maximumStock: 500,
        supplierName: 'Fresh Veggies Co.',
        supplierPhone: '+91 98765 43210',
        supplierEmail: 'supplier@freshveggies.com',
        isAvailable: true,
      });
      setImagePreview('https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=400');
    }
    setFormErrors({});
  }, [ingredient, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'image') {
      setImagePreview(value);
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Ingredient name is required';
    if (!formData.category) errors.category = 'Category is required';
    if (formData.price < 0) errors.price = 'Selling price cannot be negative';
    if (formData.quantity < 0) errors.quantity = 'Stock quantity cannot be negative';
    if (formData.minimumStock < 0) errors.minimumStock = 'Minimum stock cannot be negative';
    if (Number(formData.maximumStock) < Number(formData.minimumStock)) {
      errors.maximumStock = 'Maximum stock must be ≥ Minimum stock';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      price: Number(formData.price),
      purchasePrice: Number(formData.purchasePrice),
      quantity: Number(formData.quantity),
      minimumStock: Number(formData.minimumStock),
      maximumStock: Number(formData.maximumStock),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-card w-full max-w-2xl overflow-hidden shadow-large my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00]">
              <Package className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-white">
              {ingredient ? 'Edit Inventory Ingredient' : 'Add New Ingredient'}
            </h2>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left text-xs">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Ingredient Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Black Olives"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-input px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6B00]"
              />
              {formErrors.name && <p className="text-[11px] text-rose-400 font-medium">{formErrors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-input px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6B00] cursor-pointer"
              >
                <option value="base">Pizza Base</option>
                <option value="sauce">Sauce</option>
                <option value="cheese">Cheese</option>
                <option value="vegetable">Vegetable</option>
                <option value="meat">Meat</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Image URL & Preview */}
          <div className="space-y-2 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#FF6B00]" /> Image URL
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://cloudinary.com/your-image.jpg"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-input px-3.5 py-2 text-white focus:outline-none focus:border-[#FF6B00]"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-10 h-10 rounded-xl object-cover border border-neutral-700 bg-black shrink-0"
                />
              )}
            </div>
          </div>

          {/* Pricing & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Selling Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-input px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Purchase Cost (₹)</label>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                min="0"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-input px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Measurement Unit</label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="pcs, kg, g, ml"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-input px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>

          {/* Stock Quantities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Current Stock *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-input px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Minimum Alert Limit</label>
              <input
                type="number"
                name="minimumStock"
                value={formData.minimumStock}
                onChange={handleChange}
                min="0"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-input px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-300">Max Storage Capacity</label>
              <input
                type="number"
                name="maximumStock"
                value={formData.maximumStock}
                onChange={handleChange}
                min="0"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-input px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6B00]"
              />
              {formErrors.maximumStock && <p className="text-[11px] text-rose-400">{formErrors.maximumStock}</p>}
            </div>
          </div>

          {/* Supplier Details */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
            <p className="font-bold text-white text-xs flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#FF6B00]" /> Supplier Metadata
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                name="supplierName"
                value={formData.supplierName}
                onChange={handleChange}
                placeholder="Supplier Name"
                className="bg-neutral-900 border border-neutral-800 rounded-input px-3 py-2 text-white focus:outline-none focus:border-[#FF6B00]"
              />
              <input
                type="text"
                name="supplierPhone"
                value={formData.supplierPhone}
                onChange={handleChange}
                placeholder="Supplier Phone"
                className="bg-neutral-900 border border-neutral-800 rounded-input px-3 py-2 text-white focus:outline-none focus:border-[#FF6B00]"
              />
              <input
                type="email"
                name="supplierEmail"
                value={formData.supplierEmail}
                onChange={handleChange}
                placeholder="Supplier Email"
                className="bg-neutral-900 border border-neutral-800 rounded-input px-3 py-2 text-white focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="isAvailable"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleChange}
              className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-[#FF6B00] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="isAvailable" className="text-xs font-semibold text-neutral-300 cursor-pointer">
              Active Ingredient (Available in Storefront Pizza Customizer)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <Button type="button" variant="secondary" onClick={onClose} className="py-2.5">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="py-2.5">
              {loading ? 'Saving...' : ingredient ? 'Save Changes' : 'Create Ingredient'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
