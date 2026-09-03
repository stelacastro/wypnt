import { Router } from "express";
import { cache } from "../services/cache.js";
import { fetchFromGetgems } from "../services/providers/getgems.js";
import { fetchFromTonApi } from "../services/providers/tonapi.js";
import type { FetchNftsQuery, UnifiedNFT } from "../types.js";

export const nftsRouter = Router();

const CACHE_TTL_MS = 30_000; // 30s — equilíbrio entre "dado fresco" e custo de API

function sortItems(items: UnifiedNFT[], sort?: FetchNftsQuery["sort"]): UnifiedNFT[] {
  if (sort === "price_asc") return [...items].sort((a, b) => a.price.amount - b.price.amount);
  if (sort === "price_desc") return [...items].sort((a, b) => b.price.amount - a.price.amount);
  return items;
}

/**
 * GET /api/nfts?collection=EQC...&sort=price_asc&limit=20
 *
 * Busca em paralelo em todos os provedores configurados, mescla os
 * resultados já normalizados (`UnifiedNFT`) e cacheia por
 * `CACHE_TTL_MS`. A chave de cache inclui todos os parâmetros
 * relevantes para não misturar respostas de queries diferentes.
 */
nftsRouter.get("/", async (req, res) => {
  const query: FetchNftsQuery = {
    collection: typeof req.query.collection === "string" ? req.query.collection : undefined,
    sort: (req.query.sort as FetchNftsQuery["sort"]) ?? "recent",
    limit: req.query.limit ? Number(req.query.limit) : 20,
  };

  const cacheKey = `nfts:${JSON.stringify(query)}`;

  try {
    const items = await cache.wrap(cacheKey, CACHE_TTL_MS, async () => {
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
      const deduped = Array.from(new Map(merged.map((n) => [n.id, n])).values());

      return sortItems(deduped, query.sort);
    });

    res.json({ items, nextCursor: undefined });
  } catch (err) {
    console.error("[GET /api/nfts] failed:", err);
    res.status(502).json({ error: "Falha ao agregar dados dos marketplaces." });
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
