import { Search, SlidersHorizontal } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

export default function SearchBar({
  value,
  onChange,
  onOpenFilters,
  activeFilterCount,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar por nome ou #ID"
          className="w-full rounded-full bg-base-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 ring-1 ring-white/10 focus:outline-none focus:ring-ton"
        />
      </div>
      <button
        type="button"
        onClick={onOpenFilters}
        aria-label="Abrir filtros"
        className="relative flex shrink-0 items-center justify-center rounded-full bg-base-800 p-2.5 text-white/70 ring-1 ring-white/10"
      >
        <SlidersHorizontal size={17} />
        {activeFilterCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ton px-1 text-[10px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}
