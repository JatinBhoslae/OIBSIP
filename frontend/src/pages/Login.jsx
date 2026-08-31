import React, { useContext, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMessage('');

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate(redirect ? `/${redirect}` : '/');
    } else {
      if (res.requiresVerification) {
        navigate(`/verify-otp?email=${encodeURIComponent(res.email)}`);
      } else {
        setErrorMessage(res.message);
      }
    }
  };

  return (
    <div className="bg-[#111827] text-white min-h-screen flex items-center justify-center py-12 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-[500px] h-[500px] bg-[#FF6B00]/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-neutral-900/60 border border-neutral-850 p-8 rounded-card space-y-6 relative z-10 text-left shadow-large"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome Back</h1>
          <p className="text-xs text-neutral-400">Enter your credentials to access PizzaHub.</p>
        </div>

        {errorMessage && (
          <div className="bg-[#E63946]/10 border border-[#E63946]/20 p-3 rounded-xl flex items-center gap-2 text-xs text-[#E63946]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={Mail}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={Lock}
          />

          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="text-center pt-2 space-y-3">
          <p className="text-xs text-neutral-500">
            Forgot your password?{' '}
            <Link to="/forgot-password" className="text-[#FF6B00] hover:underline font-bold">
              Reset it
            </Link>
          </p>
          <p className="text-xs text-neutral-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#FF6B00] hover:underline font-bold">
              Sign up
            </Link>
          </p>
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 text-[10px] text-neutral-500 text-left">
            <p className="font-semibold text-neutral-400 mb-1">Demo Accounts</p>
            <p>Admin: admin@pizzahub.com / adminpassword</p>
            <p>Customer: customer@pizzahub.com / customerpassword</p>
            <p>Driver: delivery@pizzahub.com / deliverypassword</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
