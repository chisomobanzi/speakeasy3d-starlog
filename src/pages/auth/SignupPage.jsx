import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export default function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.displayName) {
      error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(formData.email, formData.password, {
      display_name: formData.displayName,
    });
    setLoading(false);

    if (signUpError) {
      error(signUpError.message || 'Failed to sign up');
    } else {
      setEmailSent(true);
    }
  };

  const handleGoogleSignUp = async () => {
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      error(googleError.message || 'Failed to sign up with Google');
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
            We've sent a confirmation link to <span className="text-white">{formData.email}</span>
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Click the link in your email to verify your account and start learning.
          </p>
          <Link to="/login">
            <Button variant="secondary">Back to Sign In</Button>
          </Link>
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-starlog-400 to-starlog-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-1">Start building your personal dictionary</p>
        </div>

        {/* Form */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Display Name"
              type="text"
              placeholder="How should we call you?"
              icon={User}
              value={formData.displayName}
              onChange={handleChange('displayName')}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={formData.email}
              onChange={handleChange('email')}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                icon={Lock}
                value={formData.password}
                onChange={handleChange('password')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              icon={Lock}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              required
            />

            <p className="text-xs text-slate-500">
              By signing up, you agree to our{' '}
              <a href="#" className="text-starlog-400 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-starlog-400 hover:underline">Privacy Policy</a>
            </p>

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900/50 text-slate-500">Or continue with</span>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleGoogleSignUp}
            className="w-full"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </div>

        {/* Sign in link */}
        <p className="text-center text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-starlog-400 hover:text-starlog-300">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
