import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { UnifiedNFT } from "../types/nft";
import type { ActiveFilters } from "../types/filters";

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: ActiveFilters;
  onApply: (next: ActiveFilters) => void;
  /** Itens atualmente carregados — usados só para derivar as opções de trait disponíveis. */
  items: UnifiedNFT[];
}

const SORT_OPTIONS: Array<{ value: ActiveFilters["sort"]; label: string }> = [
  { value: "recent", label: "Recentes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
];

/** Deriva { Model: Set("Pumpkin","Golden"), Backdrop: Set(...) } a partir dos itens em tela. */
function deriveFacets(items: UnifiedNFT[]): Record<string, string[]> {
  const facets: Record<string, Set<string>> = {};
  for (const item of items) {
    for (const attr of item.attributes ?? []) {
      if (!facets[attr.trait]) facets[attr.trait] = new Set();
      facets[attr.trait].add(attr.value);
    }
  }
  return Object.fromEntries(Object.entries(facets).map(([trait, set]) => [trait, [...set]]));
}

export default function FilterSheet({ open, onClose, filters, onApply, items }: FilterSheetProps) {
  const [draft, setDraft] = useState<ActiveFilters>(filters);
  const facets = useMemo(() => deriveFacets(items), [items]);

  if (!open) return null;

  function toggleAttribute(trait: string, value: string) {
    const current = draft.attributes[trait] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setDraft({ ...draft, attributes: { ...draft.attributes, [trait]: next } });
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleClear() {
    const cleared: ActiveFilters = { ...draft, minPrice: undefined, maxPrice: undefined, attributes: {} };
    setDraft(cleared);
    onApply(cleared);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/60 backdrop-blur-sm">
      <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl bg-base-900 ring-1 ring-white/10">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/5 bg-base-900 px-4 py-3">
          <p className="font-display text-base font-semibold text-white">Filtros</p>
          <button onClick={onClose} aria-label="Fechar" className="text-white/40">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-4">
          {/* Ordenação */}
          <section>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
              Ordenar por
            </p>
            <div className="flex gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDraft({ ...draft, sort: opt.value })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${
                    draft.sort === opt.value
                      ? "bg-ton text-white ring-ton"
                      : "bg-base-800 text-white/60 ring-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Faixa de preço */}
          <section>
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
                  setDraft({
                    ...draft,
                    minPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
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
                  setDraft({
                    ...draft,
                    maxPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full rounded-xl bg-base-800 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-ton"
              />
            </div>
          </section>

          {/* Atributos dinâmicos (Model, Backdrop, Symbol, etc.) */}
          {Object.entries(facets).map(([trait, values]) => (
            <section key={trait}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
                {trait}
              </p>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const active = draft.attributes[trait]?.includes(value) ?? false;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleAttribute(trait, value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${
                        active
                          ? "bg-ton text-white ring-ton"
                          : "bg-base-800 text-white/60 ring-white/10"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {Object.keys(facets).length === 0 && (
            <p className="text-xs text-white/30">
              Nenhum atributo disponível ainda — carregue mais itens pra ver as opções de Model,
              Backdrop e Symbol.
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-white/5 bg-base-900 p-4">
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
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
