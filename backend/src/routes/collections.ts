import { Router } from "express";
import { cache } from "../services/cache.js";
import { fetchCollectionsList, fetchCollectionAttributes } from "../services/providers/tonapi.js";

export const collectionsRouter = Router();

// Floor é amostrado a cada chamada (ver providers/tonapi.ts), então damos um
// TTL um pouco mais longo que o feed de itens pra não martelar a TonAPI toda
// vez que o modal de coleções é reaberto.
const LIST_CACHE_TTL_MS = 60_000;
// Traits de uma coleção mudam raramente (só quando novos itens são
// mintados) — TTL bem mais longo.
const ATTRIBUTES_CACHE_TTL_MS = 5 * 60_000;

/**
 * GET /api/collections?search=...&limit=...&offset=...
 *
 * Alimenta o modal "Filtro por Coleção": thumbnail, nome, supply, floor
 * estimado e volume 24h (quando disponível) — tudo buscado dinamicamente,
 * sem nenhuma coleção fixa no código. O campo `search` filtra por nome no
 * próprio backend antes de retornar.
 */
collectionsRouter.get("/", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const offset = req.query.offset ? Number(req.query.offset) : undefined;
  const cacheKey = `collections:${search ?? ""}:${limit ?? ""}:${offset ?? ""}`;

  try {
    const collections = await cache.wrap(cacheKey, LIST_CACHE_TTL_MS, () =>
      fetchCollectionsList({ search, limit, offset })
    );
    res.json({ collections });
  } catch (err) {
    console.error("[GET /api/collections] failed:", err);
    res.status(502).json({ error: "Falha ao buscar coleções." });
  }
});

/**
 * GET /api/collections/:address/attributes
 *
 * Alimenta os dropdowns dinâmicos "Model", "Backdrop", "Symbol" (e qualquer
 * outro trait que a coleção tiver) na barra de filtros horizontal — ver
 * comentário detalhado em providers/tonapi.ts sobre como isso é agregado.
 */
collectionsRouter.get("/:address/attributes", async (req, res) => {
  const { address } = req.params;
  const cacheKey = `collection-attrs:${address}`;

  try {
    const attributes = await cache.wrap(cacheKey, ATTRIBUTES_CACHE_TTL_MS, () =>
      fetchCollectionAttributes(address)
    );
    res.json({ attributes });
  } catch (err) {
    console.error(`[GET /api/collections/${address}/attributes] failed:`, err);
    res.status(502).json({ error: "Falha ao buscar atributos da coleção." });
  }
});
