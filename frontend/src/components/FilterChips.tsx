import { X } from "lucide-react";
import type { ActiveFilters } from "../types/filters";

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  filters: ActiveFilters;
  onChange: (next: ActiveFilters) => void;
}

export default function FilterChips({ filters, onChange }: FilterChipsProps) {
  const chips: Chip[] = [];

  if (filters.minPrice !== undefined) {
    chips.push({
      key: "minPrice",
      label: `Mín: ${filters.minPrice} TON`,
      onRemove: () => onChange({ ...filters, minPrice: undefined }),
    });
  }
  if (filters.maxPrice !== undefined) {
    chips.push({
      key: "maxPrice",
      label: `Máx: ${filters.maxPrice} TON`,
      onRemove: () => onChange({ ...filters, maxPrice: undefined }),
    });
  }
  for (const [trait, values] of Object.entries(filters.attributes)) {
    for (const value of values) {
      chips.push({
        key: `${trait}:${value}`,
        label: `${trait}: ${value}`,
        onRemove: () =>
          onChange({
            ...filters,
            attributes: {
              ...filters.attributes,
              [trait]: filters.attributes[trait].filter((v) => v !== value),
            },
          }),
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="flex shrink-0 items-center gap-1 rounded-full bg-ton/15 px-3 py-1.5 text-xs font-medium text-ton-light ring-1 ring-ton/30"
        >
          {chip.label}
          <X size={12} />
        </button>
      ))}
    </div>
  );
}
