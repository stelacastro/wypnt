import axios from "axios";
import type { UnifiedNFT, FetchNftsQuery } from "../../types.js";

/**
 * Adapter para a TON API (https://tonapi.io) — API REST pública/paga que
 * indexa a blockchain TON diretamente (não depende de um marketplace
 * específico), útil para dados "canônicos" de coleção/propriedade.
 *
 * Doc de referência: https://docs.tonconsole.com/tonapi
 * Endpoint usado aqui: GET /v2/nfts/collections/{account_id}/items
 *
 * A chave de API fica só no backend (nunca no bundle do frontend).
 */
const TONAPI_BASE_URL = "https://tonapi.io";
const TONAPI_KEY = process.env.TONAPI_KEY; // definir em .env

const client = axios.create({
  baseURL: TONAPI_BASE_URL,
  timeout: 10_000,
  headers: TONAPI_KEY ? { Authorization: `Bearer ${TONAPI_KEY}` } : undefined,
});

interface TonApiNftItem {
  address: string;
  index: number;
  owner?: { address: string };
  collection?: { name: string; address: string };
  metadata: {
    name: string;
    image?: string;
    attributes?: { trait_type: string; value: string }[];
  };
  sale?: {
    price: { value: string; token_name: string };
  };
}

interface TonApiNftItemsResponse {
  nft_items: TonApiNftItem[];
}

function normalize(raw: TonApiNftItem): UnifiedNFT {
  return {
    id: `tonapi:${raw.address}`,
    name: raw.metadata.name ?? `NFT #${raw.index}`,
    index: `#${raw.index}`,
    imageUrl: raw.metadata.image ?? "",
    collection: {
      name: raw.collection?.name ?? "Unknown collection",
      address: raw.collection?.address ?? "",
      // TonAPI não expõe "verificado" nativamente; cruzar com uma
      // allowlist própria de endereços de coleção confiáveis.
      verified: false,
    },
    price: {
      amount: raw.sale ? Number(raw.sale.price.value) / 1e9 : 0,
      currency: "TON",
    },
    owner: { address: raw.owner?.address ?? "" },
    source: "tonapi",
    isListed: Boolean(raw.sale),
    attributes: raw.metadata.attributes?.map((a) => ({ trait: a.trait_type, value: a.value })),
  };
}

export async function fetchFromTonApi(query: FetchNftsQuery): Promise<UnifiedNFT[]> {
  if (!query.collection) {
    // Sem endereço de coleção, a rota de "items by collection" não se
    // aplica; um agregador real usaria aqui uma rota de "trending" ou
    // manteria uma allowlist de coleções para varrer em paralelo.
    return [];
  }

  const { data } = await client.get<TonApiNftItemsResponse>(
    `/v2/nfts/collections/${query.collection}/items`,
    { params: { limit: query.limit ?? 20, offset: 0 } }
  );

  return data.nft_items.map(normalize);
}
