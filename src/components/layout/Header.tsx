import { useNavigate } from "@tanstack/react-router";
import { Layers, RotateCcw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useGis, type LayerVisibility } from "@/state/gis-store";
import { KIND_LABEL } from "@/lib/gis/types";

const layerRows: { key: keyof LayerVisibility; label: string; swatch: string }[] = [
  { key: "flood", label: "Flood Warning Areas", swatch: "bg-layer-flood/40 border-layer-flood" },
  { key: "substation", label: "Substations", swatch: "bg-layer-substation border-layer-substation" },
  { key: "ohl", label: "Overhead Lines", swatch: "bg-layer-ohl border-layer-ohl" },
  { key: "cable", label: "Underground Cables", swatch: "bg-layer-cable border-layer-cable" },
];

interface Result {
  type: "flood" | "asset";
  id: string;
  name: string;
  detail: string;
}

export function Header() {
  const { data, layers, toggleLayer, resetView, zoomToSelection } = useGis();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!data || q.length < 2) return [];
    const out: Result[] = [];
    for (const feature of data.flood.features) {
      if (out.length >= 8) break;
      if (feature.properties.name.toLowerCase().includes(q)) {
        out.push({
          type: "flood",
          id: feature.properties.id,
          name: feature.properties.name,
          detail: `Flood Warning Area · ${feature.properties.river ?? "—"}`,
        });
      }
    }
    for (const feature of data.assetsById.values()) {
      if (out.length >= 16) break;
      if (feature.properties.name.toLowerCase().includes(q)) {
        out.push({
          type: "asset",
          id: feature.properties.id,
          name: feature.properties.name,
          detail: `${KIND_LABEL[feature.properties.kind]} · ${feature.properties.voltage ?? "—"}`,
        });
      }
    }
    return out;
  }, [data, query]);

  const go = (result: Result) => {
    zoomToSelection({ type: result.type, id: result.id } as never);
    setQuery("");
    setOpen(false);
    navigate({ to: "/map" });
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-chrome px-4">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-sm border border-primary/60 bg-primary/15">
          <Layers className="size-4 text-primary" />
        </div>
        <div className="leading-tight">
          <h1 className="text-[14px] font-semibold tracking-tight">
            Enterprise Flood Impact Assessment
          </h1>
          <p className="text-[11px] text-muted-foreground">National Grid Electricity Network</p>
        </div>
      </div>

      <div className="relative ml-auto w-full max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Search substations, circuits, cable routes, flood areas…"
          className="h-8 border-input bg-background pl-8 pr-8 text-[12.5px] placeholder:text-muted-foreground/70"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
        {open && results.length > 0 && (
          <ul className="absolute z-1000 mt-1 max-h-80 w-full overflow-auto rounded-sm border border-border bg-popover py-1 shadow-lg">
            {results.map((result) => (
              <li key={`${result.type}-${result.id}`}>
                <button
                  onClick={() => go(result)}
                  className="block w-full px-3 py-1.5 text-left hover:bg-accent"
                >
                  <span className="block truncate text-[12.5px]">{result.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {result.detail}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="hidden num text-[11.5px] text-muted-foreground xl:block">{today}</div>

      <Popover
        open={layersOpen}
        onOpenChange={(next) => {
          setLayersOpen(next);
          if (next) setLegendOpen(false);
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="secondary" size="sm" className="h-8 gap-2 text-[12px]">
            <Layers className="size-3.5" /> Layers
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={8}
          collisionPadding={12}
          avoidCollisions
          className="z-2000 w-64 rounded-md border-border bg-popover p-3 shadow-2xl"
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Map layers
          </p>
          <div className="space-y-2.5">
            {layerRows.map((row) => (
              <label key={row.key} className="flex items-center gap-2.5 text-[12.5px]">
                <span className={`size-3 shrink-0 rounded-[1px] border ${row.swatch}`} />
                <span className="flex-1">{row.label}</span>
                <Switch
                  checked={layers[row.key]}
                  onCheckedChange={() => toggleLayer(row.key)}
                  className="scale-90"
                />
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="secondary" size="sm" className="h-8 gap-2 text-[12px]" onClick={resetView}>
        <RotateCcw className="size-3.5" /> Reset
      </Button>
    </header>
  );
}
