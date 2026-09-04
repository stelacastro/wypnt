export interface ActiveFilters {
  search: string;
  sort: "recent" | "price_asc" | "price_desc";
  minPrice?: number;
  maxPrice?: number;
  /** Endereço da coleção selecionada no modal "Filtro por Coleção". */
  collection?: string;
  /** Nome de exibição da coleção selecionada — evita re-buscar só pro chip/pílula. */
  collectionName?: string;
  /** trait → conjunto de valores selecionados, ex.: { Model: ["Pumpkin"] } */
  attributes: Record<string, string[]>;
}

export const EMPTY_FILTERS: ActiveFilters = {
  search: "",
  sort: "recent",
  minPrice: undefined,
  maxPrice: undefined,
  collection: undefined,
  collectionName: undefined,
  attributes: {},
};

export function countActiveFilters(f: ActiveFilters): number {
  let count = 0;
  if (f.minPrice !== undefined) count += 1;
  if (f.maxPrice !== undefined) count += 1;
  if (f.collection) count += 1;
  count += Object.values(f.attributes).reduce((sum, values) => sum + values.length, 0);
  return count;
}
