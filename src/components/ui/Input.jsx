import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const hasIcon = !!Icon;
  const iconPadding = hasIcon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white
            placeholder-slate-500 focus:outline-none transition-colors
            ${error
              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-slate-700 focus:border-starlog-500 focus:ring-1 focus:ring-starlog-500'
            }
            ${iconPadding}
            ${className}
          `}
          {...props}
        />
        {Icon && iconPosition === 'right' && (
          <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = forwardRef(({
  label,
  error,
  hint,
  className = '',
  containerClassName = '',
  rows = 3,
  ...props
}, ref) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white
          placeholder-slate-500 focus:outline-none transition-colors resize-none
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border-slate-700 focus:border-starlog-500 focus:ring-1 focus:ring-starlog-500'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;
