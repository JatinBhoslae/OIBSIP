import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

/**
 * Forgot password — requests a password-reset link (sent to the user's email).
 * The emailed link routes to /reset-password/:token.
 */
export default function ForgotPassword() {
  const { forgotPassword } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    const res = await forgotPassword(email);
    setLoading(false);

    if (res.success) {
      setSent(true);
    } else {
      setError(res.message);
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
          <h1 className="text-3xl font-extrabold tracking-tight">Forgot Password?</h1>
          <p className="text-xs text-neutral-400">
            Enter the email linked to your account and we'll send a reset link.
          </p>
        </div>

        {sent ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              If an account exists for <strong className="text-emerald-300">{email}</strong>, a
              password-reset link has been sent. Check your inbox (and spam folder).
            </span>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-[#E63946]/10 border border-[#E63946]/20 p-3 rounded-xl flex items-center gap-2 text-xs text-[#E63946]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
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

              <Button type="submit" disabled={loading} className="w-full py-3">
                {loading ? 'Sending link...' : 'Send Reset Link'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="text-center text-xs text-neutral-500">
              Remembered it?{' '}
              <Link to="/login" className="text-[#FF6B00] hover:underline font-bold">
                Back to login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}