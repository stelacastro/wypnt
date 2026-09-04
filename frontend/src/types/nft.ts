/**
 * Marketplaces/origens suportadas. Cada uma tem seu próprio formato de
 * payload — o `nftService` é responsável por normalizar tudo para
 * `UnifiedNFT` antes de chegar nos componentes.
 */
export type NftSource = "getgems" | "fragment" | "unknown";

export interface UnifiedNFT {
  /** ID interno estável, prefixado pela origem: ex. "getgems:123" */
  id: string;
  name: string;
  /** Ex.: "#374338" — número de item dentro da coleção */
  index: string;
  imageUrl: string;
  collection: {
    name: string;
    address: string;
    verified: boolean;
  };
  price: {
    amount: number; // em TON
    currency: "TON";
  };
  owner: {
    address: string;
    displayName?: string;
  };
  source: NftSource;
  /** Link de destino ao clicar "Ver oferta" — sempre abre no app oficial da origem. */
  sourceUrl: string;
  /** Link oficial t.me/nft/... — best-effort, ver backend/src/services/links.ts. */
  officialTelegramUrl?: string;
  /** Se o item está atualmente listado à venda */
  isListed: boolean;
  attributes?: Array<{ trait: string; value: string }>;
}

export interface FetchNftsParams {
  collection?: string;
  cursor?: string;
  limit?: number;
  sort?: "price_asc" | "price_desc" | "recent";
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Ex.: { Model: ["Pumpkin"], Backdrop: ["Onyx Black"] } */
  attributes?: Record<string, string[]>;
}

export interface FetchNftsResult {
  items: UnifiedNFT[];
  nextCursor?: string;
}

/** Estado de uma "listagem simulada" mantido no cliente (sem transação real). */
export interface SimulatedListing {
  nftId: string;
  priceTon: number;
  createdAt: number;
}
