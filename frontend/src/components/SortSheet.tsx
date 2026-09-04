import { X } from "lucide-react";
import type { ActiveFilters } from "../types/filters";

interface SortSheetProps {
  open: boolean;
  current: ActiveFilters["sort"];
  onSelect: (sort: ActiveFilters["sort"]) => void;
  onClose: () => void;
}

const OPTIONS: Array<{ value: ActiveFilters["sort"]; label: string }> = [
  { value: "recent", label: "Recentes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
];

export default function SortSheet({ open, current, onSelect, onClose }: SortSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm">
      <div className="w-full rounded-t-2xl bg-base-900 p-4 ring-1 ring-white/10">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-base font-semibold text-white">Ordenar por</p>
          <button onClick={onClose} aria-label="Fechar" className="text-white/40">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`rounded-xl px-3 py-2.5 text-left text-sm ring-1 ${
                current === opt.value
                  ? "bg-ton/10 text-white ring-ton/40"
                  : "bg-base-800 text-white/70 ring-white/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
