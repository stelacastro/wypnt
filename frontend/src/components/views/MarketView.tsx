import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import { X, Diamond, ExternalLink, Send } from "lucide-react";
import { fetchAggregatedNfts } from "../../services/nftService";
import type { FetchNftsParams, UnifiedNFT } from "../../types/nft";
import NFTGrid from "../NFTGrid";
import FilterBar from "../FilterBar";
import PlatformBadge from "../PlatformBadge";

const PLATFORM_LABEL: Record<UnifiedNFT["source"], string> = {
  getgems: "Getgems",
  fragment: "Fragment",
  unknown: "On-chain",
};

export default function MarketView() {
  const [items, setItems] = useState<UnifiedNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<NonNullable<FetchNftsParams["sort"]>>("recent");
  const [selected, setSelected] = useState<UnifiedNFT | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAggregatedNfts({ sort })
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sort]);

  /**
   * Em vez de simular uma compra dentro do nosso app, redirecionamos pro
   * mini app/site oficial de onde o item está listado. `openLink` abre
   * URLs https normais (ex. getgems.io) no navegador in-app do Telegram;
   * links t.me (ex. o mini app da própria Getgems, @getgemsnftbot) devem
   * usar `openTelegramLink` para abrir nativamente dentro do Telegram.
   */
  function handleOpenListing(nft: UnifiedNFT) {
    if (nft.sourceUrl.startsWith("https://t.me/")) {
      WebApp.openTelegramLink(nft.sourceUrl);
    } else {
      WebApp.openLink(nft.sourceUrl);
    }
  }

  function handleOpenOfficialPage(nft: UnifiedNFT) {
    if (!nft.officialTelegramUrl) return;
    WebApp.openTelegramLink(nft.officialTelegramUrl);
  }

  function closeModal() {
    setSelected(null);
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-3">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white">Gifts Marketplace</h1>
          <p className="text-xs text-white/40">Agregado de Getgems, MRKT, Portals e Fragment</p>
        </div>
      </header>

      <FilterBar sort={sort} onSortChange={setSort} />

      <NFTGrid items={items} loading={loading} onSelect={setSelected} />

      {selected && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/60 backdrop-blur-sm">
          <div className="w-full rounded-t-2xl bg-base-900 p-4 ring-1 ring-white/10">
            <div className="mb-3 flex items-center justify-between">
              <PlatformBadge source={selected.source} />
              <button onClick={closeModal} aria-label="Fechar" className="text-white/40">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-3">
              <img
                src={selected.imageUrl}
                alt={selected.name}
                className="h-24 w-24 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-semibold text-white">{selected.name}</p>
                <p className="text-xs text-white/40">
                  {selected.index} · {selected.collection.name}
                </p>
                {selected.isListed ? (
                  <div className="mt-2 flex items-center gap-1">
                    <Diamond size={13} className="text-gift" />
                    <span className="font-display text-lg font-bold text-gift">
                      {selected.price.amount.toFixed(2)} TON
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-white/30">Sem preço confirmado on-chain</p>
                )}
              </div>
            </div>

            {/* Compra acontece na plataforma de origem, não aqui — o app
                só agrega e direciona. Isso evita custodiar fundos/itens
                e não depende de contrato de venda próprio.

                Só mostramos "Ver oferta na X" quando a origem é
                CONFIRMADA (hoje, só Getgems) — para itens genéricos
                "On-chain" (o que inclui qualquer item custodiado por
                MRKT/Portals/Tonnel), não fingimos saber onde comprar:
                mandamos só pro link oficial universal do Telegram. */}
            {selected.source === "getgems" ? (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenListing(selected)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ton py-3 text-sm font-semibold text-white"
                >
                  <ExternalLink size={16} />
                  Ver oferta na {PLATFORM_LABEL[selected.source]}
                </button>

                {selected.officialTelegramUrl && (
                  <button
                    type="button"
                    onClick={() => handleOpenOfficialPage(selected)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-base-800 py-2.5 text-xs font-medium text-white/60 ring-1 ring-white/10"
                  >
                    <Send size={13} />
                    Ver página oficial no Telegram
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="mt-3 text-xs text-white/40">
                  Não conseguimos confirmar em qual marketplace este item está listado agora.
                  A página oficial do Telegram mostra o dono atual e os atributos.
                </p>
                {selected.officialTelegramUrl && (
                  <button
                    type="button"
                    onClick={() => handleOpenOfficialPage(selected)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-ton py-3 text-sm font-semibold text-white"
                  >
                    <Send size={16} />
                    Ver página oficial no Telegram
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
