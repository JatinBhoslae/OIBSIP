import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import api from '../../utils/api';
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function AdminPizzas() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPizza, setEditingPizza] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [category, setCategory] = useState('Veg');
  const [image, setImage] = useState('');
  const [sizePrices, setSizePrices] = useState({ Small: '', Medium: '', Large: '' });

  const fetchPizzas = async () => {
    try {
      const res = await api.get('/pizzas');
      if (res.data.success) {
        setPizzas(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching pizzas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPizzas();
  }, []);

  const openAddModal = () => {
    setEditingPizza(null);
    setName('');
    setDescription('');
    setBasePrice('');
    setCategory('Veg');
    setImage('');
    setSizePrices({ Small: '', Medium: '', Large: '' });
    setModalOpen(true);
  };

  const openEditModal = (pizza) => {
    setEditingPizza(pizza);
    setName(pizza.name);
    setDescription(pizza.description);
    setBasePrice(pizza.price || '');
    setCategory(pizza.category || 'Veg');
    setImage(pizza.image || '');
    setSizePrices({
      Small: pizza.prices?.Small || '',
      Medium: pizza.prices?.Medium || '',
      Large: pizza.prices?.Large || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      description,
      price: Number(basePrice),
      category,
      image,
      prices: {
        Small: Number(sizePrices.Small) || Number(basePrice),
        Medium: Number(sizePrices.Medium) || Number(basePrice) * 1.3,
        Large: Number(sizePrices.Large) || Number(basePrice) * 1.6,
      },
    };

    try {
      if (editingPizza) {
        // Edit API endpoint (assumes PUT /pizzas/:id)
        await api.put(`/pizzas/${editingPizza._id}`, payload);
      } else {
        // Add API endpoint (assumes POST /pizzas)
        await api.post('/pizzas', payload);
      }
      fetchPizzas();
      setModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (pizzaId) => {
    if (!window.confirm('Are you sure you want to delete this pizza?')) return;
    try {
      await api.delete(`/pizzas/${pizzaId}`);
      fetchPizzas();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto text-left">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black">Pizza Catalog Manager</h2>
              <p className="text-xs text-neutral-400">Configure base items, sizes, and pricing structures</p>
            </div>
            <Button onClick={openAddModal} className="text-xs py-2.5 px-4 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add New Pizza
            </Button>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pizzas.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 p-12 text-center rounded-3xl text-neutral-500">
              <AlertCircle className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
              <p className="text-sm font-bold">No pizzas found</p>
              <p className="text-xs mt-1">Click the button above to add your first menu item</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pizzas.map((pizza) => (
                <div key={pizza._id} className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden flex flex-col">
                  <div className="h-40 bg-neutral-950 relative">
                    {pizza.image ? (
                      <img src={pizza.image} alt={pizza.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🍕</div>
                    )}
                    <span className={`absolute top-3 left-3 text-[9px] font-black px-2.5 py-1 rounded-full uppercase ${pizza.category === 'Non-Veg' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {pizza.category || 'Veg'}
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="font-bold text-white text-sm">{pizza.name}</h4>
                      <p className="text-neutral-500 text-[10px] mt-1 leading-relaxed line-clamp-2">{pizza.description}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-neutral-850">
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase">Base Price</span>
                        <p className="text-sm font-black text-[#FF6B00]">₹{pizza.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(pizza)} className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(pizza._id)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 flex flex-col text-left">
            <div className="flex justify-between items-center border-b border-neutral-850 pb-3 mb-4">
              <h3 className="font-bold text-sm">{editingPizza ? 'Edit Pizza Product' : 'Add New Pizza Product'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Pizza Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Pepperoni Burst" />
              <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Description of toppings and base style" />
              <Input label="Base Price (₹)" type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required placeholder="e.g. 299" />
              
              <div className="flex flex-col gap-1 text-xs">
                <label className="font-bold text-neutral-400">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white">
                  <option value="Veg">Vegetarian</option>
                  <option value="Non-Veg">Non-Vegetarian</option>
                </select>
              </div>

              <Input label="Cloudinary Image URL" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://res.cloudinary.com/..." />

              <div className="space-y-2 border-t border-neutral-850 pt-3">
                <h4 className="text-[10px] text-neutral-400 uppercase font-black">Size Pricing Overrides</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Small" type="number" value={sizePrices.Small} onChange={(e) => setSizePrices({ ...sizePrices, Small: e.target.value })} placeholder="₹" />
                  <Input label="Medium" type="number" value={sizePrices.Medium} onChange={(e) => setSizePrices({ ...sizePrices, Medium: e.target.value })} placeholder="₹" />
                  <Input label="Large" type="number" value={sizePrices.Large} onChange={(e) => setSizePrices({ ...sizePrices, Large: e.target.value })} placeholder="₹" />
                </div>
              </div>

              <Button type="submit" className="w-full py-3 mt-4 text-xs font-bold">
                {editingPizza ? 'Save Changes' : 'Create Pizza'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
