// Espelha frontend/src/types/nft.ts — em um monorepo real isto viraria um
// pacote `@ton-nft-hub/shared` importado pelos dois lados para evitar
// duplicação e drift de tipos.

export type NftSource = "getgems" | "fragment" | "unknown";

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
  /** Link para "Ver oferta" — para onde o usuário é redirecionado ao comprar. */
  sourceUrl: string;
  /** Link oficial t.me/nft/... — best-effort, ver services/links.ts. */
  officialTelegramUrl?: string;
  isListed: boolean;
  attributes?: Array<{ trait: string; value: string }>;
}

export interface FetchNftsQuery {
  collection?: string;
  cursor?: string;
  limit?: number;
  sort?: "price_asc" | "price_desc" | "recent";
  /** Busca por nome ou índice (ex.: "Plush Pepe" ou "324"). */
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Formato serializado: "Model:Pumpkin,Backdrop:Onyx Black" */
  attributes?: string;
}

/**
 * Coleção agregada para o modal de filtro por coleção. `floorPrice` é uma
 * ESTIMATIVA best-effort (ver comentário em providers/tonapi.ts sobre como
 * é calculada) — nenhuma das APIs públicas gratuitas que usamos aqui expõe
 * um "floor price" oficial por coleção. `volume24h` fica `undefined`
 * quando não temos como calcular (hoje, sempre — ver mesmo comentário).
 */
export interface UnifiedCollection {
  address: string;
  name: string;
  image: string;
  itemsCount: number;
  floorPrice?: number;
  volume24h?: number;
}

export interface CollectionAttributeValue {
  value: string;
  /** Quantos itens (na amostra lida) têm esse valor. */
  count: number;
}

export interface CollectionAttribute {
  /** Ex.: "Model", "Backdrop", "Symbol" — vem 100% do metadata on-chain, nunca hardcoded. */
  trait: string;
  values: CollectionAttributeValue[];
}
