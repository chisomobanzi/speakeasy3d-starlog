const variants = {
  default: 'bg-slate-700 text-slate-300',
  primary: 'bg-starlog-500/20 text-starlog-400 border border-starlog-500/30',
  success: 'bg-green-500/20 text-green-400 border border-green-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
  info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon: Icon,
  removable = false,
  onRemove,
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      )}
    </span>
  );
}

// Language badge with flag/icon support
export function LanguageBadge({ code, name, className = '' }) {
  return (
    <Badge variant="primary" size="sm" className={className}>
      {name || code}
    </Badge>
  );
}

// Confidence badge for community entries
export function ConfidenceBadge({ level, className = '' }) {
  const levels = {
    0.25: { label: 'Low', variant: 'danger' },
    0.5: { label: 'Medium', variant: 'warning' },
    0.75: { label: 'High', variant: 'info' },
    1: { label: 'Verified', variant: 'success' },
  };

  const { label, variant } = levels[level] || levels[0.5];

  return (
    <Badge variant={variant} size="sm" className={className}>
      {label}
    </Badge>
  );
}

// Status badge for entries
export function StatusBadge({ status, className = '' }) {
  const statuses = {
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
  };

  const { label, variant } = statuses[status] || statuses.pending;

  return (
    <Badge variant={variant} size="sm" className={className}>
      {label}
    </Badge>
  );
}
