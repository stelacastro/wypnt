import { useState } from "react";
import BottomNav, { type Tab } from "./components/BottomNav";
import MarketView from "./components/views/MarketView";
import WalletView from "./components/views/WalletView";
import ActivityView from "./components/views/ActivityView";
import { useTelegramInit } from "./hooks/useTelegramTheme";

export default function App() {
  // Executa ready()/expand() do Telegram assim que o app monta.
  useTelegramInit();

  const [tab, setTab] = useState<Tab>("market");

  return (
    <div className="min-h-screen bg-base-950 pb-20">
      {tab === "market" && <MarketView />}
      {tab === "wallet" && <WalletView />}
      {tab === "activity" && <ActivityView />}

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
