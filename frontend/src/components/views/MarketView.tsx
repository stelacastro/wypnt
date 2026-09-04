import { useCallback, useEffect, useRef, useState } from "react";
import WebApp from "@twa-dev/sdk";
import { X, Diamond, ExternalLink, Send, RefreshCw } from "lucide-react";
import { fetchAggregatedNfts } from "../../services/nftService";
import type { UnifiedNFT } from "../../types/nft";
import type { UnifiedCollection } from "../../types/collection";
import { EMPTY_FILTERS, countActiveFilters, type ActiveFilters } from "../../types/filters";
import NFTGrid from "../NFTGrid";
import SearchBar from "../SearchBar";
import FilterBar from "../FilterBar";
import FilterChips from "../FilterChips";
import FilterSheet from "../FilterSheet";
import CollectionsModal from "../CollectionsModal";
import PlatformBadge from "../PlatformBadge";

const PLATFORM_LABEL: Record<UnifiedNFT["source"], string> = {
  getgems: "Getgems",
  fragment: "Fragment",
  unknown: "On-chain",
};

// Não existe WebSocket/SSE público estável por coleção nas plataformas que
// agregamos (ver comentário em backend/src/routes/nfts.ts) — "tempo real"
// aqui é poll periódico. 20s é um equilíbrio entre atualidade percebida e
// não martelar as APIs de origem a cada usuário aberto no app.
const POLL_INTERVAL_MS = 20_000;

export default function MarketView() {
  const [items, setItems] = useState<UnifiedNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [searchDraft, setSearchDraft] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
  const [selected, setSelected] = useState<UnifiedNFT | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const res = await fetchAggregatedNfts({
      collection: filters.collection,
      sort: filters.sort,
      search: filters.search || undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      attributes: Object.keys(filters.attributes).length > 0 ? filters.attributes : undefined,
    });
    setItems(res.items);
    setLastUpdated(new Date());
  }, [filters]);

  // Debounce da busca — evita 1 request por tecla digitada.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: searchDraft })), 400);
    return () => clearTimeout(t);
  }, [searchDraft]);

  // Busca inicial + toda vez que os filtros mudam.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [load]);

  // Poll em segundo plano — não mostra o skeleton de loading (só refresca
  // os dados por trás), e é pausado enquanto o modal de detalhe está
  // aberto pra não trocar o card debaixo do dedo do usuário.
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (!selected) load();
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load, selected]);

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

  function handleSelectCollection(collection: UnifiedCollection | null) {
    setFilters((f) => ({
      ...f,
      collection: collection?.address,
      collectionName: collection?.name,
      // Traits (Model/Backdrop/Symbol/...) são por-coleção — trocar ou
      // limpar a coleção invalida qualquer seleção de atributo anterior.
      attributes: {},
    }));
  }

  const secondsAgo = lastUpdated ? Math.round((Date.now() - lastUpdated.getTime()) / 1000) : null;

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-3">
      <header>
        <h1 className="font-display text-xl font-semibold text-white">Gifts Marketplace</h1>
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <span>Agregado de Getgems e coleções on-chain</span>
          {secondsAgo !== null && (
            <span className="flex items-center gap-1 text-white/25">
              <RefreshCw size={10} /> {secondsAgo}s
            </span>
          )}
        </div>
      </header>

      <SearchBar value={searchDraft} onChange={setSearchDraft} />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        onOpenFilterSheet={() => setFilterSheetOpen(true)}
        onOpenCollections={() => setCollectionsModalOpen(true)}
        activeFilterCount={countActiveFilters(filters)}
      />

      <FilterChips filters={filters} onChange={setFilters} />

      <NFTGrid items={items} loading={loading} onSelect={setSelected} />

      <FilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        onApply={setFilters}
      />

      <CollectionsModal
        open={collectionsModalOpen}
        onClose={() => setCollectionsModalOpen(false)}
        selectedAddress={filters.collection}
        onSelect={handleSelectCollection}
      />

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

                {selected.attributes && selected.attributes.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {selected.attributes.map((attr) => (
                      <span
                        key={attr.trait}
                        className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50"
                      >
                        {attr.trait}: {attr.value}
                      </span>
                    ))}
                  </div>
                )}

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
                só agrega e direciona. Só mostramos "Ver oferta na X"
                quando a origem é CONFIRMADA (hoje, só Getgems); itens
                genéricos "On-chain" vão só pro link oficial universal. */}
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
