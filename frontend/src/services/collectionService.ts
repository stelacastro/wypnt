import axios from "axios";
import type { UnifiedCollection, CollectionAttribute } from "../types/collection";

/**
 * Mesmo padrão de nftService.ts: em produção (VITE_USE_MOCK=false) o
 * frontend fala só com o nosso backend (`/api/collections`), que já busca
 * tudo dinamicamente na TonAPI (ver backend/src/services/providers/tonapi.ts)
 * — nenhuma coleção, trait ou valor fica hardcoded aqui.
 *
 * O mock abaixo existe só pra desenvolver a UI sem o backend rodando, e
 * espelha as mesmas coleções/atributos usados em nftService.ts (MOCK_NFTS)
 * pra manter a demonstração consistente ponta a ponta.
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

const api = axios.create({ baseURL: API_BASE_URL, timeout: 10_000 });

const MOCK_COLLECTIONS: UnifiedCollection[] = [
  {
    address: "EQC...mock1",
    name: "Chill Flame",
    image: "https://placehold.co/200x200/7A1F3D/FFFFFF?text=Chill+Flame",
    itemsCount: 188,
    floorPrice: 4.05,
    volume24h: 312.4,
  },
  {
    address: "EQC...mock2",
    name: "Mini Oscar",
    image: "https://placehold.co/200x200/B8860B/FFFFFF?text=Mini+Oscar",
    itemsCount: 8000,
    floorPrice: undefined,
    volume24h: undefined,
  },
  {
    address: "EQC...mock3",
    name: "Lucky Snake",
    image: "https://placehold.co/200x200/2E4A6B/FFFFFF?text=Lucky+Snake",
    itemsCount: 5581,
    floorPrice: 3.7,
    volume24h: 0,
  },
];

const MOCK_ATTRIBUTES: Record<string, CollectionAttribute[]> = {
  "EQC...mock1": [
    { trait: "Model", values: [{ value: "Pumpkin", count: 12 }, { value: "Classic", count: 44 }] },
    { trait: "Backdrop", values: [{ value: "Onyx Black", count: 20 }, { value: "Ivory", count: 30 }] },
    { trait: "Symbol", values: [{ value: "Illuminati", count: 5 }] },
  ],
  "EQC...mock2": [
    { trait: "Model", values: [{ value: "Golden", count: 8 }, { value: "Silver", count: 61 }] },
    { trait: "Backdrop", values: [{ value: "Ruby Red", count: 15 }] },
  ],
  "EQC...mock3": [
    { trait: "Model", values: [{ value: "Emerald", count: 33 }] },
    { trait: "Symbol", values: [{ value: "Fortune", count: 9 }] },
  ],
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchCollectionsMock(search?: string): Promise<UnifiedCollection[]> {
  await delay(300);
  if (!search) return MOCK_COLLECTIONS;
  const q = search.trim().toLowerCase();
  return MOCK_COLLECTIONS.filter((c) => c.name.toLowerCase().includes(q));
}

async function fetchCollectionAttributesMock(address: string): Promise<CollectionAttribute[]> {
  await delay(250);
  return MOCK_ATTRIBUTES[address] ?? [];
}

/** Lista de coleções para o modal de filtro — busca dinâmica, sem dado fixo. */
export async function fetchCollections(search?: string): Promise<UnifiedCollection[]> {
  if (USE_MOCK) return fetchCollectionsMock(search);

  const { data } = await api.get<{ collections: UnifiedCollection[] }>("/api/collections", {
    params: { search },
  });
  return data.collections;
}

/** Traits agregados (Model/Backdrop/Symbol/...) de UMA coleção específica. */
export async function fetchCollectionAttributes(
  collectionAddress: string
): Promise<CollectionAttribute[]> {
  if (USE_MOCK) return fetchCollectionAttributesMock(collectionAddress);

  const { data } = await api.get<{ attributes: CollectionAttribute[] }>(
    `/api/collections/${encodeURIComponent(collectionAddress)}/attributes`
  );
  return data.attributes;
}
