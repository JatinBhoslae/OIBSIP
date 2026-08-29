import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

/**
 * Reset password — reached from the emailed /reset-password/:token link.
 * Calls AuthContext.resetPassword(token, password), then redirects to login.
 */
export default function ResetPassword() {
  const { token } = useParams();
  const { resetPassword } = useContext(AuthContext);
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    const res = await resetPassword(token, password);
    setLoading(false);

    if (res.success) {
      setDone(true);
      setTimeout(() => navigate('/login'), 1800);
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
          <h1 className="text-3xl font-extrabold tracking-tight">Set a new password</h1>
          <p className="text-xs text-neutral-400">Choose a strong password for your account.</p>
        </div>

        {done ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Password reset successful. Redirecting to login...</span>
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
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                icon={Lock}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                icon={Lock}
              />

              <Button type="submit" disabled={loading} className="w-full py-3">
                {loading ? 'Resetting...' : 'Reset Password'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}