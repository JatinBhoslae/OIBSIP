import React from 'react';
import { Link } from 'react-router-dom';
import { Pizza, Flame, Clock, Award, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="bg-[#111827] text-white min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Glow effect */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#FF6B00]/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 text-left relative z-10"
        >
          <div className="inline-flex items-center gap-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/25 px-3 py-1 rounded-full text-[#FF6B00] text-xs font-semibold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            Deliciously Handcrafted
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
            Craft Your Perfect <br />
            <span className="bg-gradient-to-r from-[#FF6B00] via-yellow-500 to-red-500 bg-clip-text text-transparent">
              Pizza Masterpiece
            </span>
          </h1>
          <p className="text-neutral-400 text-base max-w-lg leading-relaxed">
            Choose your crust, select premium sauces, layer with cheese, and load it with fresh toppings. Real-time order tracking from stone oven to your doorstep.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/menu"
              className="bg-[#FF6B00] hover:bg-[#e05e00] px-8 py-3.5 rounded-btn font-bold shadow-lg shadow-orange-500/10 hover:scale-[1.02] transition-all text-center text-sm"
            >
              Explore Menu
            </Link>
            <Link
              to="/customize"
              className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 px-8 py-3.5 rounded-btn font-bold hover:scale-[1.02] transition-all text-center text-sm text-[#FF6B00]"
            >
              Pizza Customizer
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative flex justify-center items-center"
        >
          <div className="absolute w-[400px] h-[400px] bg-gradient-to-tr from-[#FF6B00] to-yellow-500 rounded-full blur-[80px] opacity-10 animate-pulse" />
          <motion.img
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800"
            alt="Delicious Pizza"
            className="w-[420px] object-contain rounded-full shadow-large relative z-10 border border-white/5"
          />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="bg-neutral-900/30 border-t border-neutral-900 py-24 px-6">
        <div className="max-w-6xl mx-auto w-full text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Why Choose PizzaHub?</h2>
            <p className="text-neutral-400 max-w-sm mx-auto text-sm">
              We leverage production-grade logistics and real-time inventory management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: '100% Customized',
                desc: 'Take full control of your meal. Pick everything from the flour core to the specific vegetable counts.',
                icon: Pizza,
              },
              {
                title: 'Live Oven Tracker',
                desc: 'Track status updates from "Preparing" to "In Kitchen" to "Ready" using WebSocket technology.',
                icon: Clock,
              },
              {
                title: 'Daily Stock Audit',
                desc: 'We monitor our fresh ingredients. Low levels instantly dispatch alert crons so you never face out-of-stock items.',
                icon: ShieldCheck,
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="bg-neutral-900/60 border border-neutral-850 p-8 rounded-card text-left space-y-4 shadow-light"
                >
                  <div className="bg-[#FF6B00]/10 p-3.5 rounded-xl w-fit text-[#FF6B00]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">{feat.title}</h3>
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    {feat.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Specialty Pizza Teaser */}
      <section className="py-24 px-6 max-w-6xl mx-auto w-full text-center space-y-12">
        <h2 className="text-3xl font-bold">Popular Preset Recipes</h2>
        <p className="text-neutral-400 max-w-xs mx-auto text-sm">
          Try our signature, customer-favorite recipe choices prepared fresh.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: 'Margherita Classic',
              desc: 'Classic delight with 100% real mozzarella cheese, freshly-baked thin crust, and rich tomato sauce.',
              price: '199',
              image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&q=80&w=600',
            },
            {
              name: 'Farmhouse Special',
              desc: 'Delightful combination of fresh onions, capsicum, juicy tomatoes, corn, and loaded mushrooms.',
              price: '299',
              image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=600',
            },
            {
              name: 'Pepperoni Feast',
              desc: 'Loads of real pepperoni slices, extra mozzarella cheese, and spicy marinara sauce.',
              price: '399',
              image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=600',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              className="bg-neutral-900/40 border border-neutral-850 rounded-card overflow-hidden flex flex-col shadow-light hover:border-neutral-800"
            >
              <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
              <div className="p-6 text-left space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white">{item.name}</h3>
                  <p className="text-neutral-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-[#FF6B00] font-extrabold text-lg">₹{item.price}</span>
                  <Link to="/menu" className="bg-[#FF6B00] hover:bg-[#e05e00] px-4 py-2 rounded-btn text-xs font-bold text-white transition-colors">
                    Order Now
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
