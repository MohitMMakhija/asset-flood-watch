import type { AssetKind, RiskLevel } from "@/lib/gis/types";
import { useGis } from "@/state/gis-store";

const assetTypes: { value: AssetKind | "all"; label: string }[] = [
  { value: "all", label: "All assets" },
  { value: "substation", label: "Substations" },
  { value: "ohl", label: "OHL" },
  { value: "cable", label: "Cables" },
];

const riskLevels: { value: RiskLevel | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
  { value: "SAFE", label: "Safe" },
];

function Group<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex overflow-hidden rounded-sm border border-border">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`border-r border-border px-2.5 py-1 text-[11.5px] last:border-r-0 transition-colors ${
              value === option.value
                ? "bg-primary/25 text-foreground"
                : "bg-chrome text-muted-foreground hover:bg-accent"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MapFilters() {
  const { filters, setFilters } = useGis();

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border bg-chrome px-3 py-2">
      <Group
        label="Asset type"
        options={assetTypes}
        value={filters.assetType}
        onChange={(assetType) => setFilters({ assetType })}
      />
      <Group
        label="Risk"
        options={riskLevels}
        value={filters.risk}
        onChange={(risk) => setFilters({ risk })}
      />
    </div>
  );
}
