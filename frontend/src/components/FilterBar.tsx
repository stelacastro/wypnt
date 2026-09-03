import { ArrowUpDown } from "lucide-react";
import type { FetchNftsParams } from "../types/nft";

interface FilterBarProps {
  sort: NonNullable<FetchNftsParams["sort"]>;
  onSortChange: (sort: NonNullable<FetchNftsParams["sort"]>) => void;
}

const SORT_LABEL: Record<NonNullable<FetchNftsParams["sort"]>, string> = {
  recent: "Recentes",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
};

export default function FilterBar({ sort, onSortChange }: FilterBarProps) {
  function cycleSort() {
    const order: Array<NonNullable<FetchNftsParams["sort"]>> = ["recent", "price_asc", "price_desc"];
    const next = order[(order.indexOf(sort) + 1) % order.length];
    onSortChange(next);
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      <button
        type="button"
        onClick={cycleSort}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-base-800 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/10"
      >
        <ArrowUpDown size={13} className="text-white/50" />
        {SORT_LABEL[sort]}
      </button>
      <span className="shrink-0 rounded-full bg-base-800 px-3 py-1.5 text-xs text-white/50 ring-1 ring-white/10">
        Todas as coleções
      </span>
      <span className="shrink-0 rounded-full bg-base-800 px-3 py-1.5 text-xs text-white/50 ring-1 ring-white/10">
        Todas as origens
      </span>
    </div>
  );
}
