export interface ActiveFilters {
  search: string;
  sort: "recent" | "price_asc" | "price_desc";
  minPrice?: number;
  maxPrice?: number;
  /** trait → conjunto de valores selecionados, ex.: { Model: ["Pumpkin"] } */
  attributes: Record<string, string[]>;
}

export const EMPTY_FILTERS: ActiveFilters = {
  search: "",
  sort: "recent",
  minPrice: undefined,
  maxPrice: undefined,
  attributes: {},
};

export function countActiveFilters(f: ActiveFilters): number {
  let count = 0;
  if (f.minPrice !== undefined) count += 1;
  if (f.maxPrice !== undefined) count += 1;
  count += Object.values(f.attributes).reduce((sum, values) => sum + values.length, 0);
  return count;
}
