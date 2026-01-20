import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Tabs({
  tabs,
  defaultValue,
  value,
  onChange,
  variant = 'default',
  className = '',
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || tabs[0]?.value);
  const activeValue = value !== undefined ? value : internalValue;

  const handleChange = (newValue) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const variants = {
    default: {
      list: 'bg-slate-900/50 p-1 rounded-lg',
      tab: 'px-4 py-2 rounded-md text-sm font-medium',
      active: 'bg-slate-800 text-white',
      inactive: 'text-slate-400 hover:text-white hover:bg-slate-800/50',
    },
    pills: {
      list: 'gap-2',
      tab: 'px-4 py-2 rounded-full text-sm font-medium',
      active: 'bg-starlog-500 text-white',
      inactive: 'text-slate-400 hover:text-white hover:bg-white/10',
    },
    underline: {
      list: 'border-b border-slate-800 gap-4',
      tab: 'pb-3 text-sm font-medium border-b-2 -mb-px',
      active: 'border-starlog-500 text-white',
      inactive: 'border-transparent text-slate-400 hover:text-white hover:border-slate-700',
    },
  };

  const style = variants[variant];

  return (
    <div className={className}>
      <div className={`flex ${style.list}`}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleChange(tab.value)}
            disabled={tab.disabled}
            className={`
              ${style.tab}
              ${activeValue === tab.value ? style.active : style.inactive}
              transition-colors duration-200 relative
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {tab.icon && <tab.icon className="w-4 h-4 mr-2 inline" />}
            {tab.label}
            {variant === 'default' && activeValue === tab.value && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-slate-800 rounded-md -z-10"
                transition={{ type: 'spring', duration: 0.3 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Tab panel component for content
export function TabPanel({ value, activeValue, children }) {
  if (value !== activeValue) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// Segmented control (iOS style)
export function SegmentedControl({
  options,
  value,
  onChange,
  className = '',
}) {
  return (
    <div className={`inline-flex bg-slate-900 p-1 rounded-lg ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            relative px-4 py-1.5 text-sm font-medium rounded-md transition-colors
            ${value === option.value
              ? 'text-white'
              : 'text-slate-400 hover:text-white'
            }
          `}
        >
          {value === option.value && (
            <motion.div
              layoutId="segment"
              className="absolute inset-0 bg-slate-700 rounded-md -z-10"
              transition={{ type: 'spring', duration: 0.3 }}
            />
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}
