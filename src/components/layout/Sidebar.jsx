import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Plus,
  Users,
  BookOpen,
  Settings,
  User,
  Star,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

const mainNavItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/starlog', icon: Star, label: 'Starlog' },
];

const starlogNavItems = [
  { path: '/starlog/lookup', icon: Search, label: 'Lookup' },
  { path: '/starlog/capture', icon: Plus, label: 'Capture' },
  { path: '/starlog/decks', icon: BookOpen, label: 'My Decks' },
  { path: '/starlog/community', icon: Users, label: 'Community' },
];

const bottomNavItems = [
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ className = '' }) {
  const { profile, isVerified } = useAuth();
  const location = useLocation();

  const isInStarlog = location.pathname.startsWith('/starlog');

  return (
    <aside
      className={`
        w-64 bg-slate-900/50 border-r border-slate-800
        flex flex-col h-screen sticky top-0
        ${className}
      `}
    >
      {/* Logo */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-starlog-400 to-starlog-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">S</span>
          </div>
          <div>
            <h1 className="font-semibold text-white">Starlog</h1>
            <p className="text-xs text-slate-500">Language Platform</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Main section */}
        <div className="mb-4">
          {mainNavItems.map((item) => (
            <SidebarLink key={item.path} {...item} />
          ))}
        </div>

        {/* Starlog section */}
        {isInStarlog && (
          <div className="pt-2 border-t border-slate-800">
            <p className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Starlog
            </p>
            {starlogNavItems.map((item) => (
              <SidebarLink key={item.path} {...item} indent />
            ))}
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-slate-800">
        {bottomNavItems.map((item) => (
          <SidebarLink key={item.path} {...item} />
        ))}

        {/* User profile */}
        <NavLink
          to="/settings/profile"
          className="flex items-center gap-3 p-2 mt-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Avatar
            src={profile?.avatar_url}
            name={profile?.display_name}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.display_name || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {profile?.username ? `@${profile.username}` : 'Set up profile'}
            </p>
          </div>
          {isVerified && (
            <Badge variant="success" size="sm">Verified</Badge>
          )}
        </NavLink>
      </div>
    </aside>
  );
}

function SidebarLink({ path, icon: Icon, label, indent = false, badge }) {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <NavLink
      to={path}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
        ${indent ? 'ml-3' : ''}
        ${isActive
          ? 'bg-starlog-500/10 text-starlog-400'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {badge && (
        <Badge variant="primary" size="sm">{badge}</Badge>
      )}
      {isActive && (
        <motion.div
          layoutId="sidebarIndicator"
          className="w-1 h-5 bg-starlog-500 rounded-full"
        />
      )}
    </NavLink>
  );
}
