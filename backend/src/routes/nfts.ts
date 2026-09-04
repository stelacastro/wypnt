import { Router } from "express";
import { cache } from "../services/cache.js";
import { fetchFromGetgems } from "../services/providers/getgems.js";
import { fetchFromTonApi, fetchOwnedFromTonApi } from "../services/providers/tonapi.js";
import type { FetchNftsQuery, UnifiedNFT } from "../types.js";

export const nftsRouter = Router();

// TTL curto de propósito: não existe WebSocket/SSE público e estável para
// "item X foi vendido agora" nas plataformas que agregamos (a TonAPI expõe
// um stream de eventos de conta via SSE, mas não um "feed de vendas" pronto
// por coleção). Na prática, "tempo real" aqui significa poll frequente com
// cache curto — o frontend re-busca a cada ~20s (ver MarketView.tsx) e essa
// janela de 15s garante que picos de requisições simultâneas de vários
// usuários não multipliquem chamadas às APIs de origem.
const CACHE_TTL_MS = 15_000;

function sortItems(items: UnifiedNFT[], sort?: FetchNftsQuery["sort"]): UnifiedNFT[] {
  if (sort === "price_asc") return [...items].sort((a, b) => a.price.amount - b.price.amount);
  if (sort === "price_desc") return [...items].sort((a, b) => b.price.amount - a.price.amount);
  return items;
}

/** "Model:Pumpkin,Backdrop:Onyx Black" → [["Model","Pumpkin"], ["Backdrop","Onyx Black"]] */
function parseAttributeFilter(raw?: string): Array<[string, string]> {
  if (!raw) return [];
  return raw
    .split(",")
    .map((pair) => pair.split(":"))
    .filter((pair): pair is [string, string] => pair.length === 2)
    .map(([trait, value]) => [trait.trim(), value.trim()]);
}

function applyFilters(items: UnifiedNFT[], query: FetchNftsQuery): UnifiedNFT[] {
  let result = items;

  if (query.search) {
    const q = query.search.trim().toLowerCase();
    result = result.filter(
      (n) => n.name.toLowerCase().includes(q) || n.index.toLowerCase().includes(q.replace(/^#/, ""))
    );
  }

  if (query.minPrice !== undefined) {
    result = result.filter((n) => n.price.amount >= query.minPrice!);
  }
  if (query.maxPrice !== undefined) {
    result = result.filter((n) => n.price.amount <= query.maxPrice!);
  }

  const attrFilters = parseAttributeFilter(query.attributes);
  if (attrFilters.length > 0) {
    result = result.filter((n) =>
      attrFilters.every(([trait, value]) =>
        n.attributes?.some((a) => a.trait === trait && a.value === value)
      )
    );
  }

  return result;
}

/**
 * GET /api/nfts?collection=...&search=...&minPrice=...&maxPrice=...&attributes=Model:Pumpkin&sort=price_asc
 *
 * Busca em paralelo em todos os provedores configurados, mescla os
 * resultados já normalizados (`UnifiedNFT`), aplica busca/filtros/ordenação
 * e cacheia por `CACHE_TTL_MS`. A chave de cache inclui todos os
 * parâmetros — cada combinação de filtros tem seu próprio cache.
 */
nftsRouter.get("/", async (req, res) => {
  const query: FetchNftsQuery = {
    collection: typeof req.query.collection === "string" ? req.query.collection : undefined,
    sort: (req.query.sort as FetchNftsQuery["sort"]) ?? "recent",
    limit: req.query.limit ? Number(req.query.limit) : 20,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    attributes: typeof req.query.attributes === "string" ? req.query.attributes : undefined,
  };

  // A busca por texto/preço/atributo acontece DEPOIS da mesclagem, então
  // cacheamos a lista bruta por coleção e filtramos a cada request — assim
  // usuários com filtros diferentes reaproveitam o mesmo cache de rede.
  const rawCacheKey = `nfts-raw:${query.collection ?? "seed"}`;

  try {
    const rawItems = await cache.wrap(rawCacheKey, CACHE_TTL_MS, async () => {
      const [getgemsItems, tonApiItems] = await Promise.allSettled([
        fetchFromGetgems(query),
        fetchFromTonApi(query),
      ]);

      const merged: UnifiedNFT[] = [
        ...(getgemsItems.status === "fulfilled" ? getgemsItems.value : []),
        ...(tonApiItems.status === "fulfilled" ? tonApiItems.value : []),
      ];

      // Deduplica caso o mesmo NFT apareça indexado por mais de uma
      // origem (raro, mas possível para coleções cruzadas).
      return Array.from(new Map(merged.map((n) => [n.id, n])).values());
    });

    const filtered = applyFilters(rawItems, query);
    const sorted = sortItems(filtered, query.sort);

    res.json({ items: sorted, nextCursor: undefined });
  } catch (err) {
    console.error("[GET /api/nfts] failed:", err);
    res.status(502).json({ error: "Falha ao agregar dados dos marketplaces." });
  }
});

/**
 * GET /api/nfts/owner/:address
 *
 * NFTs que a carteira `:address` possui atualmente — usado pela tela
 * "Minha carteira" no frontend. Cacheado com TTL mais curto que o feed
 * geral, já que reflete estado de posse (que muda a cada compra/venda).
 */
nftsRouter.get("/owner/:address", async (req, res) => {
  const { address } = req.params;
  const cacheKey = `owner-nfts:${address}`;

  try {
    const items = await cache.wrap(cacheKey, 15_000, () => fetchOwnedFromTonApi(address));
    res.json({ items, nextCursor: undefined });
  } catch (err) {
    console.error(`[GET /api/nfts/owner/${address}] failed:`, err);
    res.status(502).json({ error: "Falha ao buscar NFTs da carteira." });
  }
});

/** GET /api/nfts/:id — detalhe de um item específico (ex.: "getgems:EQC..."). */
nftsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  const cacheKey = `nft:${id}`;

  const cached = cache.get<UnifiedNFT>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  // Numa implementação completa: rotear para o provider correto com base
  // no prefixo do id (`getgems:` / `tonapi:`) e buscar o item individual.
  res.status(404).json({ error: "NFT não encontrado ou cache expirado." });
});
