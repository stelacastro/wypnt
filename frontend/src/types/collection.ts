/**
 * Espelha backend/src/types.ts (UnifiedCollection / CollectionAttribute).
 *
 * `floorPrice` é uma estimativa (amostragem dos itens listados da própria
 * coleção — ver comentário em backend/src/services/providers/tonapi.ts).
 * `volume24h` fica `undefined` quando não há como calculá-lo; a UI mostra
 * "—" nesse caso em vez de inventar um número.
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
  /** Quantos itens (na amostra lida pelo backend) têm esse valor. */
  count: number;
}

export interface CollectionAttribute {
  /** Ex.: "Model", "Backdrop", "Symbol" — nomes vêm 100% da API, nunca fixos no front. */
  trait: string;
  values: CollectionAttributeValue[];
}
