import { useEffect } from "react";
import WebApp from "@twa-dev/sdk";

/**
 * Inicializa o ciclo de vida do Telegram WebApp:
 *  - `ready()` avisa o cliente Telegram que o app terminou de carregar
 *    (remove o loading spinner nativo).
 *  - `expand()` pede a altura máxima disponível, evitando o Mini App
 *    abrir "encolhido" (metade da tela) no primeiro load.
 *  - Força o header do Telegram para combinar com nosso dark theme,
 *    já que o app é dark-mode-only por design.
 */
export function useTelegramInit() {
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    // Cor de fundo do cabeçalho nativo do Telegram (iOS/Android),
    // não apenas do WebView — sem isso fica uma faixa clara acima do app.
    WebApp.setHeaderColor("#0A0D14");
    WebApp.setBackgroundColor("#0A0D14");

    // Ativa o gesto de "puxar para fechar" com confirmação, evitando que
    // o usuário perca uma listagem em progresso sem querer.
    WebApp.enableClosingConfirmation();
  }, []);
}

/**
 * Controla o BackButton nativo do Telegram para navegação interna
 * (ex.: sair da tela de detalhe do NFT sem usar o botão "X" do app todo).
 */
export function useTelegramBackButton(onBack: (() => void) | null) {
  useEffect(() => {
    if (!onBack) {
      WebApp.BackButton.hide();
      return;
    }
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(onBack);
    return () => {
      WebApp.BackButton.offClick(onBack);
      WebApp.BackButton.hide();
    };
  }, [onBack]);
}
