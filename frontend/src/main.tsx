import React from "react";
import ReactDOM from "react-dom/client";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import App from "./App";
import "./index.css";

/**
 * `manifestUrl` é obrigatório pelo TON Connect: um JSON público
 * (hospedado junto do frontend) descrevendo o nome/ícone do app que
 * aparece na tela de aprovação da carteira. Ex.:
 * {
 *   "url": "https://seu-dominio.com",
 *   "name": "TON NFT Hub",
 *   "iconUrl": "https://seu-dominio.com/icon-192.png"
 * }
 * Precisa estar em HTTPS e acessível publicamente — carteiras como
 * Tonkeeper buscam esse manifesto para validar a origem da conexão.
 */
const MANIFEST_URL = `${window.location.origin}/tonconnect-manifest.json`;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/*
      TonConnectUIProvider envolve toda a árvore para que qualquer
      componente (WalletConnect, MarketView, WalletView...) tenha acesso
      aos hooks `useTonConnectUI` / `useTonWallet` / `useTonAddress` sem
      precisar passar estado manualmente.
    */}
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>
);
