import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick,
  as: Component = 'div',
  ...props
}) {
  const variants = {
    default: 'bg-white/5 border-white/10',
    solid: 'bg-slate-900 border-slate-800',
    ghost: 'bg-transparent border-transparent',
    gradient: 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const hoverStyles = hover
    ? 'hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200'
    : '';

  const baseStyles = `backdrop-blur-lg border rounded-xl ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`;

  if (onClick) {
    return (
      <motion.div
        className={baseStyles}
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <Component className={baseStyles} {...props}>
      {children}
    </Component>
  );
}

// Card with header section
export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Card with footer section
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-white/10 ${className}`}>
      {children}
    </div>
  );
}
