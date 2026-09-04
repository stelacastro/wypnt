import { useState } from "react";
import { X } from "lucide-react";
import type { ActiveFilters } from "../types/filters";

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: ActiveFilters;
  onApply: (next: ActiveFilters) => void;
}

/**
 * Sheet de faixa de preço — ordenação foi pra SortSheet.tsx e os filtros de
 * atributo (Model/Backdrop/Symbol/...) foram pra FilterBar.tsx, já que
 * agora dependem da coleção selecionada e vêm dinamicamente da API.
 */
export default function FilterSheet({ open, onClose, filters, onApply }: FilterSheetProps) {
  const [draft, setDraft] = useState<ActiveFilters>(filters);

  if (!open) return null;

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleClear() {
    const cleared: ActiveFilters = { ...draft, minPrice: undefined, maxPrice: undefined };
    setDraft(cleared);
    onApply(cleared);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/60 backdrop-blur-sm">
      <div className="w-full rounded-t-2xl bg-base-900 ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <p className="font-display text-base font-semibold text-white">Faixa de preço</p>
          <button onClick={onClose} aria-label="Fechar" className="text-white/40">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
            Preço (TON)
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Mín"
              value={draft.minPrice ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, minPrice: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-full rounded-xl bg-base-800 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-ton"
            />
            <span className="text-white/30">—</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Máx"
              value={draft.maxPrice ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, maxPrice: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-full rounded-xl bg-base-800 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-ton"
            />
          </div>
        </div>

        <div className="flex gap-2 border-t border-white/5 p-4">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 rounded-xl bg-base-800 py-3 text-sm font-medium text-white/70 ring-1 ring-white/10"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-xl bg-ton py-3 text-sm font-semibold text-white"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
