import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-starlog-500 hover:bg-starlog-600 text-white',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
  ghost: 'hover:bg-white/10 text-slate-300',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'border border-starlog-500 text-starlog-400 hover:bg-starlog-500/10',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
  icon: 'p-2',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  as: Component = 'button',
  animate = true,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-starlog-500/50';

  const content = (
    <>
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {Icon && iconPosition === 'left' && !loading && <Icon className="w-5 h-5" />}
      {children}
      {Icon && iconPosition === 'right' && !loading && <Icon className="w-5 h-5" />}
    </>
  );

  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (animate && Component === 'button') {
    return (
      <motion.button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <Component
      ref={ref}
      className={combinedClassName}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </Component>
  );
});

Button.displayName = 'Button';

export default Button;
