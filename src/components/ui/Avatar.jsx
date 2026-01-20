const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

export default function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className = '',
  showStatus = false,
  status = 'offline', // 'online', 'offline', 'away'
}) {
  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Generate a consistent color based on name
  const getColor = (name) => {
    if (!name) return 'bg-slate-700';
    const colors = [
      'bg-red-600',
      'bg-orange-600',
      'bg-amber-600',
      'bg-yellow-600',
      'bg-lime-600',
      'bg-green-600',
      'bg-emerald-600',
      'bg-teal-600',
      'bg-cyan-600',
      'bg-sky-600',
      'bg-blue-600',
      'bg-indigo-600',
      'bg-violet-600',
      'bg-purple-600',
      'bg-fuchsia-600',
      'bg-pink-600',
      'bg-rose-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-slate-500',
    away: 'bg-yellow-500',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={`${sizes[size]} rounded-full object-cover ring-2 ring-slate-800`}
        />
      ) : (
        <div
          className={`
            ${sizes[size]}
            ${getColor(name)}
            rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-slate-800
          `}
        >
          {getInitials(name)}
        </div>
      )}
      {showStatus && (
        <span
          className={`
            absolute bottom-0 right-0
            ${size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'}
            ${statusColors[status]}
            rounded-full ring-2 ring-slate-900
          `}
        />
      )}
    </div>
  );
}

// Avatar group for showing multiple users
export function AvatarGroup({ users, max = 3, size = 'md' }) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((user, index) => (
        <Avatar
          key={user.id || index}
          src={user.avatar_url}
          name={user.name || user.username}
          size={size}
          className="ring-2 ring-slate-900"
        />
      ))}
      {remaining > 0 && (
        <div
          className={`
            ${sizes[size]}
            bg-slate-700 rounded-full flex items-center justify-center
            font-semibold text-white ring-2 ring-slate-900
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
