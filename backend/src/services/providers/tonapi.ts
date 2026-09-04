import axios from "axios";
import type {
  UnifiedNFT,
  FetchNftsQuery,
  UnifiedCollection,
  CollectionAttribute,
} from "../../types.js";
import { resolvePlatform } from "../../config/marketplaces.js";
import { buildGetgemsUrl, buildOfficialTelegramGiftUrl } from "../links.js";

/**
 * Adapter para a TON API (https://tonapi.io) — API REST que indexa a
 * blockchain TON diretamente. Documentação: https://docs.tonconsole.com/tonapi
 *
 * Duas rotas usadas aqui:
 *  - GET /v2/nfts/collections/{account_id}/items   → itens de uma coleção
 *  - GET /v2/accounts/{account_id}/nfts             → itens que uma carteira possui
 *
 * A chave de API (gratuita, obtida em https://tonconsole.com) fica só no
 * backend. Sem chave, o tonapi.io ainda funciona mas com rate limit bem
 * mais baixo — o suficiente pra testar, não pra produção com tráfego real.
 */
const TONAPI_BASE_URL = "https://tonapi.io";
const TONAPI_KEY = process.env.TONAPI_KEY; // definir em .env

const client = axios.create({
  baseURL: TONAPI_BASE_URL,
  timeout: 10_000,
  headers: TONAPI_KEY ? { Authorization: `Bearer ${TONAPI_KEY}` } : undefined,
});

/**
 * Coleções "seed" que o marketplace agrega quando nenhum filtro de
 * coleção específico é passado. Em produção isso poderia vir de um
 * banco de dados curado (ex.: coleções verificadas + as mais buscadas),
 * mas um env var separado por vírgula já resolve pra começar.
 *
 * Exemplo real de Gift Telegram na TON: "Desk Calendars"
 *   EQBMcfMAZlMUr1W3X8kdEw3fJMUAaWH4-XcmE5R5RfFIY0E2
 */
