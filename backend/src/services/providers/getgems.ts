import axios from "axios";
import type { UnifiedNFT, FetchNftsQuery } from "../../types.js";

/**
 * Adapter para a Getgems (maior marketplace de NFTs em TON).
 *
 * A Getgems não publica uma API REST/GraphQL pública e estável para
 * terceiros — o payload e o endpoint abaixo são ILUSTRATIVOS, no formato
 * que a API interna deles historicamente expôs, e servem para deixar
 * clara a forma do adapter. Antes de ir para produção:
 *   1. Confirmar com a Getgems se existe um programa de parceiros/API key;
 *   2. Validar o schema GraphQL atual (campos podem ter mudado);
 *   3. Respeitar rate limits e termos de uso deles.
 *
 * Se não houver acesso oficial, uma alternativa é indexar as mesmas
 * coleções via TonAPI (que lê on-chain diretamente) e usar a Getgems
 * apenas como link de destino ("Ver na Getgems") em vez de fonte de dados.
 */
const GETGEMS_GRAPHQL_URL = "https://api.getgems.io/graphql";
const GETGEMS_API_KEY = process.env.GETGEMS_API_KEY;

const QUERY_NFTS_BY_COLLECTION = /* GraphQL */ `
  query NftsByCollection($address: String!, $limit: Int!) {
    nftItemsByCollection(collectionAddress: $address, first: $limit) {
      items {
        address
        name
        index
        image {
          baseUrl
        }
        collection {
          name
          address
          approvedByUsersCount
        }
        sale {
          fullPrice
        }
        owner {
          address
          name
        }
      }
    }
  }
`;

interface GetgemsNftItem {
  address: string;
  name: string;
  index: number;
  image: { baseUrl: string };
  collection: { name: string; address: string; approvedByUsersCount: number };
  sale?: { fullPrice: string };
  owner: { address: string; name?: string };
}

interface GetgemsGraphQLResponse {
  data: {
    nftItemsByCollection: { items: GetgemsNftItem[] };
  };
}

function normalize(raw: GetgemsNftItem): UnifiedNFT {
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

export async function fetchFromGetgems(query: FetchNftsQuery): Promise<UnifiedNFT[]> {
  if (!query.collection) return [];

  const { data } = await axios.post<GetgemsGraphQLResponse>(
    GETGEMS_GRAPHQL_URL,
    {
      query: QUERY_NFTS_BY_COLLECTION,
      variables: { address: query.collection, limit: query.limit ?? 20 },
    },
    {
      timeout: 10_000,
      headers: GETGEMS_API_KEY ? { Authorization: `Bearer ${GETGEMS_API_KEY}` } : undefined,
    }
  );

  return data.data.nftItemsByCollection.items.map(normalize);
}
