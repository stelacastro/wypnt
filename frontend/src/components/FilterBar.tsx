import { useEffect, useState } from "react";
import { SlidersHorizontal, ArrowUpDown, ChevronDown } from "lucide-react";
import type { ActiveFilters } from "../types/filters";
import type { CollectionAttribute } from "../types/collection";
import { fetchCollectionAttributes } from "../services/collectionService";
import TraitFilterSheet from "./TraitFilterSheet";
import SortSheet from "./SortSheet";

interface FilterBarProps {
  filters: ActiveFilters;
  onChange: (next: ActiveFilters) => void;
  /** Abre o sheet de faixa de preço (ícone "Filtro"). */
  onOpenFilterSheet: () => void;
  /** Abre o modal de coleções (pílula "Collection"). */
  onOpenCollections: () => void;
  activeFilterCount: number;
}

export default function FilterBar({
  filters,
  onChange,
  onOpenFilterSheet,
  onOpenCollections,
  activeFilterCount,
}: FilterBarProps) {
  const [attributes, setAttributes] = useState<CollectionAttribute[]>([]);
  const [loadingAttrs, setLoadingAttrs] = useState(false);
  const [openTrait, setOpenTrait] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);

  // Os traits (Model/Backdrop/Symbol/...) são por-coleção — sempre que a
  // coleção selecionada muda (ou é limpa), buscamos de novo no endpoint de
  // atributos daquela coleção específica. Nenhum trait fica fixo aqui: a
  // lista de pílulas depois de "Collection" é inteiramente o que a API
  // devolver pra essa coleção.
  useEffect(() => {
    if (!filters.collection) {
      setAttributes([]);
      return;
    }
    let cancelled = false;
    setLoadingAttrs(true);
    fetchCollectionAttributes(filters.collection)
      .then((data) => {
        if (!cancelled) setAttributes(data);
      })
      .catch(() => {
        if (!cancelled) setAttributes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAttrs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.collection]);

  function toggleAttributeValue(trait: string, value: string) {
    const current = filters.attributes[trait] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, attributes: { ...filters.attributes, [trait]: next } });
  }

  const openTraitData = attributes.find((a) => a.trait === openTrait) ?? null;

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={onOpenFilterSheet}
          aria-label="Filtros"
          className="relative flex shrink-0 items-center justify-center rounded-full bg-base-800 p-2.5 text-white/70 ring-1 ring-white/10"
        >
          <SlidersHorizontal size={16} />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ton px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSortOpen(true)}
          aria-label="Ordenar"
          className="flex shrink-0 items-center justify-center rounded-full bg-base-800 p-2.5 text-white/70 ring-1 ring-white/10"
        >
          <ArrowUpDown size={16} />
        </button>

        <button
          type="button"
          onClick={onOpenCollections}
          className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs font-medium ring-1 ${
            filters.collection
              ? "bg-ton/15 text-ton-light ring-ton/30"
              : "bg-base-800 text-white/70 ring-white/10"
          }`}
        >
          {filters.collectionName ?? "Collection"}
          <ChevronDown size={13} />
        </button>

        {filters.collection && loadingAttrs && (
          <span className="shrink-0 rounded-full bg-base-800 px-3 py-2 text-xs text-white/30 ring-1 ring-white/10">
            Carregando traits...
          </span>
        )}

        {filters.collection &&
          !loadingAttrs &&
          attributes.map((attr) => {
            const selectedCount = filters.attributes[attr.trait]?.length ?? 0;
            return (
              <button
                key={attr.trait}
                type="button"
                onClick={() => setOpenTrait(attr.trait)}
                className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs font-medium ring-1 ${
                  selectedCount > 0
                    ? "bg-ton/15 text-ton-light ring-ton/30"
                    : "bg-base-800 text-white/70 ring-white/10"
                }`}
              >
                {attr.trait}
                {selectedCount > 0 ? ` (${selectedCount})` : ""}
                <ChevronDown size={13} />
              </button>
            );
          })}
      </div>

      {openTraitData && (
        <TraitFilterSheet
          trait={openTraitData.trait}
          values={openTraitData.values}
          selected={filters.attributes[openTraitData.trait] ?? []}
          onToggle={(value) => toggleAttributeValue(openTraitData.trait, value)}
          onClose={() => setOpenTrait(null)}
        />
      )}

      <SortSheet
        open={sortOpen}
        current={filters.sort}
        onSelect={(sort) => {
          onChange({ ...filters, sort });
          setSortOpen(false);
        }}
        onClose={() => setSortOpen(false)}
      />
    </>
  );
}
