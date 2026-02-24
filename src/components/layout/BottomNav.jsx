import { NavLink, useLocation } from 'react-router-dom';
import { Star, Plus, Users, BookOpen, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: BookOpen, label: 'Decks' },
  { path: '/constellation', icon: Star, label: 'Explore' },
  { path: '/add', icon: Plus, label: 'Add', highlight: true },
  { path: '/community', icon: Users, label: 'Community' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav({ className = '' }) {
  const location = useLocation();

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-slate-950/90 backdrop-blur-lg border-t border-slate-800
        safe-bottom
        ${className}
      `}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/' || location.pathname.startsWith('/decks')
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative -mt-4"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-starlog-400 to-starlog-600 flex items-center justify-center shadow-lg shadow-starlog-500/30"
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 py-2 px-3"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={`
                  p-1.5 rounded-lg transition-colors
                  ${isActive ? 'bg-starlog-500/20' : ''}
                `}
              >
                <Icon
                  className={`
                    w-5 h-5 transition-colors
                    ${isActive ? 'text-starlog-400' : 'text-slate-500'}
                  `}
                />
              </motion.div>
              <span
                className={`
                  text-xs transition-colors
                  ${isActive ? 'text-starlog-400' : 'text-slate-500'}
                `}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
