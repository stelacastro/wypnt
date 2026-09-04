/**
 * Constrói as URLs de destino para "Ver oferta" — a peça central do
 * redirect que substitui a compra simulada dentro do nosso app.
 *
 * Duas URLs por item:
 *
 * 1. `sourceUrl` — link direto pro explorador da Getgems
 *    (`getgems.io/collection/{coleção}/{item}`). Formato CONFIRMADO
 *    (aparece no campo `external_url` do metadata padrão de NFTs TON).
 *    Funciona pra qualquer NFT TON, não só os que a Getgems "vende"
 *    ativamente — ela funciona como explorer geral do ecossistema.
 *
 * 2. `officialTelegramUrl` — link oficial `t.me/nft/{Nome}-{índice}`,
 *    documentado pela própria Telegram como o formato canônico de
 *    página de um gift colecionável. É o link "neutro": não importa em
 *    qual marketplace o item está custodiado no momento, essa página
 *    sempre existe e mostra dono atual + atributos.
 *    ATENÇÃO: o slug é um best-effort (nome sem espaços + índice) —
 *    o "nome interno" do modelo do gift no Telegram pode não ser
 *    idêntico ao `name` que vem do metadata on-chain. Trate como link
 *    auxiliar, não garantido.
 */

export function buildGetgemsUrl(collectionAddress: string, itemAddress: string): string {
  return `https://getgems.io/collection/${collectionAddress}/${itemAddress}`;
}

export function buildOfficialTelegramGiftUrl(name: string, index: string | number): string {
  const slug = name.replace(/\s+/g, "");
  const numericIndex = String(index).replace(/^#/, "");
  return `https://t.me/nft/${slug}-${numericIndex}`;
}
