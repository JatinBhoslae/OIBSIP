import React from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, Plus, Trash2 } from 'lucide-react';
import Button from '../../common/Button';

export default function InventoryFilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  sortBy,
  onSortChange,
  onOpenAddModal,
  selectedCount,
  onBulkDelete,
}) {
  return (
    <div className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-card space-y-4 shadow-light">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ingredient, category, or supplier..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-input pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF6B00]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category */}
          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-input px-3 py-1.5 text-xs text-neutral-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="bg-transparent focus:outline-none text-white cursor-pointer pr-2"
            >
              <option value="all" className="bg-neutral-900 text-white">All Categories</option>
              <option value="base" className="bg-neutral-900 text-white">Pizza Base</option>
              <option value="sauce" className="bg-neutral-900 text-white">Sauces</option>
              <option value="cheese" className="bg-neutral-900 text-white">Cheese</option>
              <option value="vegetable" className="bg-neutral-900 text-white">Vegetables</option>
              <option value="meat" className="bg-neutral-900 text-white">Meat</option>
              <option value="other" className="bg-neutral-900 text-white">Other</option>
            </select>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-input px-3 py-1.5 text-xs text-neutral-300">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent focus:outline-none text-white cursor-pointer pr-2"
            >
              <option value="all" className="bg-neutral-900 text-white">All Statuses</option>
              <option value="Available" className="bg-neutral-900 text-white">Available</option>
              <option value="Low Stock" className="bg-neutral-900 text-white">Low Stock</option>
              <option value="Out of Stock" className="bg-neutral-900 text-white">Out Of Stock</option>
              <option value="Inactive" className="bg-neutral-900 text-white">Inactive</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-input px-3 py-1.5 text-xs text-neutral-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent focus:outline-none text-white cursor-pointer pr-2"
            >
              <option value="newest" className="bg-neutral-900 text-white">Newest First</option>
              <option value="oldest" className="bg-neutral-900 text-white">Oldest First</option>
              <option value="alphabetical" className="bg-neutral-900 text-white">Alphabetical (A-Z)</option>
              <option value="stock" className="bg-neutral-900 text-white">Stock: High to Low</option>
              <option value="stock-low" className="bg-neutral-900 text-white">Stock: Low to High</option>
              <option value="price" className="bg-neutral-900 text-white">Price: High to Low</option>
              <option value="price-low" className="bg-neutral-900 text-white">Price: Low to High</option>
            </select>
          </div>

          {/* Actions */}
          {selectedCount > 0 ? (
            <button
              onClick={onBulkDelete}
              className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3.5 py-2 rounded-btn text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedCount})
            </button>
          ) : (
            <Button onClick={onOpenAddModal} className="py-2 text-xs">
              <Plus className="w-4 h-4" />
              Add Ingredient
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
