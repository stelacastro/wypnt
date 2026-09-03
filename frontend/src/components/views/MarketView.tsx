import { useEffect, useState } from "react";
import { useTonWallet } from "@tonconnect/ui-react";
import { X, Diamond, Loader2 } from "lucide-react";
import { fetchAggregatedNfts, simulatePurchase } from "../../services/nftService";
import type { FetchNftsParams, UnifiedNFT } from "../../types/nft";
import NFTGrid from "../NFTGrid";
import FilterBar from "../FilterBar";
import PlatformBadge from "../PlatformBadge";

export default function MarketView() {
  const wallet = useTonWallet();
  const [items, setItems] = useState<UnifiedNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<NonNullable<FetchNftsParams["sort"]>>("recent");
  const [selected, setSelected] = useState<UnifiedNFT | null>(null);
  const [purchaseState, setPurchaseState] = useState<"idle" | "pending" | "done">("idle");

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

  async function handleBuy(nft: UnifiedNFT) {
    if (!wallet) {
      // Em produção: abrir o modal do TON Connect aqui em vez de apenas alertar.
      return;
    }
    setPurchaseState("pending");
    // Fluxo real: montar o payload da mensagem para o contrato de venda
    // (endereço do sale contract da origem `nft.source`) e chamar
    // `tonConnectUI.sendTransaction({ messages: [...] })`. Aqui simulamos
    // a confirmação para demonstrar o fluxo de UI.
    await simulatePurchase(nft.id);
    setPurchaseState("done");
  }

  function closeModal() {
    setSelected(null);
    setPurchaseState("idle");
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-3">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white">Gifts Marketplace</h1>
          <p className="text-xs text-white/40">Agregado de Getgems, Fragment e TON API</p>
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
                <div className="mt-2 flex items-center gap-1">
                  <Diamond size={13} className="text-gift" />
                  <span className="font-display text-lg font-bold text-gift">
                    {selected.price.amount.toFixed(2)} TON
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={purchaseState === "pending"}
              onClick={() => handleBuy(selected)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ton py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {purchaseState === "pending" && <Loader2 size={16} className="animate-spin" />}
              {purchaseState === "idle" && (wallet ? "Comprar agora" : "Conecte a carteira para comprar")}
              {purchaseState === "pending" && "Confirmando transação..."}
              {purchaseState === "done" && "Compra simulada com sucesso ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
