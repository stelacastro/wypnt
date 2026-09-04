/**
 * Mapa de endereços conhecidos → plataforma de origem.
 *
 * DECISÃO DE PRODUTO: só atribuímos um badge/link específico de
 * plataforma quando temos uma forma **confirmada e pública** de validar
 * a origem — hoje, só a Getgems se qualifica (endereço documentado no
 * cookbook oficial da TON, embutido no próprio contrato de venda
 * fixprice: https://docs.ton.org/v3/guidelines/ton-connect/cookbook/nft-transfer).
 *
 * MRKT, Portals e Tonnel usam custódia interna — o item on-chain só
 * mostra "pertence à carteira-cofre da plataforma", sem contrato de
 * venda individual público, e o preço real de listagem vive no banco
 * de dados privado de cada uma (acessível só via API autenticada não
 * documentada). Decidimos não integrar isso: usar token de sessão de
 * terceiros pra automatizar acesso à infraestrutura privada deles é
 * risco de ToS e de segurança que não vale a pena pro produto.
 *
 * Por isso: qualquer item que não bata com `SALE_CONTRACT_MARKETPLACES`
 * cai em `"unknown"` → badge genérico "On-chain" na UI, com uma única
 * CTA pro link oficial universal do Telegram (t.me/nft/...), que é
 * sempre correto e nunca implica uma plataforma ou preço que não
 * confirmamos.
 */

export type GiftPlatform = "getgems" | "unknown";

export const SALE_CONTRACT_MARKETPLACES: Record<string, GiftPlatform> = {
  // Getgems — endereço oficial do marketplace, confirmado no cookbook TON Connect.
  "EQBYTuYbLf8INxFtD8tQeNk5ZLy-nAX9ahQbG_yl1qQ-GEMS": "getgems",
};

/**
 * Carteiras-cofre conhecidas de plataformas custodiais. Mantido só como
 * referência/documentação (ex.: se um dia você quiser filtrar "esconder
 * itens presos em custódia de terceiros" da busca) — NÃO influencia o
 * badge nem o link mostrado ao usuário. Ver comentário acima.
 */
export const KNOWN_CUSTODIAL_VAULT_WALLETS: Record<string, "mrkt" | "portals" | "tonnel"> = {
  // "UQ...enderecoDoVaultDaPortals": "portals",
  // "UQ...enderecoDoVaultDaMRKT": "mrkt",
  // "UQ...enderecoDoVaultDaTonnel": "tonnel",
};

export function resolvePlatform(params: { saleMarketplaceAddress?: string }): GiftPlatform {
  if (params.saleMarketplaceAddress) {
    const known = SALE_CONTRACT_MARKETPLACES[params.saleMarketplaceAddress];
    if (known) return known;
  }
  return "unknown";
}
