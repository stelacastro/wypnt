import { BadgeCheck, Diamond } from "lucide-react";
import type { UnifiedNFT } from "../types/nft";
import PlatformBadge from "./PlatformBadge";

interface NFTCardProps {
  nft: UnifiedNFT;
  onSelect?: (nft: UnifiedNFT) => void;
}

export default function NFTCard({ nft, onSelect }: NFTCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(nft)}
      className="group flex w-full flex-col overflow-hidden rounded-xl2 bg-base-800 text-left shadow-card ring-1 ring-white/5 transition active:scale-[0.98]"
    >
      {/* Imagem + badges sobrepostos */}
      <div className="relative aspect-square w-full overflow-hidden bg-base-700">
        <img
          src={nft.imageUrl}
          alt={nft.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2">
          <PlatformBadge source={nft.source} />
        </div>
        {nft.collection.verified && (
          <div className="absolute right-2 top-2 rounded-full bg-black/50 p-1 backdrop-blur">
            <BadgeCheck size={14} className="text-ton-light" />
          </div>
        )}
      </div>

      {/* Metadados */}
      <div className="flex flex-col gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-medium text-white">{nft.name}</p>
          <p className="text-xs text-white/40">{nft.index}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg bg-base-700 px-2 py-1">
            <Diamond size={12} className="text-gift" />
            <span className="font-display text-sm font-semibold text-gift">
              {nft.price.amount.toFixed(2)}
            </span>
          </div>
          {!nft.isListed && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-white/30">
              Não listado
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
