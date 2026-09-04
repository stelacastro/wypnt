import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por nome ou #ID"
        className="w-full rounded-full bg-base-800 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 ring-1 ring-white/10 focus:outline-none focus:ring-ton"
      />
    </div>
  );
}
