import { ChevronDown, Map as MapIcon } from "lucide-react";

import { useGis } from "@/state/gis-store";

const rows = [
  { label: "Flood Area", className: "bg-layer-flood/30 border-layer-flood" },
  { label: "Substation", className: "bg-layer-substation border-layer-substation" },
  { label: "OHL", className: "bg-layer-ohl border-layer-ohl", line: true },
  { label: "Cable", className: "bg-layer-cable border-layer-cable", line: true },
  { label: "High Risk", className: "bg-risk-high border-risk-high" },
  { label: "Medium Risk", className: "bg-risk-medium border-risk-medium" },
  { label: "Low Risk", className: "bg-risk-low border-risk-low" },
];

export function Legend() {
  const { legendOpen, setLegendOpen } = useGis();

  return (
    <div className="pointer-events-auto w-36 overflow-hidden rounded-md border border-border bg-chrome/95 shadow-lg backdrop-blur transition-all duration-200">
      <button
        onClick={() => setLegendOpen(!legendOpen)}
        aria-expanded={legendOpen}
        className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <MapIcon className="size-3.5" />
        <span className="flex-1 text-left">Legend</span>
        <ChevronDown
          className={`size-3.5 transition-transform duration-200 ${legendOpen ? "" : "-rotate-90"}`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ${
          legendOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <ul className="overflow-hidden border-t border-border/60 px-2 py-1.5">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center gap-1.5 py-[2px] text-[11px]">
              <span
                className={`shrink-0 border ${row.className} ${
                  row.line ? "h-0.5 w-3" : "size-2.5 rounded-[1px]"
                }`}
              />
              <span className="truncate">{row.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