const SEED_COLLECTIONS = (process.env.TON_COLLECTIONS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

interface TonApiNftItem {
  address: string;
  index: number;
  owner?: { address: string; name?: string };
  collection?: { name: string; address: string };
  metadata: {
    name: string;
    image?: string;
    attributes?: { trait_type: string; value: string }[];
  };
  sale?: {
    address?: string;
    // NOTA: o nome exato deste campo na resposta real da TonAPI precisa
    // ser confirmado contra uma chamada real (não documentado de forma
    // estável publicamente no momento). Deixamos opcional e com
    // optional-chaining em todo lugar que o lemos — se o campo não
    // existir, caímos no fallback por `owner.address` (custódia).
    market?: { name?: string; address?: string };
    price: { value: string; token_name: string };
  };
}

interface TonApiNftItemsResponse {
  nft_items: TonApiNftItem[];
}

function normalize(raw: TonApiNftItem): UnifiedNFT {
  const collectionAddress = raw.collection?.address ?? "";
  const name = raw.metadata.name ?? `NFT #${raw.index}`;

  const platform = resolvePlatform({
    saleMarketplaceAddress: raw.sale?.market?.address,
  });

  return {
    id: `${platform}:${raw.address}`,
    name,
    index: `#${raw.index}`,
    imageUrl: raw.metadata.image ?? "",
    collection: {
      name: raw.collection?.name ?? "Unknown collection",
      address: collectionAddress,
      // TonAPI não expõe "verificado" nativamente; cruzar com uma
      // allowlist própria de endereços de coleção confiáveis.
      verified: false,
    },
    price: {
      amount: raw.sale ? Number(raw.sale.price.value) / 1e9 : 0,
      currency: "TON",
    },
    owner: { address: raw.owner?.address ?? "", displayName: raw.owner?.name },
    source: platform,
    sourceUrl: buildGetgemsUrl(collectionAddress, raw.address),
    officialTelegramUrl: buildOfficialTelegramGiftUrl(name, raw.index),
    isListed: Boolean(raw.sale),
    attributes: raw.metadata.attributes?.map((a) => ({ trait: a.trait_type, value: a.value })),
  };
}

async function fetchCollectionItems(
  collectionAddress: string,
  limit: number
): Promise<UnifiedNFT[]> {
  const { data } = await client.get<TonApiNftItemsResponse>(
    `/v2/nfts/collections/${collectionAddress}/items`,
    { params: { limit, offset: 0 } }
  );
  return data.nft_items.map(normalize);
}

/**
 * Busca itens agregados. Se `query.collection` for passado, busca só
 * dessa coleção; senão, varre em paralelo a lista `SEED_COLLECTIONS`.
 */
export async function fetchFromTonApi(query: FetchNftsQuery): Promise<UnifiedNFT[]> {
  const collections = query.collection ? [query.collection] : SEED_COLLECTIONS;
  if (collections.length === 0) return [];

  const results = await Promise.allSettled(
    collections.map((addr) => fetchCollectionItems(addr, query.limit ?? 20))
  );

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

/** Formato de resposta de GET /v2/accounts/{account_id}/nfts */
interface TonApiAccountNftsResponse {
  nft_items: TonApiNftItem[];
}

/**
 * Busca os NFTs que uma carteira específica possui — usado pela tela
 * "Minha carteira". `indirect_ownership: true` inclui itens que estão
 * temporariamente em contratos de venda (ainda "seus" até a venda
 * concluir).
 */
export async function fetchOwnedFromTonApi(ownerAddress: string): Promise<UnifiedNFT[]> {
  const { data } = await client.get<TonApiAccountNftsResponse>(
    `/v2/accounts/${ownerAddress}/nfts`,
    { params: { limit: 50, offset: 0, indirect_ownership: true } }
  );
  return data.nft_items.map(normalize);
}

// ---------------------------------------------------------------------------
// Coleções (modal "Filtro por Coleção") + traits agregados (Model/Backdrop/
// Symbol/...) — tudo 100% dinâmico via TonAPI, sem lista hardcoded no front.
//
// NOTA IMPORTANTE sobre floor_price / volume_24h:
// A TonAPI (gratuita, sem API key de indexador pago) NÃO expõe um campo
// oficial de "floor price" nem de "volume 24h" por coleção — isso normalmente
// vem de um indexador de marketplace pago (Getgems/NFTScan/etc.) que agrega
// histórico de vendas. Sem acesso a isso, `floorPrice` aqui é uma ESTIMATIVA
// calculada amostrando os itens listados à venda da própria coleção (mesmo
// endpoint `/items` já usado em fetchCollectionItems) e pegando o menor
// preço encontrado na amostra — não é garantido ser o menor preço real de
// TODA a coleção se ela tiver milhares de itens, mas é o melhor sinal
// disponível sem uma API paga. `volume24h` fica `undefined` (a UI mostra
// "—") até que uma fonte de histórico de vendas seja integrada.
// ---------------------------------------------------------------------------

interface TonApiCollectionListItem {
  address: string;
  next_item_index: number;
  metadata?: {
    name?: string;
    image?: string;
    cover_image?: string;
    description?: string;
  };
  previews?: { resolution: string; url: string }[];
}

interface TonApiCollectionsListResponse {
  nft_collections: TonApiCollectionListItem[];
}

function pickCollectionImage(raw: TonApiCollectionListItem): string {
  return raw.metadata?.image ?? raw.previews?.[raw.previews.length - 1]?.url ?? "";
}

async function fetchCollectionsRaw(
  limit: number,
  offset: number
): Promise<TonApiCollectionListItem[]> {
  const { data } = await client.get<TonApiCollectionsListResponse>("/v2/nft/collections", {
    params: { limit, offset },
  });
  return data.nft_collections;
}

/** Quantos itens amostrar por coleção pra estimar o floor — ver nota acima. */
const FLOOR_SAMPLE_SIZE = 30;

async function estimateFloorPrice(address: string): Promise<number | undefined> {
  try {
    const items = await fetchCollectionItems(address, FLOOR_SAMPLE_SIZE);
    const listedPrices = items.filter((i) => i.isListed).map((i) => i.price.amount);
    if (listedPrices.length === 0) return undefined;
    return Math.min(...listedPrices);
  } catch {
    // Coleção pode não existir mais, endereço inválido, timeout, etc. —
    // preferimos "sem floor" a derrubar a lista inteira de coleções.
    return undefined;
  }
}

/**
 * Lista de coleções pro modal de filtro, já com nome/imagem/supply vindos
 * direto da TonAPI e floor estimado (ver nota no topo da seção). `search`
 * filtra por nome no servidor antes de gastar chamadas de floor só com as
 * coleções que o `search` já reduziu — assim uma busca não gasta tempo
 * amostrando floor de coleções que nem vão aparecer na tela.
 */
export async function fetchCollectionsList(query: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<UnifiedCollection[]> {
  const raw = await fetchCollectionsRaw(query.limit ?? 100, query.offset ?? 0);

  const filtered = query.search
    ? raw.filter((c) =>
        (c.metadata?.name ?? "").toLowerCase().includes(query.search!.toLowerCase())
      )
    : raw;

  return Promise.all(
    filtered.map(async (c) => ({
      address: c.address,
      name: c.metadata?.name ?? "Coleção sem nome",
      image: pickCollectionImage(c),
      // `next_item_index` é o índice do próximo item a ser mintado — pra
      // coleções sequenciais (o caso comum de Telegram Gifts) equivale ao
      // supply total atual. Aproximação documentada, não um "items_count"
      // literal da API (a TonAPI não expõe esse campo com esse nome).
      itemsCount: c.next_item_index ?? 0,
      floorPrice: await estimateFloorPrice(c.address),
      volume24h: undefined,
    }))
  );
}

/**
 * Quantas páginas de itens amostrar pra montar a distribuição de traits de
 * uma coleção, e o tamanho de cada página (1000 é o limite máximo aceito
 * pelo endpoint `/items` da TonAPI). Coleções muito grandes (dezenas de
 * milhares de itens) não são varridas por completo — 3k itens já dá uma
 * distribuição de traits bastante representativa pra fins de filtro de UI,
 * e evita uma varredura lenta/custosa a cada troca de coleção.
 */
const ATTRIBUTE_SAMPLE_PAGES = 3;
const ATTRIBUTE_PAGE_SIZE = 1000;

/**
 * Atributos agregados (trait_type → valores + contagem) de uma coleção.
 *
 * TonAPI não documenta publicamente um endpoint dedicado tipo
 * `/v2/nft/collections/{address}/attributes` que devolva os traits já
 * agregados — por isso, em vez de depender de um endpoint não confirmado,
 * construímos a agregação a partir do endpoint que JÁ é usado e confirmado
 * neste arquivo (`/v2/nfts/collections/{address}/items`), lendo o
 * `metadata.attributes` de cada item da amostra e contando ocorrências.
 * Isso continua 100% dinâmico e livre de dado hardcoded — os nomes de
 * trait (Model/Backdrop/Symbol/...) e os valores vêm inteiramente do
 * metadata on-chain de cada coleção, o que muda de coleção pra coleção.
 */
export async function fetchCollectionAttributes(
  collectionAddress: string
): Promise<CollectionAttribute[]> {
  const tally = new Map<string, Map<string, number>>();

  for (let page = 0; page < ATTRIBUTE_SAMPLE_PAGES; page++) {
    const { data } = await client.get<TonApiNftItemsResponse>(
      `/v2/nfts/collections/${collectionAddress}/items`,
      { params: { limit: ATTRIBUTE_PAGE_SIZE, offset: page * ATTRIBUTE_PAGE_SIZE } }
    );

    for (const item of data.nft_items) {
      for (const attr of item.metadata.attributes ?? []) {
        if (!tally.has(attr.trait_type)) tally.set(attr.trait_type, new Map());
        const values = tally.get(attr.trait_type)!;
        values.set(attr.value, (values.get(attr.value) ?? 0) + 1);
      }
    }

    if (data.nft_items.length < ATTRIBUTE_PAGE_SIZE) break; // acabaram os itens
  }

  return Array.from(tally.entries()).map(([trait, values]) => ({
    trait,
    values: Array.from(values.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
  }));
}

