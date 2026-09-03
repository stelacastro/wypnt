import { Store, WalletCards, Activity } from "lucide-react";

export type Tab = "market" | "wallet" | "activity";

const TABS: Array<{ id: Tab; label: string; icon: typeof Store }> = [
  { id: "market", label: "Marketplace", icon: Store },
  { id: "wallet", label: "Minha carteira", icon: WalletCards },
  { id: "activity", label: "Atividades", icon: Activity },
];

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-white/5 bg-base-900/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            >
              <Icon
                size={20}
                className={isActive ? "text-ton" : "text-white/40"}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span className={isActive ? "text-white" : "text-white/40"}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
