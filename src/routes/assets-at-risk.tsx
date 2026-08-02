import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Waves, X } from "lucide-react";

import { RiskBadge } from "@/components/common/RiskBadge";
import { Input } from "@/components/ui/input";
import { KIND_LABEL, type AssetKind, type RiskLevel } from "@/lib/gis/types";
import { useGis } from "@/state/gis-store";

export const Route = createFileRoute("/assets-at-risk")({
  head: () => ({
    meta: [
      { title: "Assets at Risk — Flood Impact Assessment | National Grid" },
      {
        name: "description",
        content:
          "Searchable register of National Grid substations, overhead lines and cables spatially exposed to Environment Agency Flood Warning Areas.",
      },
      { property: "og:title", content: "Assets at Risk — Flood Impact Assessment" },
      {
        property: "og:description",
        content: "Every electricity asset intersecting or within 250 m of a Flood Warning Area.",
      },
    ],
  }),
  component: AssetsAtRiskPage,
});

const typeOptions: (AssetKind | "all")[] = ["all", "substation", "ohl", "cable"];
const riskOptions: (RiskLevel | "all")[] = ["all", "HIGH", "MEDIUM", "LOW"];

function AssetsAtRiskPage() {
  const { data, zoomToSelection, floodFilter, setFloodFilter } = useGis();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<AssetKind | "all">("all");
  const [risk, setRisk] = useState<RiskLevel | "all">("all");
  const [flood, setFlood] = useState("all");

  // Drill-down from the map: pre-filter to the selected Flood Warning Area.
  useEffect(() => {
    if (floodFilter) setFlood(floodFilter.name);
  }, [floodFilter]);

  const clearFloodFilter = () => {
    setFloodFilter(null);
    setFlood("all");
  };


  const atRisk = useMemo(() => {
    if (!data) return [];
    return [...data.assetsById.values()].filter((f) => f.properties.risk !== "SAFE");
  }, [data]);

  const floodOptions = useMemo(() => {
    const names = new Set<string>();
    for (const f of atRisk) f.properties.floodNames.forEach((n) => names.add(n));
    return ["all", ...[...names].sort()];
  }, [atRisk]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return atRisk
      .filter((f) => {
        const p = f.properties;
        if (type !== "all" && p.kind !== type) return false;
        if (risk !== "all" && p.risk !== risk) return false;
        if (flood !== "all" && !p.floodNames.includes(flood)) return false;
        if (q && !p.name.toLowerCase().includes(q) && !p.floodNames.join(" ").toLowerCase().includes(q))
          return false;
        return true;
      })
      .slice(0, 1000);
  }, [atRisk, query, type, risk, flood]);

  const openOnMap = (id: string) => {
    zoomToSelection({ type: "asset", id });
    navigate({ to: "/map" });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-chrome px-4 py-2.5">
        <h1 className="text-[13.5px] font-semibold">Assets at Risk</h1>
        <span className="num text-[11.5px] text-muted-foreground">
          {rows.length.toLocaleString()} of {atRisk.length.toLocaleString()} exposed assets
        </span>
        <div className="relative ml-auto w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search asset or flood area…"
            className="h-8 bg-background pl-8 text-[12.5px]"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AssetKind | "all")}
          className="h-8 rounded-sm border border-border bg-background px-2 text-[12.5px]"
        >
          {typeOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All asset types" : KIND_LABEL[option]}
            </option>
          ))}
        </select>
        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value as RiskLevel | "all")}
          className="h-8 rounded-sm border border-border bg-background px-2 text-[12.5px]"
        >
          {riskOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All risk levels" : option}
            </option>
          ))}
        </select>
        <select
          value={flood}
          onChange={(e) => {
            setFlood(e.target.value);
            if (floodFilter) setFloodFilter(null);
          }}
          className="h-8 max-w-56 rounded-sm border border-border bg-background px-2 text-[12.5px]"
        >
          {floodOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All Flood Warning Areas" : option}
            </option>
          ))}
        </select>
      </div>

      {floodFilter && (
        <div className="flex items-center gap-2 border-b border-primary/40 bg-primary/15 px-4 py-2 text-[12px]">
          <Waves className="size-3.5 shrink-0 text-layer-flood" />
          <span>
            Showing affected assets for{" "}
            <span className="font-semibold">{floodFilter.name}</span>
          </span>
          <button
            onClick={clearFloodFilter}
            className="ml-auto flex items-center gap-1 rounded-sm border border-border bg-chrome px-2 py-1 text-[11.5px] transition-colors hover:bg-accent"
          >
            <X className="size-3" />
            Clear Filter
          </button>
        </div>
      )}



      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead className="sticky top-0 bg-chrome text-[10.5px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="border-b border-border px-3 py-2 text-left font-semibold">Asset name</th>
              <th className="border-b border-border px-3 py-2 text-left font-semibold">Type</th>
              <th className="border-b border-border px-3 py-2 text-left font-semibold">Risk</th>
              <th className="border-b border-border px-3 py-2 text-left font-semibold">
                Flood Warning Area
              </th>
              <th className="border-b border-border px-3 py-2 text-left font-semibold">Voltage</th>
              <th className="border-b border-border px-3 py-2 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((feature) => {
              const p = feature.properties;
              return (
                <tr
                  key={p.id}
                  onClick={() => openOnMap(p.id)}
                  className="cursor-pointer border-b border-border/50 hover:bg-accent/60"
                  title="Open on map"
                >
                  <td className="px-3 py-1.5">{p.name}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{KIND_LABEL[p.kind]}</td>
                  <td className="px-3 py-1.5">
                    <RiskBadge risk={p.risk} />
                  </td>
                  <td className="max-w-80 truncate px-3 py-1.5 text-muted-foreground">
                    {p.floodNames[0] ?? "—"}
                    {p.floodNames.length > 1 ? ` +${p.floodNames.length - 1}` : ""}
                  </td>
                  <td className="num px-3 py-1.5">{p.voltage ?? "—"}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{p.status ?? "—"}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  No exposed assets match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
