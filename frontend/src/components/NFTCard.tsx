import { BadgeCheck, Diamond } from "lucide-react";
import type { UnifiedNFT } from "../types/nft";
import PlatformBadge from "./PlatformBadge";

interface NFTCardProps {
  nft: UnifiedNFT;
  onSelect?: (nft: UnifiedNFT) => void;
}

function isVideo(url: string) {
  return /\.mp4($|\?)/i.test(url);
}

/**
 * Renderiza a mídia do gift. Cobre os dois formatos mais comuns em
 * metadata de NFT na TON: imagem estática (PNG/WebP/JPG) e vídeo (MP4).
 *
 * Lottie/TGS (as animações "nativas" de sticker do Telegram) não são
 * renderizadas aqui — exigem uma lib de player (ex. `lottie-react`) que
 * não incluímos por padrão para manter o bundle leve. Se um item vier
 * com only-.json/.tgs, o navegador não sabe exibir e cai no fallback do
 * <img> (broken image) — trate isso convertendo pra .webp no pipeline de
 * indexação, ou adicione lottie-react e troque esse branch condicional.
 */
function GiftMedia({ nft }: { nft: UnifiedNFT }) {
  if (isVideo(nft.imageUrl)) {
    return (
      <video
        src={nft.imageUrl}
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
    );
  }
  return (
    <img
      src={nft.imageUrl}
      alt={nft.name}
      loading="lazy"
      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
    />
  );
}

export default function NFTCard({ nft, onSelect }: NFTCardProps) {
  const topAttributes = (nft.attributes ?? []).slice(0, 2);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(nft)}
      className="group flex w-full flex-col overflow-hidden rounded-xl2 bg-base-800 text-left shadow-card ring-1 ring-white/10 transition active:scale-[0.98]"
    >
      {/* Imagem/vídeo + badges sobrepostos — a moldura arredondada + ring
          sutil evoca a "caixa" característica do gift do Telegram sem
          copiar literalmente a UI deles. */}
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-base-700 to-base-800">
        <GiftMedia nft={nft} />
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

        {topAttributes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topAttributes.map((attr) => (
              <span
                key={attr.trait}
                className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50"
              >
                {attr.value}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          {nft.isListed ? (
            <div className="flex items-center gap-1 rounded-lg bg-base-700 px-2 py-1">
              <Diamond size={12} className="text-gift" />
              <span className="font-display text-sm font-semibold text-gift">
                {nft.price.amount.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-medium uppercase tracking-wide text-white/30">
              Sem preço on-chain
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
