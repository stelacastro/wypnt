import { useEffect, useState } from "react";
import { useTonAddress, useTonWallet } from "@tonconnect/ui-react";
import { Tag } from "lucide-react";
import WalletConnect from "../WalletConnect";
import NFTGrid from "../NFTGrid";
import { fetchAggregatedNfts, simulateListing } from "../../services/nftService";
import type { UnifiedNFT } from "../../types/nft";

export default function WalletView() {
  const wallet = useTonWallet();
  const address = useTonAddress();
  const [items, setItems] = useState<UnifiedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [listingId, setListingId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");

  useEffect(() => {
    if (!wallet) return;
    setLoading(true);
    // Em produção: `fetchAggregatedNfts({ owner: address })` — o backend
    // filtraria por dono real usando o índice de cada provedor.
    fetchAggregatedNfts()
      .then((res) => setItems(res.items.slice(0, 2))) // mock: "meus" NFTs
      .finally(() => setLoading(false));
  }, [wallet]);

  async function confirmListing(nft: UnifiedNFT) {
    const price = Number(priceInput);
    if (!price || price <= 0) return;
    await simulateListing(nft.id, price);
    setListingId(null);
    setPriceInput("");
  }

  if (!wallet) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 pt-24 text-center">
        <p className="text-sm text-white/50">
          Conecte sua carteira para ver seus gifts e colecionáveis TON.
        </p>
        <WalletConnect />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-3">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white">Minha carteira</h1>
          <p className="truncate text-xs text-white/40">{address}</p>
        </div>
        <WalletConnect />
      </header>

      <NFTGrid
        items={items}
        loading={loading}
        onSelect={(nft) => {
          setListingId(nft.id);
          setPriceInput(nft.price.amount.toString());
        }}
      />

      {listingId && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/60 backdrop-blur-sm">
          <div className="w-full rounded-t-2xl bg-base-900 p-4 ring-1 ring-white/10">
            <p className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-white">
              <Tag size={16} className="text-gift" /> Listar item para venda
            </p>
            <label className="mb-1 block text-xs text-white/40">Preço (TON)</label>
            <input
              type="number"
              inputMode="decimal"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="mb-4 w-full rounded-xl bg-base-800 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-ton"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setListingId(null)}
                className="flex-1 rounded-xl bg-base-800 py-3 text-sm font-medium text-white/70 ring-1 ring-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmListing(items.find((i) => i.id === listingId)!)}
                className="flex-1 rounded-xl bg-ton py-3 text-sm font-semibold text-white"
              >
                Confirmar listagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
