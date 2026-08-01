import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { ChevronRight, RotateCcw, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/common/Button';

const STEPS = [
  { id: 'size', label: 'Size' },
  { id: 'crust', label: 'Crust' },
  { id: 'sauce', label: 'Sauce' },
  { id: 'cheese', label: 'Cheese' },
  { id: 'veggies', label: 'Veggies' },
  { id: 'meat', label: 'Meat' },
];

export default function PizzaBuilder() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState('size');

  // Selections
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedSauce, setSelectedSauce] = useState('');
  const [selectedCheese, setSelectedCheese] = useState('');
  const [selectedVeg, setSelectedVeg] = useState([]);
  const [selectedMeat, setSelectedMeat] = useState([]);
  const [size, setSize] = useState('Medium');

  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const res = await api.get('/ingredients');
      setIngredients(res.data.ingredients);

      const bases = res.data.ingredients.filter((i) => i.category === 'base' && i.quantity > 0);
      const sauces = res.data.ingredients.filter((i) => i.category === 'sauce' && i.quantity > 0);
      const cheeses = res.data.ingredients.filter((i) => i.category === 'cheese' && i.quantity > 0);

      if (bases.length > 0) setSelectedBase(bases[0].name);
      if (sauces.length > 0) setSelectedSauce(sauces[0].name);
      if (cheeses.length > 0) setSelectedCheese(cheeses[0].name);
    } catch (error) {
      console.error('Failed to load builder ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBases = () => ingredients.filter((i) => i.category === 'base');
  const getSauces = () => ingredients.filter((i) => i.category === 'sauce');
  const getCheeses = () => ingredients.filter((i) => i.category === 'cheese');
  const getVeg = () => ingredients.filter((i) => i.category === 'vegetable');
  const getMeat = () => ingredients.filter((i) => i.category === 'meat');

  const calculateCustomPrice = () => {
    let cost = 150; // Base crust starting price
    const selectedNames = [
      selectedBase,
      selectedSauce,
      selectedCheese,
      ...selectedVeg,
      ...selectedMeat,
    ];

    selectedNames.forEach((name) => {
      const ing = ingredients.find((i) => i.name === name);
      if (ing) {
        cost += ing.price;
      }
    });

    let sizeFactor = 1.0;
    if (size === 'Small') sizeFactor = 0.85;
    if (size === 'Large') sizeFactor = 1.3;

    return Math.round(cost * sizeFactor);
  };

  const handleToggleVeg = (name) => {
    setSelectedVeg((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const handleToggleMeat = (name) => {
    setSelectedMeat((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const handleReset = () => {
    const bases = getBases().filter((i) => i.quantity > 0);
    const sauces = getSauces().filter((i) => i.quantity > 0);
    const cheeses = getCheeses().filter((i) => i.quantity > 0);

    if (bases.length > 0) setSelectedBase(bases[0].name);
    if (sauces.length > 0) setSelectedSauce(sauces[0].name);
    if (cheeses.length > 0) setSelectedCheese(cheeses[0].name);
    setSelectedVeg([]);
    setSelectedMeat([]);
    setSize('Medium');
    setActiveStep('size');
  };

  const handleAddToCart = () => {
    const customPizzaPrice = calculateCustomPrice();
    addToCart({
      name: `Custom Built Pizza`,
      isCustom: true,
      size,
      customization: {
        base: selectedBase,
        sauce: selectedSauce,
        cheese: selectedCheese,
        vegetables: selectedVeg,
        meats: selectedMeat,
      },
      price: customPizzaPrice,
      quantity: 1,
    });
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="bg-[#111827] text-white min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF6B00]" />
      </div>
    );
  }

  return (
    <div className="bg-[#111827] text-white min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Title */}
        <div className="lg:col-span-12 space-y-3 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="w-7 h-7 text-[#FF6B00] fill-[#FF6B00]" />
            Interactive Pizza Builder
          </h1>
          <p className="text-neutral-400 max-w-sm mx-auto text-sm">
            Select each tier to design your pizza. Stock level checks are live.
          </p>
        </div>

        {/* Step progress tracker */}
        <div className="lg:col-span-12 bg-neutral-900/40 border border-neutral-850 p-4 rounded-card flex justify-between overflow-x-auto gap-4">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`flex-1 min-w-[80px] py-2 text-center rounded-xl text-xs font-bold transition-all border ${activeStep === step.id ? 'bg-[#FF6B00] border-[#FF6B00] text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
            >
              {step.label}
            </button>
          ))}
        </div>

        {/* Left Side: Pizza Canvas Preview */}
        <div className="lg:col-span-5 bg-neutral-900/40 border border-neutral-850 rounded-card p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden shadow-light">
          <div className="absolute w-60 h-60 bg-[#FF6B00]/5 rounded-full blur-[80px] pointer-events-none" />

          {/* Pizza circle representation */}
          <div className="relative w-64 h-64 rounded-full border-8 border-amber-800 bg-amber-100 shadow-large flex items-center justify-center">
            <span className="absolute bottom-4 text-[9px] font-bold text-amber-900/50 uppercase tracking-widest">
              {selectedBase}
            </span>

            {/* Sauce layer */}
            {selectedSauce && (
              <div className="absolute w-[92%] h-[92%] rounded-full bg-red-600/90 border border-red-700/40 flex items-center justify-center">
                {/* Cheese layer */}
                {selectedCheese && (
                  <div className="absolute w-[88%] h-[88%] rounded-full bg-yellow-100 shadow-inner flex flex-wrap gap-4 items-center justify-center p-3">
                    {selectedVeg.slice(0, 6).map((v, i) => (
                      <span key={i} className="bg-green-600 text-white font-bold text-[8px] px-2 py-0.5 rounded-full uppercase">
                        {v.substring(0, 3)}
                      </span>
                    ))}
                    {selectedMeat.slice(0, 6).map((m, i) => (
                      <span key={i} className="bg-red-800 text-white font-bold text-[8px] px-2 py-0.5 rounded-full uppercase">
                        {m.substring(0, 3)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 text-center space-y-2 relative z-10 w-full">
            <h3 className="text-base font-bold uppercase tracking-wider text-neutral-400">Total Custom Cost</h3>
            <span className="text-3xl font-extrabold text-[#FF6B00]">₹{calculateCustomPrice()}</span>
            <p className="text-[10px] text-neutral-500">
              * Includes base crust and size adjustments ({size})
            </p>
          </div>
        </div>

        {/* Right Side: Options customization */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-card min-h-[300px] flex flex-col justify-between"
            >
              {/* Step Title */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg border-b border-neutral-850 pb-2 capitalize">
                  Customize Pizza {activeStep}
                </h3>

                {/* Sizes Selection */}
                {activeStep === 'size' && (
                  <div className="grid grid-cols-3 gap-3">
                    {['Small', 'Medium', 'Large'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`py-4 rounded-xl border text-xs font-bold transition-all ${size === s ? 'bg-[#FF6B00] border-[#FF6B00] text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Crust Selection */}
                {activeStep === 'crust' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {getBases().map((base) => {
                      const isOutOfStock = base.quantity <= 0;
                      return (
                        <button
                          key={base._id}
                          disabled={isOutOfStock}
                          onClick={() => setSelectedBase(base.name)}
                          className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${isOutOfStock ? 'opacity-40 cursor-not-allowed border-neutral-900 bg-neutral-950 text-neutral-600' : selectedBase === base.name ? 'border-[#FF6B00] bg-[#FF6B00]/5 text-white' : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'}`}
                        >
                          <div>
                            <span className="font-bold block">{base.name}</span>
                            <span className="text-[10px] text-neutral-500 mt-1 block">+₹{base.price}</span>
                          </div>
                          {selectedBase === base.name && <Check className="w-4 h-4 text-[#FF6B00]" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Sauce Selection */}
                {activeStep === 'sauce' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {getSauces().map((sauce) => {
                      const isOutOfStock = sauce.quantity <= 0;
                      return (
                        <button
                          key={sauce._id}
                          disabled={isOutOfStock}
                          onClick={() => setSelectedSauce(sauce.name)}
                          className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${isOutOfStock ? 'opacity-40 cursor-not-allowed border-neutral-900 bg-neutral-950 text-neutral-600' : selectedSauce === sauce.name ? 'border-[#FF6B00] bg-[#FF6B00]/5 text-white' : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'}`}
                        >
                          <div>
                            <span className="font-bold block">{sauce.name}</span>
                            <span className="text-[10px] text-neutral-500 mt-1 block">+₹{sauce.price}</span>
                          </div>
                          {selectedSauce === sauce.name && <Check className="w-4 h-4 text-[#FF6B00]" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Cheese Selection */}
                {activeStep === 'cheese' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {getCheeses().map((cheese) => {
                      const isOutOfStock = cheese.quantity <= 0;
                      return (
                        <button
                          key={cheese._id}
                          disabled={isOutOfStock}
                          onClick={() => setSelectedCheese(cheese.name)}
                          className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${isOutOfStock ? 'opacity-40 cursor-not-allowed border-neutral-900 bg-neutral-950 text-neutral-600' : selectedCheese === cheese.name ? 'border-[#FF6B00] bg-[#FF6B00]/5 text-white' : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'}`}
                        >
                          <div>
                            <span className="font-bold block">{cheese.name}</span>
                            <span className="text-[10px] text-neutral-500 mt-1 block">+₹{cheese.price}</span>
                          </div>
                          {selectedCheese === cheese.name && <Check className="w-4 h-4 text-[#FF6B00]" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Veggies Selection */}
                {activeStep === 'veggies' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {getVeg().map((veg) => {
                      const isOutOfStock = veg.quantity <= 0;
                      const isChecked = selectedVeg.includes(veg.name);
                      return (
                        <button
                          key={veg._id}
                          disabled={isOutOfStock}
                          onClick={() => handleToggleVeg(veg.name)}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${isOutOfStock ? 'opacity-40 cursor-not-allowed border-neutral-900 bg-neutral-950 text-neutral-600' : isChecked ? 'border-[#FF6B00] bg-[#FF6B00]/5 text-white' : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'}`}
                        >
                          <span className="font-bold block">{veg.name}</span>
                          <span className="text-[10px] text-neutral-500 mt-1.5">+₹{veg.price}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Meat Selection */}
                {activeStep === 'meat' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {getMeat().map((meat) => {
                      const isOutOfStock = meat.quantity <= 0;
                      const isChecked = selectedMeat.includes(meat.name);
                      return (
                        <button
                          key={meat._id}
                          disabled={isOutOfStock}
                          onClick={() => handleToggleMeat(meat.name)}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${isOutOfStock ? 'opacity-40 cursor-not-allowed border-neutral-900 bg-neutral-950 text-neutral-600' : isChecked ? 'border-[#FF6B00] bg-[#FF6B00]/5 text-white' : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'}`}
                        >
                          <span className="font-bold block">{meat.name}</span>
                          <span className="text-[10px] text-neutral-500 mt-1.5">+₹{meat.price}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigation button inside panel */}
              <div className="flex justify-end gap-2 pt-6 border-t border-neutral-850 mt-6">
                {activeStep !== 'meat' ? (
                  <Button
                    onClick={() => {
                      const idx = STEPS.findIndex((s) => s.id === activeStep);
                      setActiveStep(STEPS[idx + 1].id);
                    }}
                    className="py-2"
                  >
                    Next Step <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={handleAddToCart} className="py-2">
                    Build & Add to Cart
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Selections Overview details summary card */}
          <div className="bg-neutral-900/60 border border-neutral-850 p-6 rounded-card text-left space-y-4 shadow-light text-xs">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#FF6B00] border-b border-neutral-850 pb-2">
              Visual Summary Details
            </h3>

            <div className="grid grid-cols-2 gap-y-2 text-neutral-300">
              <div>Crust: <span className="font-bold text-white">{selectedBase}</span></div>
              <div>Sauce: <span className="font-bold text-white">{selectedSauce}</span></div>
              <div>Cheese: <span className="font-bold text-white">{selectedCheese}</span></div>
              <div>Veggies: <span className="font-bold text-white">{selectedVeg.length} items</span></div>
              <div className="col-span-2">Meats: <span className="font-bold text-white">{selectedMeat.join(', ') || 'None'}</span></div>
            </div>

            <div className="pt-2 flex justify-between gap-3 border-t border-neutral-850">
              <Button onClick={handleReset} variant="secondary" className="py-2 px-4 text-xs">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
              <Button onClick={handleAddToCart} className="flex-1 py-2 text-xs">
                Add Custom Pizza
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
