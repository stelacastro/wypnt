import { useTonAddress, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { Wallet, LogOut, Copy } from "lucide-react";

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Botão de conexão de carteira. `TonConnectUiProvider` (ver main.tsx) já
 * cuida de todo o fluxo de deep-link/QR/modal — este componente só reage
 * ao estado (`useTonWallet`) e dispara `openModal` / `disconnect`.
 */
export default function WalletConnect() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const friendlyAddress = useTonAddress(); // já formatado em base64/bounceable

  if (!wallet) {
    return (
      <button
        type="button"
        onClick={() => tonConnectUI.openModal()}
        className="flex items-center gap-2 rounded-full bg-ton px-4 py-2 text-sm font-medium text-white transition active:scale-95"
      >
        <Wallet size={16} />
        Conectar carteira
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(friendlyAddress)}
        className="flex items-center gap-1.5 rounded-full bg-base-800 px-3 py-2 text-sm text-white ring-1 ring-white/10"
      >
        <Copy size={13} className="text-white/40" />
        {truncateAddress(friendlyAddress)}
      </button>
      <button
        type="button"
        onClick={() => tonConnectUI.disconnect()}
        aria-label="Desconectar carteira"
        className="flex items-center justify-center rounded-full bg-base-800 p-2 text-white/60 ring-1 ring-white/10"
      >
        <LogOut size={15} />
      </button>
    </div>
  );
}
