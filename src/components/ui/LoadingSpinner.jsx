import { motion } from 'framer-motion';

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export default function LoadingSpinner({ size = 'md', className = '' }) {
  return (
    <svg
      className={`animate-spin ${sizes[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Full page loading screen
export function LoadingScreen({ message }) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4"
        >
          <LoadingSpinner size="xl" className="text-starlog-500 mx-auto" />
        </motion.div>
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400"
          >
            {message}
          </motion.p>
        )}
      </div>
    </div>
  );
}

// Inline loading state
export function LoadingOverlay({ show, blur = true }) {
  if (!show) return null;

  return (
    <div
      className={`
        absolute inset-0 flex items-center justify-center z-10
        ${blur ? 'bg-slate-950/60 backdrop-blur-sm' : 'bg-slate-950/80'}
      `}
    >
      <LoadingSpinner size="lg" className="text-starlog-500" />
    </div>
  );
}

// Skeleton loader
export function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    avatar: 'w-10 h-10 rounded-full',
    card: 'h-32 rounded-xl',
    button: 'h-10 w-24 rounded-lg',
  };

  return (
    <div
      className={`
        bg-slate-800 animate-pulse
        ${variants[variant]}
        ${className}
      `}
    />
  );
}

// Skeleton for entry cards
export function EntryCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-16 h-6" />
        <Skeleton className="w-24 h-4" />
      </div>
      <Skeleton className="w-3/4 h-4" />
      <Skeleton className="w-1/2 h-4" />
    </div>
  );
}

// Skeleton for deck cards
export function DeckCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-1/2 h-5" />
          <Skeleton className="w-3/4 h-4" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="w-16 h-6" />
        <Skeleton className="w-16 h-6" />
      </div>
    </div>
  );
}
