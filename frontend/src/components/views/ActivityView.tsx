import { ArrowDownLeft, ArrowUpRight, Tag } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "buy" | "sell" | "list";
  nftName: string;
  priceTon: number;
  time: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: "1", type: "buy", nftName: "Chill Flame #374338", priceTon: 4.05, time: "há 2 min" },
  { id: "2", type: "list", nftName: "Mini Oscar #2912", priceTon: 71.14, time: "há 1 h" },
  { id: "3", type: "sell", nftName: "Lucky Snake #5581", priceTon: 3.7, time: "ontem" },
];

const ICON = { buy: ArrowDownLeft, sell: ArrowUpRight, list: Tag };
const LABEL = { buy: "Compra", sell: "Venda", list: "Listagem" };
const COLOR = { buy: "text-success", sell: "text-danger", list: "text-gift" };

export default function ActivityView() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-4 pt-3">
      <h1 className="font-display text-xl font-semibold text-white">Atividades</h1>

      <div className="flex flex-col divide-y divide-white/5 rounded-xl2 bg-base-800 ring-1 ring-white/5">
        {MOCK_ACTIVITY.map((item) => {
          const Icon = ICON[item.type];
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className={`rounded-full bg-white/5 p-2 ${COLOR[item.type]}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{item.nftName}</p>
                <p className="text-xs text-white/40">
                  {LABEL[item.type]} · {item.time}
                </p>
              </div>
              <p className="font-display text-sm font-semibold text-gift">
                {item.priceTon.toFixed(2)} TON
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
