import type { UnifiedNFT } from "../types/nft";
import NFTCard from "./NFTCard";
import { Gift } from "lucide-react";

interface NFTGridProps {
  items: UnifiedNFT[];
  loading?: boolean;
  onSelect?: (nft: UnifiedNFT) => void;
}

function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl2 bg-base-800 ring-1 ring-white/5">
      <div className="aspect-square w-full animate-pulse bg-base-700" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-2/3 animate-pulse rounded bg-base-700" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-base-700" />
      </div>
    </div>
  );
}

export default function NFTGrid({ items, loading, onSelect }: NFTGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Gift size={28} className="text-white/20" />
        <p className="text-sm text-white/40">Nenhum gift encontrado com esses filtros.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((nft) => (
        <NFTCard key={nft.id} nft={nft} onSelect={onSelect} />
      ))}
    </div>
  );
}
