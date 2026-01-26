import { BookOpen, Users, BookMarked, Globe } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { SOURCES, ALL_SOURCE_IDS } from '../../lib/dictionarySources';

const ICON_MAP = {
  BookOpen,
  Users,
  BookMarked,
  Globe,
};

export default function SourceSelector({ loading = {} }) {
  const enabledSources = useAppStore((s) => s.enabledSources);
  const toggleSource = useAppStore((s) => s.toggleSource);

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_SOURCE_IDS.map(id => {
        const source = SOURCES[id];
        const Icon = ICON_MAP[source.icon];
        const enabled = enabledSources.includes(id);
        const isLoading = loading[id];

        return (
          <button
            key={id}
            onClick={() => toggleSource(id)}
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
              backgroundColor: `${source.color}20`,
              color: source.color,
              borderColor: `${source.color}30`,
            } : undefined}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {source.shortName}
          </button>
        );
      })}
    </div>
  );
}
