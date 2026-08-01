import React from 'react';
import { X, Package, Truck, Calendar, Tag, ShieldCheck, DollarSign } from 'lucide-react';
import { InventoryStatusBadge } from './InventoryTable';

export default function IngredientDetailsModal({ isOpen, onClose, ingredient }) {
  if (!isOpen || !ingredient) return null;

  const minStock = ingredient.minimumStock || ingredient.threshold || 10;
  const quantity = ingredient.quantity !== undefined ? ingredient.quantity : (ingredient.stock || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-card w-full max-w-lg overflow-hidden shadow-large my-8 text-left text-xs">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-3">
            <img
              src={ingredient.image || 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=400'}
              alt={ingredient.name}
              className="w-10 h-10 rounded-xl object-cover border border-neutral-800 bg-neutral-950"
            />
            <div>
              <h2 className="text-sm font-bold text-white">{ingredient.name}</h2>
              <p className="text-[10px] text-[#FF6B00] uppercase font-semibold tracking-wider">
                Category: {ingredient.category}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status & Quick Stats */}
          <div className="flex items-center justify-between bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <div>
              <p className="text-neutral-400 text-[11px]">Availability Status</p>
              <div className="mt-1">
                <InventoryStatusBadge
                  status={ingredient.status}
                  isAvailable={ingredient.isAvailable}
                  quantity={quantity}
                  minStock={minStock}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-neutral-400 text-[11px]">Current Stock</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {quantity} <span className="text-xs font-normal text-neutral-500">{ingredient.unit || 'pcs'}</span>
              </p>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
              <p className="text-neutral-400 text-[11px]">Purchase Price</p>
              <p className="text-sm font-bold text-white mt-0.5">₹{ingredient.purchasePrice || 0}</p>
            </div>
            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
              <p className="text-neutral-400 text-[11px]">Selling / Customizer Price</p>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">₹{ingredient.price || ingredient.sellingPrice || 0}</p>
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
              <p className="text-neutral-400 text-[11px]">Minimum Stock Alert Limit</p>
              <p className="text-sm font-bold text-amber-400 mt-0.5">{minStock} {ingredient.unit || 'pcs'}</p>
            </div>
            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
              <p className="text-neutral-400 text-[11px]">Max Storage Capacity</p>
              <p className="text-sm font-bold text-sky-400 mt-0.5">{ingredient.maximumStock || 500} {ingredient.unit || 'pcs'}</p>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
            <p className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Truck className="w-4 h-4 text-[#FF6B00]" /> Supplier Information
            </p>
            <div className="space-y-1 text-neutral-300">
              <p><span className="text-neutral-500">Name:</span> {ingredient.supplierName || 'N/A'}</p>
              <p><span className="text-neutral-500">Phone:</span> {ingredient.supplierPhone || 'N/A'}</p>
              <p><span className="text-neutral-500">Email:</span> {ingredient.supplierEmail || 'N/A'}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-2 border-t border-neutral-800">
            <span>Last Restocked: {ingredient.lastRestocked ? new Date(ingredient.lastRestocked).toLocaleDateString() : 'N/A'}</span>
            <span>Created: {new Date(ingredient.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
