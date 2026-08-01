import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';

export default function VerifyOTP() {
  const { verifyOTP } = useContext(AuthContext);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      navigate('/login');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !email) return;

    setLoading(true);
    setErrorMessage('');

    const res = await verifyOTP(email, otp);
    setLoading(false);

    if (res.success) {
      navigate('/');
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
          <h1 className="text-3xl font-extrabold tracking-tight">Verify Email</h1>
          <p className="text-xs text-neutral-400">
            A 6-digit OTP has been sent to <span className="text-[#FF6B00] font-bold">{email}</span>.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-[#E63946]/10 border border-[#E63946]/20 p-3 rounded-xl flex items-center gap-2 text-xs text-[#E63946]">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
              6-Digit OTP Code
            </label>
            <input
              type="text"
              required
              maxLength="6"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-input px-4 py-3 text-center text-xl font-bold tracking-[0.4em] text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? 'Verifying...' : 'Verify OTP'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-[10px] text-neutral-500 text-center">
          * In simulated email mode, check the backend server console for the generated OTP.
        </p>
      </motion.div>
    </div>
  );
}
