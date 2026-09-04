import type { NftSource } from "../types/nft";

const SOURCE_META: Record<NftSource, { label: string; className: string }> = {
  getgems: { label: "Getgems", className: "bg-[#0AF37C]/15 text-[#0AF37C]" },
  fragment: { label: "Fragment", className: "bg-white/15 text-white" },
  // Item on-chain sem correspondência confirmada de plataforma (inclui
  // itens custodiados por MRKT/Portals/Tonnel — não atribuímos badge
  // específico a eles, ver backend/src/config/marketplaces.ts).
  unknown: { label: "On-chain", className: "bg-white/10 text-white/50" },
};

export default function PlatformBadge({ source }: { source: NftSource }) {
  const meta = SOURCE_META[source];
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
