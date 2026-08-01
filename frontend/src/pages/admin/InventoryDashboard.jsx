import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import InventoryStatsCards from '../../components/admin/inventory/InventoryStatsCards';
import InventoryFilterBar from '../../components/admin/inventory/InventoryFilterBar';
import InventoryTable from '../../components/admin/inventory/InventoryTable';
import IngredientModal from '../../components/admin/inventory/IngredientModal';
import IngredientDetailsModal from '../../components/admin/inventory/IngredientDetailsModal';
import DeleteConfirmModal from '../../components/admin/inventory/DeleteConfirmModal';
import api from '../../utils/api';
import { ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import Button from '../../components/common/Button';

export default function InventoryDashboard() {
  const [ingredients, setIngredients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters, Search, Sort & Pagination State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1 });

  // Checkboxes & Multi-select State
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals State
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewingIngredient, setViewingIngredient] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Toast message state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [search, category, status, sortBy, page]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/admin/inventory/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch inventory stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/inventory', {
        params: { search, category, status, sortBy, page, limit: 10 },
      });
      if (res.data.success) {
        setIngredients(res.data.ingredients);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch inventory dataset', err);
    } finally {
      setLoading(false);
    }
  };

  // Selection Logic
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === ingredients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ingredients.map((i) => i._id));
    }
  };

  // Create or Edit Handler
  const handleOpenAdd = () => {
    setEditingIngredient(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (ingredient) => {
    setEditingIngredient(ingredient);
    setIsAddEditModalOpen(true);
  };

  const handleSaveIngredient = async (formData) => {
    setActionLoading(true);
    try {
      if (editingIngredient) {
        await api.put(`/admin/inventory/${editingIngredient._id}`, formData);
        showToast('Ingredient updated successfully!');
      } else {
        await api.post('/admin/inventory', formData);
        showToast('New ingredient added to inventory!');
      }
      setIsAddEditModalOpen(false);
      fetchInventory();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save ingredient', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // View Details
  const handleViewDetails = (ingredient) => {
    setViewingIngredient(ingredient);
    setIsDetailsModalOpen(true);
  };

  // Single Delete
  const handleOpenDelete = (id) => {
    setDeletingId(id);
    setIsBulkDelete(false);
    setIsDeleteModalOpen(true);
  };

  // Bulk Delete
  const handleOpenBulkDelete = () => {
    setIsBulkDelete(true);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setActionLoading(true);
    try {
      if (isBulkDelete) {
        await api.delete('/admin/inventory/bulk-delete', {
          data: { ids: selectedIds },
        });
        showToast(`Successfully deleted ${selectedIds.length} ingredients`);
        setSelectedIds([]);
      } else {
        await api.delete(`/admin/inventory/${deletingId}`);
        showToast('Ingredient deleted successfully');
      }
      setIsDeleteModalOpen(false);
      fetchInventory();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete ingredient', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 text-left">
        {/* Toast Alert */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-large text-xs font-semibold text-white transition-all ${
              toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.message}
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-xs text-neutral-400">
              Manage ingredient stocks, suppliers, minimum limits, and pricing.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              fetchInventory();
              fetchStats();
            }}
            className="py-2 text-xs self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </Button>
        </div>

        {/* Statistics Cards */}
        <InventoryStatsCards stats={stats} loading={statsLoading} />

        {/* Search, Filters, & Toolbar */}
        <InventoryFilterBar
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          category={category}
          onCategoryChange={(val) => {
            setCategory(val);
            setPage(1);
          }}
          status={status}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          sortBy={sortBy}
          onSortChange={(val) => setSortBy(val)}
          onOpenAddModal={handleOpenAdd}
          selectedCount={selectedIds.length}
          onBulkDelete={handleOpenBulkDelete}
        />

        {/* Inventory Data Table */}
        <InventoryTable
          ingredients={ingredients}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onViewDetails={handleViewDetails}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
        />

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-850 p-4 rounded-card text-xs">
            <p className="text-neutral-400">
              Showing <span className="font-bold text-white">{ingredients.length}</span> of{' '}
              <span className="font-bold text-white">{pagination.totalItems}</span> ingredients
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 font-semibold">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <IngredientModal
          isOpen={isAddEditModalOpen}
          onClose={() => setIsAddEditModalOpen(false)}
          onSubmit={handleSaveIngredient}
          ingredient={editingIngredient}
          loading={actionLoading}
        />

        <IngredientDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          ingredient={viewingIngredient}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          count={isBulkDelete ? selectedIds.length : 1}
          loading={actionLoading}
        />
      </div>
    </AdminLayout>
  );
}
