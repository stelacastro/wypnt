import axios from "axios";
import type { FetchNftsParams, FetchNftsResult, UnifiedNFT } from "../types/nft";

/**
 * Em produção, o frontend NUNCA deve chamar Getgems/TonAPI diretamente:
 * ele fala com o nosso backend (`/api/nfts`), que já devolve dados
 * cacheados e normalizados (ver backend/src/routes/nfts.ts).
 *
 * `USE_MOCK=true` permite desenvolver a UI sem precisar do backend rodando,
 * e serve de referência de "shape" dos dados enquanto as integrações reais
 * não estão plugadas.
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

const api = axios.create({ baseURL: API_BASE_URL, timeout: 8000 });

// ---------------------------------------------------------------------------
// Normalização — exemplo de como cada origem seria mapeada para UnifiedNFT.
// Estas funções espelham o que roda no backend (services/providers/*.ts);
// estão aqui também para deixar claro, no frontend, o contrato que se
// espera de cada provedor caso a normalização precise ser feita client-side.
// ---------------------------------------------------------------------------

/** Formato (simplificado) de um item retornado pela API GraphQL da Getgems. */
interface GetgemsRawNft {
  address: string;
  name: string;
  index: number;
  image: { baseUrl: string };
  collection: { name: string; address: string; approvedByUsersCount: number };
  sale?: { fullPrice: string }; // nanoTON, string para evitar overflow
  owner: { address: string; name?: string };
}

function normalizeGetgems(raw: GetgemsRawNft): UnifiedNFT {
  return {
    id: `getgems:${raw.address}`,
    name: raw.name,
    index: `#${raw.index}`,
    imageUrl: raw.image.baseUrl,
    collection: {
      name: raw.collection.name,
      address: raw.collection.address,
      verified: raw.collection.approvedByUsersCount > 0,
    },
    price: {
      amount: raw.sale ? Number(BigInt(raw.sale.fullPrice)) / 1e9 : 0,
      currency: "TON",
    },
    owner: { address: raw.owner.address, displayName: raw.owner.name },
    source: "getgems",
    isListed: Boolean(raw.sale),
  };
}

/** Formato (simplificado) de um NFT retornado por tonapi.io (/v2/nfts/...). */
interface TonApiRawNft {
  address: string;
  index: number;
  metadata: { name: string; image?: string; attributes?: { trait_type: string; value: string }[] };
  collection?: { name: string; address: string };
  sale?: { price: { value: string; token_name: string } };
  owner?: { address: string };
}

function normalizeTonApi(raw: TonApiRawNft): UnifiedNFT {
  return {
    id: `tonapi:${raw.address}`,
    name: raw.metadata.name,
    index: `#${raw.index}`,
    imageUrl: raw.metadata.image ?? "",
    collection: {
      name: raw.collection?.name ?? "Unknown",
      address: raw.collection?.address ?? "",
      verified: false, // tonapi não expõe verificação diretamente; cruzar com allowlist própria
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

// ---------------------------------------------------------------------------
// Mock data — usado enquanto USE_MOCK=true. Reflete o card visto no design
// de referência ("Chill Flame", "Mini Oscar", collectible gifts).
// ---------------------------------------------------------------------------

const MOCK_NFTS: UnifiedNFT[] = [
  {
    id: "getgems:mock-1",
    name: "Chill Flame",
    index: "#374338",
    imageUrl: "https://placehold.co/400x400/7A1F3D/FFFFFF?text=Chill+Flame",
    collection: { name: "Chill Flame", address: "EQC...mock1", verified: true },
    price: { amount: 4.05, currency: "TON" },
    owner: { address: "UQAbc...123" },
    source: "getgems",
    isListed: true,
  },
  {
    id: "tonapi:mock-2",
    name: "Mini Oscar",
    index: "#2912",
    imageUrl: "https://placehold.co/400x400/B8860B/FFFFFF?text=Mini+Oscar",
    collection: { name: "Mini Oscar", address: "EQC...mock2", verified: true },
    price: { amount: 71.14, currency: "TON" },
    owner: { address: "UQDef...456" },
    source: "tonapi",
    isListed: true,
  },
  {
    id: "getgems:mock-3",
    name: "Lucky Snake 2025",
    index: "#5581",
    imageUrl: "https://placehold.co/400x400/2E4A6B/FFFFFF?text=Lucky+Snake",
    collection: { name: "Lucky Snake", address: "EQC...mock3", verified: false },
    price: { amount: 3.7, currency: "TON" },
    owner: { address: "UQGhi...789" },
    source: "getgems",
    isListed: true,
  },
  {
    id: "fragment:mock-4",
    name: "Chill Flame",
    index: "#80808",
    imageUrl: "https://placehold.co/400x400/6B2E8C/FFFFFF?text=Chill+Flame",
    collection: { name: "Chill Flame", address: "EQC...mock1", verified: true },
    price: { amount: 44.03, currency: "TON" },
    owner: { address: "UQJkl...012" },
    source: "fragment",
    isListed: true,
  },
];

async function fetchMock(params: FetchNftsParams): Promise<FetchNftsResult> {
  await new Promise((r) => setTimeout(r, 350)); // simula latência de rede
  let items = [...MOCK_NFTS];

  if (params.collection) {
    items = items.filter((n) =>
      n.collection.name.toLowerCase().includes(params.collection!.toLowerCase())
    );
  }
  if (params.sort === "price_asc") items.sort((a, b) => a.price.amount - b.price.amount);
  if (params.sort === "price_desc") items.sort((a, b) => b.price.amount - a.price.amount);

  return { items, nextCursor: undefined };
}

// ---------------------------------------------------------------------------
// API pública do serviço
// ---------------------------------------------------------------------------

export async function fetchAggregatedNfts(
  params: FetchNftsParams = {}
): Promise<FetchNftsResult> {
  if (USE_MOCK) return fetchMock(params);

  // Backend já retorna itens no formato UnifiedNFT (ver backend/src/routes/nfts.ts),
  // então aqui não é necessário reaplicar normalizeGetgems/normalizeTonApi —
  // essas funções documentam o mapeamento que o backend replica.
  const { data } = await api.get<FetchNftsResult>("/api/nfts", { params });
  return data;
}

export async function fetchNftById(id: string): Promise<UnifiedNFT | null> {
  if (USE_MOCK) return MOCK_NFTS.find((n) => n.id === id) ?? null;
  const { data } = await api.get<UnifiedNFT>(`/api/nfts/${encodeURIComponent(id)}`);
  return data;
}

/**
 * Simula o envio de uma listagem/compra. Em uma implementação real, isto
 * dispara uma transação assinada pela carteira do usuário via TON Connect
 * (ex.: `tonConnectUI.sendTransaction({...})`) apontando para o contrato
 * NFTItem/Sale correspondente à origem (Getgems usa seu próprio contrato de
 * sale; um marketplace nativo TON usaria o padrão NftSale#Fixed price).
 * Aqui apenas resolvemos localmente para fins de demonstração de fluxo.
 */
export async function simulatePurchase(nftId: string): Promise<{ ok: true; txHash: string }> {
  await new Promise((r) => setTimeout(r, 900));
  return { ok: true, txHash: `MOCK_TX_${nftId}_${Date.now()}` };
}

export async function simulateListing(
  nftId: string,
  priceTon: number
): Promise<{ ok: true; nftId: string; priceTon: number }> {
  await new Promise((r) => setTimeout(r, 700));
  return { ok: true, nftId, priceTon };
}

export { normalizeGetgems, normalizeTonApi };
