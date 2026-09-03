// Espelha frontend/src/types/nft.ts — em um monorepo real isto viraria um
// pacote `@ton-nft-hub/shared` importado pelos dois lados para evitar
// duplicação e drift de tipos.

export type NftSource = "getgems" | "tonapi" | "fragment";

export interface UnifiedNFT {
  id: string;
  name: string;
  index: string;
  imageUrl: string;
  collection: {
    name: string;
    address: string;
    verified: boolean;
  };
  price: {
    amount: number;
    currency: "TON";
  };
  owner: {
    address: string;
    displayName?: string;
  };
  source: NftSource;
  isListed: boolean;
  attributes?: Array<{ trait: string; value: string }>;
}

export interface FetchNftsQuery {
  collection?: string;
  cursor?: string;
  limit?: number;
  sort?: "price_asc" | "price_desc" | "recent";
}
