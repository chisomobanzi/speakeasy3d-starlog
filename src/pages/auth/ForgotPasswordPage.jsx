import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      error('Please enter your email');
      return;
    }

    setLoading(true);
    const { error: resetError } = await resetPassword(email);
    setLoading(false);

    if (resetError) {
      error(resetError.message || 'Failed to send reset email');
    } else {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 bg-starlog-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-starlog-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-slate-400 mb-6">
            We've sent password reset instructions to <span className="text-white">{email}</span>
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              onClick={() => setEmailSent(false)}
            >
              Try another email
            </Button>
            <Link to="/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-starlog-400 to-starlog-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-slate-400 mt-1">
            Enter your email and we'll send you reset instructions
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Send Reset Instructions
            </Button>
          </form>
        </div>

        {/* Back link */}
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-slate-400 hover:text-white mt-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </motion.div>
    </div>
  );
}
