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
// Mock data — usado enquanto USE_MOCK=true. Reflete o card visto no design
// de referência ("Chill Flame", "Mini Oscar", collectible gifts).
// A normalização "de verdade" (Getgems/TonAPI → UnifiedNFT) vive no backend,
// em services/providers/*.ts — não duplicamos aqui para evitar drift de tipos.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Link builders — espelham backend/src/services/links.ts. Mantidos aqui só
// para os dados de mock; quando USE_MOCK=false, esses links já vêm prontos
// do backend (calculados na normalização de cada provider).
// ---------------------------------------------------------------------------

function buildGetgemsUrl(collectionAddress: string, itemAddress: string): string {
  return `https://getgems.io/collection/${collectionAddress}/${itemAddress}`;
}

function buildOfficialTelegramGiftUrl(name: string, index: string | number): string {
  const slug = name.replace(/\s+/g, "");
  const numericIndex = String(index).replace(/^#/, "");
  return `https://t.me/nft/${slug}-${numericIndex}`;
}

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
    sourceUrl: buildGetgemsUrl("EQC...mock1", "EQC...item1"),
    officialTelegramUrl: buildOfficialTelegramGiftUrl("Chill Flame", 374338),
    isListed: true,
    attributes: [
      { trait: "Model", value: "Pumpkin" },
      { trait: "Backdrop", value: "Onyx Black" },
      { trait: "Symbol", value: "Illuminati" },
    ],
  },
  {
    id: "unknown:mock-2",
    name: "Mini Oscar",
    index: "#2912",
    imageUrl: "https://placehold.co/400x400/B8860B/FFFFFF?text=Mini+Oscar",
    collection: { name: "Mini Oscar", address: "EQC...mock2", verified: true },
    price: { amount: 0, currency: "TON" },
    owner: { address: "UQDef...456" },
    source: "unknown",
    sourceUrl: buildGetgemsUrl("EQC...mock2", "EQC...item2"),
    officialTelegramUrl: buildOfficialTelegramGiftUrl("Mini Oscar", 2912),
    // Exemplo de item custodiado por uma plataforma que não conseguimos
    // atribuir com confiança (ex.: MRKT/Portals) — sem contrato de venda
    // on-chain, então não fingimos ter um preço.
    isListed: false,
    attributes: [
      { trait: "Model", value: "Golden" },
      { trait: "Backdrop", value: "Ruby Red" },
    ],
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
    sourceUrl: buildGetgemsUrl("EQC...mock3", "EQC...item3"),
    officialTelegramUrl: buildOfficialTelegramGiftUrl("Lucky Snake", 5581),
    isListed: true,
    attributes: [
      { trait: "Model", value: "Emerald" },
      { trait: "Symbol", value: "Fortune" },
    ],
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
    sourceUrl: buildGetgemsUrl("EQC...mock1", "EQC...item4"),
    officialTelegramUrl: buildOfficialTelegramGiftUrl("Chill Flame", 80808),
    isListed: true,
  },
];

async function fetchMock(params: FetchNftsParams): Promise<FetchNftsResult> {
  await new Promise((r) => setTimeout(r, 350)); // simula latência de rede
  let items = [...MOCK_NFTS];

  if (params.collection) {
    // O filtro real usa o endereço da coleção (vindo do modal de coleções),
    // mas aceitamos também um match por nome pra facilitar testes manuais
    // do mock digitando o nome direto.
    const c = params.collection.toLowerCase();
    items = items.filter(
      (n) => n.collection.address.toLowerCase() === c || n.collection.name.toLowerCase().includes(c)
    );
  }
  if (params.search) {
    const q = params.search.trim().toLowerCase();
    items = items.filter(
      (n) => n.name.toLowerCase().includes(q) || n.index.toLowerCase().includes(q.replace(/^#/, ""))
    );
  }
  if (params.minPrice !== undefined) items = items.filter((n) => n.price.amount >= params.minPrice!);
  if (params.maxPrice !== undefined) items = items.filter((n) => n.price.amount <= params.maxPrice!);
  if (params.attributes) {
    const pairs = Object.entries(params.attributes).flatMap(([trait, values]) =>
      values.map((value) => ({ trait, value }))
    );
    items = items.filter((n) =>
      pairs.every((p) => n.attributes?.some((a) => a.trait === p.trait && a.value === p.value))
    );
  }
  if (params.sort === "price_asc") items.sort((a, b) => a.price.amount - b.price.amount);
  if (params.sort === "price_desc") items.sort((a, b) => b.price.amount - a.price.amount);

  return { items, nextCursor: undefined };
}

/** { Model: ["Pumpkin"], Backdrop: ["Onyx Black"] } → "Model:Pumpkin,Backdrop:Onyx Black" */
function serializeAttributes(attributes?: Record<string, string[]>): string | undefined {
  if (!attributes) return undefined;
  const pairs = Object.entries(attributes).flatMap(([trait, values]) =>
    values.map((value) => `${trait}:${value}`)
  );
  return pairs.length > 0 ? pairs.join(",") : undefined;
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
  const { data } = await api.get<FetchNftsResult>("/api/nfts", {
    params: { ...params, attributes: serializeAttributes(params.attributes) },
  });
  return data;
}

export async function fetchNftById(id: string): Promise<UnifiedNFT | null> {
  if (USE_MOCK) return MOCK_NFTS.find((n) => n.id === id) ?? null;
  const { data } = await api.get<UnifiedNFT>(`/api/nfts/${encodeURIComponent(id)}`);
  return data;
}

/** NFTs que a carteira `ownerAddress` possui — alimenta a tela "Minha carteira". */
export async function fetchOwnedNfts(ownerAddress: string): Promise<UnifiedNFT[]> {
  if (USE_MOCK) return MOCK_NFTS.slice(0, 2);
  const { data } = await api.get<FetchNftsResult>(
    `/api/nfts/owner/${encodeURIComponent(ownerAddress)}`
  );
  return data.items;
}

export async function simulateListing(
  nftId: string,
  priceTon: number
): Promise<{ ok: true; nftId: string; priceTon: number }> {
  await new Promise((r) => setTimeout(r, 700));
  return { ok: true, nftId, priceTon };
}

