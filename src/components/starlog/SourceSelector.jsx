import { BookOpen, Users, BookMarked, Globe } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useSourceRegistry } from '../../hooks/useSourceRegistry';

const ICON_MAP = {
  BookOpen,
  Users,
  BookMarked,
  Globe,
};

export default function SourceSelector({ loading = {}, languageCode }) {
  const enabledSources = useAppStore((s) => s.enabledSources);
  const toggleSource = useAppStore((s) => s.toggleSource);
  const { searchSources } = useSourceRegistry(languageCode);

  return (
    <div className="flex flex-wrap gap-2">
      {searchSources.map(source => {
        const Icon = ICON_MAP[source.icon];
        const enabled = enabledSources.includes(source.id);
        const isLoading = loading[source.id];
        const color = source.core_color;

        return (
          <button
            key={source.id}
            onClick={() => toggleSource(source.id)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-200 border
              ${enabled
                ? 'border-transparent text-white'
                : 'border-slate-700 text-slate-500 bg-transparent hover:text-slate-300'
              }
              ${isLoading ? 'animate-pulse' : ''}
            `}
            style={enabled ? {
              backgroundColor: `${color}20`,
              color: color,
              borderColor: `${color}30`,
            } : undefined}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {source.short_name}
          </button>
        );
      })}
    </div>
  );
}
