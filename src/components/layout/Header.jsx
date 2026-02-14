import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Settings, LogOut, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/search') return 'Search';
    if (path === '/decks') return 'My Decks';
    if (path === '/add') return 'Add Word';
    if (path.startsWith('/decks/')) return 'Deck';
    if (path === '/community') return 'Community';
    if (path === '/settings') return 'Settings';
    return 'Starlog';
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left side - Logo & Title */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-starlog-400 to-starlog-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-white">
                Starlog
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/">Search</NavLink>
            <NavLink to="/decks">Decks</NavLink>
            <NavLink to="/add">Add Word</NavLink>
            <NavLink to="/community">Community</NavLink>
            <NavLink to="/settings">Settings</NavLink>
          </nav>

          {/* Right side - Notifications & Profile */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-slate-400">
              <Bell className="w-5 h-5" />
            </Button>

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Avatar
                  src={profile?.avatar_url}
                  name={profile?.display_name || user?.email}
                  size="sm"
                />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden"
                  >
                    {/* User info */}
                    <div className="p-3 border-b border-slate-800">
                      <p className="font-medium text-white truncate">
                        {profile?.display_name || 'User'}
                      </p>
                      <p className="text-sm text-slate-400 truncate">
                        {user?.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div className="p-1">
                      <MenuLink to="/settings" icon={User}>
                        Profile & Settings
                      </MenuLink>
                      <button
                        onClick={async () => {
                          setShowUserMenu(false);
                          try {
                            await signOut();
                          } catch {
                            // AbortError expected — auth state change aborts the fetch
                          }
                          navigate('/login', { replace: true });
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = to === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={`
        px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${isActive
          ? 'bg-starlog-500/10 text-starlog-400'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      {children}
    </Link>
  );
}

function MenuLink({ to, icon: Icon, children }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
    >
      <Icon className="w-4 h-4" />
      {children}
    </Link>
  );
}
