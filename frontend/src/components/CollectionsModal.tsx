import { useEffect, useMemo, useState } from "react";
import { X, Search, Gift } from "lucide-react";
import { fetchCollections } from "../services/collectionService";
import type { UnifiedCollection } from "../types/collection";

interface CollectionsModalProps {
  open: boolean;
  onClose: () => void;
  selectedAddress?: string;
  onSelect: (collection: UnifiedCollection | null) => void;
}

function formatItemsCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return String(n);
}

function formatTon(amount?: number): string {
  if (amount === undefined) return "—";
  return `${amount.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} TON`;
}

function CollectionRowSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-xl bg-base-800 p-2.5">
      <div className="h-11 w-11 shrink-0 rounded-lg bg-base-700" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/2 rounded bg-base-700" />
        <div className="h-2.5 w-1/3 rounded bg-base-700" />
      </div>
    </div>
  );
}

export default function CollectionsModal({
  open,
  onClose,
  selectedAddress,
  onSelect,
}: CollectionsModalProps) {
  const [collections, setCollections] = useState<UnifiedCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Busca a lista completa de coleções assim que o modal abre — a partir
  // daí o campo "Quick find" filtra localmente em memória (sem nova
  // requisição a cada tecla digitada).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCollections()
      .then((data) => {
        if (!cancelled) setCollections(data);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar as coleções agora.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((c) => c.name.toLowerCase().includes(q));
  }, [collections, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-base-900 ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <p className="font-display text-base font-semibold text-white">Coleções</p>
          <button onClick={onClose} aria-label="Fechar" className="text-white/40">
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-white/5 p-3">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Quick find..."
              className="w-full rounded-full bg-base-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 ring-1 ring-white/10 focus:outline-none focus:ring-ton"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && (
            <div className="flex flex-col gap-2 p-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <CollectionRowSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && error && <p className="p-4 text-center text-xs text-danger">{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <p className="p-4 text-center text-xs text-white/40">Nenhuma coleção encontrada.</p>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="flex flex-col gap-1">
              {selectedAddress && (
                <button
                  type="button"
                  onClick={() => {
                    onSelect(null);
                    onClose();
                  }}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-white/50 hover:bg-base-800"
                >
                  <X size={13} /> Limpar seleção de coleção
                </button>
              )}
              {filtered.map((c) => {
                const active = c.address === selectedAddress;
                return (
                  <button
                    key={c.address}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      onClose();
                    }}
                    className={`flex items-center gap-3 rounded-xl p-2.5 text-left ring-1 ${
                      active
                        ? "bg-ton/10 ring-ton/40"
                        : "bg-base-800 ring-white/5 hover:bg-base-700"
                    }`}
                  >
                    <img
                      src={c.image}
                      alt={c.name}
                      className="h-11 w-11 shrink-0 rounded-lg bg-base-700 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{c.name}</p>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-white/40">
                        <Gift size={11} />
                        <span>{formatItemsCount(c.itemsCount)} itens</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-gift">{formatTon(c.floorPrice)}</p>
                      <p className="text-[10px] text-white/30">
                        Vol. 24h: {c.volume24h !== undefined ? formatTon(c.volume24h) : "—"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
