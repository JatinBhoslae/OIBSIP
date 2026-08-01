import React from 'react';
import { Edit2, Trash2, Eye, AlertCircle, PackageCheck, PackageX } from 'lucide-react';

export function InventoryStatusBadge({ status, isAvailable, quantity, minStock }) {
  let badgeClass = 'bg-neutral-800 text-neutral-400 border-neutral-700';
  let label = status || 'Available';

  if (!isAvailable) {
    badgeClass = 'bg-neutral-800/80 text-neutral-400 border-neutral-700';
    label = 'Inactive';
  } else if (quantity === 0) {
    badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    label = 'Out Of Stock';
  } else if (quantity <= minStock) {
    badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    label = 'Low Stock';
  } else {
    badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    label = 'Available';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export default function InventoryTable({
  ingredients,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewDetails,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-850 rounded-card p-8 text-center text-xs text-neutral-400">
        <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading inventory dataset...
      </div>
    );
  }

  if (!ingredients || ingredients.length === 0) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-850 rounded-card p-12 text-center text-neutral-400 space-y-3">
        <AlertCircle className="w-10 h-10 text-neutral-600 mx-auto" />
        <h3 className="text-sm font-bold text-white">No Inventory Ingredients Found</h3>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          No items match your search or filter parameters. Try resetting your filters or add a new ingredient.
        </p>
      </div>
    );
  }

  const allSelected = ingredients.length > 0 && selectedIds.length === ingredients.length;

  return (
    <div className="bg-neutral-900/60 border border-neutral-850 rounded-card overflow-hidden shadow-medium">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-neutral-700 bg-neutral-900 text-[#FF6B00] focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="p-4">Item</th>
              <th className="p-4">Category</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Unit</th>
              <th className="p-4">Purchase Price</th>
              <th className="p-4">Selling Price</th>
              <th className="p-4">Supplier</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-850 text-neutral-300">
            {ingredients.map((item) => {
              const isSelected = selectedIds.includes(item._id);
              const minStock = item.minimumStock || item.threshold || 10;
              const quantity = item.quantity !== undefined ? item.quantity : (item.stock || 0);

              return (
                <tr
                  key={item._id}
                  className={`hover:bg-neutral-850/40 transition-colors ${isSelected ? 'bg-[#FF6B00]/5' : ''}`}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(item._id)}
                      className="rounded border-neutral-700 bg-neutral-900 text-[#FF6B00] focus:ring-0 cursor-pointer"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=400'}
                        alt={item.name}
                        className="w-10 h-10 rounded-xl object-cover border border-neutral-800 shrink-0 bg-neutral-950"
                      />
                      <div>
                        <p className="font-bold text-white text-xs">{item.name}</p>
                        <p className="text-[10px] text-neutral-500 truncate max-w-[140px]">{item.description || 'No description'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 capitalize font-medium text-neutral-300">
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px]">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white">
                    {quantity}
                    <span className="text-[10px] text-neutral-500 font-normal ml-1">/ min {minStock}</span>
                  </td>
                  <td className="p-4 text-neutral-400">{item.unit || 'pcs'}</td>
                  <td className="p-4 font-semibold text-neutral-300">₹{item.purchasePrice || 0}</td>
                  <td className="p-4 font-semibold text-emerald-400">₹{item.price || item.sellingPrice || 0}</td>
                  <td className="p-4">
                    <p className="font-medium text-neutral-300">{item.supplierName || 'General Foods'}</p>
                    <p className="text-[10px] text-neutral-500">{item.supplierPhone || ''}</p>
                  </td>
                  <td className="p-4">
                    <InventoryStatusBadge
                      status={item.status}
                      isAvailable={item.isAvailable}
                      quantity={quantity}
                      minStock={minStock}
                    />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewDetails(item)}
                        className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-[#FF6B00] transition-colors"
                        title="Edit Ingredient"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item._id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 transition-colors"
                        title="Delete Ingredient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
