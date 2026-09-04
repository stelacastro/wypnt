import { X } from "lucide-react";
import type { CollectionAttributeValue } from "../types/collection";

interface TraitFilterSheetProps {
  trait: string;
  values: CollectionAttributeValue[];
  selected: string[];
  onToggle: (value: string) => void;
  onClose: () => void;
}

/**
 * Sheet genérico reaproveitado pra qualquer trait retornado pela API
 * (Model, Backdrop, Symbol, ou qualquer outro nome que a coleção tiver) —
 * o `trait` e os `values` vêm sempre de fora, nada é fixo aqui.
 */
export default function TraitFilterSheet({
  trait,
  values,
  selected,
  onToggle,
  onClose,
}: TraitFilterSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm">
      <div className="flex max-h-[75vh] w-full flex-col overflow-hidden rounded-t-2xl bg-base-900 ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <p className="font-display text-base font-semibold text-white">{trait}</p>
          <button onClick={onClose} aria-label="Fechar" className="text-white/40">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-1">
            {values.length === 0 && (
              <p className="p-2 text-xs text-white/40">
                Nenhum valor disponível para este atributo.
              </p>
            )}
            {values.map(({ value, count }) => {
              const active = selected.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onToggle(value)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm ring-1 ${
                    active
                      ? "bg-ton/10 text-white ring-ton/40"
                      : "bg-base-800 text-white/70 ring-white/5"
                  }`}
                >
                  <span>{value}</span>
                  <span className="text-xs text-white/30">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/5 p-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-ton py-3 text-sm font-semibold text-white"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </div>
  );
}
