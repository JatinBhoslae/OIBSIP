import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, Mail, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function Register() {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await register(name, email, password);
    setLoading(false);

    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 2000);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="bg-[#111827] text-white min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-[#FF6B00]/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-neutral-900/60 border border-neutral-850 p-8 rounded-card space-y-6 relative z-10 text-left shadow-large"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Create Account</h1>
          <p className="text-xs text-neutral-400">Join PizzaHub and start crafting custom pizzas.</p>
        </div>

        {errorMessage && (
          <div className="bg-[#E63946]/10 border border-[#E63946]/20 p-3 rounded-xl flex items-center gap-2 text-xs text-[#E63946]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 p-3 rounded-xl text-xs text-[#22C55E]">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required icon={User} />
          <Input label="Email Address" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required icon={Mail} />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required icon={Lock} />

          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? 'Creating Account...' : 'Register'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-xs text-neutral-500 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-[#FF6B00] hover:underline font-bold">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
