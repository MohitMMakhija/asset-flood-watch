import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Cable, Landmark, Waves, Zap } from "lucide-react";
import { useMemo } from "react";

import type { AssetFeature, FloodFeature } from "@/lib/gis/types";
import { useGis } from "@/state/gis-store";

function Tile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "high" | "medium" | "low";
}) {
  const toneClass =
    tone === "high"
      ? "text-risk-high"
      : tone === "medium"
        ? "text-risk-medium"
        : tone === "low"
          ? "text-risk-low"
          : "text-foreground";

  return (
    <div className="rounded-sm border border-border bg-chrome px-2 py-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className={`num mt-0.5 text-[17px] font-semibold leading-none ${toneClass}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-2 border-b border-border/60 py-1.5 text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words">{value ? value : "—"}</span>
    </div>
  );
}

/** Presentation-only summary over the pre-computed spatial analysis results. */
export function FloodImpactSummary({ feature }: { feature: FloodFeature }) {
  const { data, setFloodFilter } = useGis();
  const navigate = useNavigate();
  const p = feature.properties;

  const affected = useMemo<AssetFeature[]>(() => {
    if (!data) return [];
    return [...data.assetsById.values()].filter((f) => f.properties.floodCodes.includes(p.id));
  }, [data, p.id]);

  const counts = useMemo(() => {
    const c = { substation: 0, ohl: 0, cable: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const f of affected) {
      c[f.properties.kind] += 1;
      if (f.properties.risk !== "SAFE") c[f.properties.risk] += 1;
    }
    return c;
  }, [affected]);

  const openAffected = () => {
    setFloodFilter({ id: p.id, name: p.name });
    navigate({ to: "/assets-at-risk" });
  };

  return (
    <div>
      <p className="mb-1.5 mt-3 text-[10.5px] font-semibold uppercase tracking-wider text-primary">
        Flood Impact Summary
      </p>
      <div className="flex items-start gap-2">
        <Waves className="mt-0.5 size-4 shrink-0 text-layer-flood" />
        <h2 className="text-[14px] font-semibold leading-snug">{p.name}</h2>
      </div>

      <div className="mt-2">
        <Row label="River / Sea" value={p.river} />
        <Row label="Local Authority" value={p.authority} />
        <Row label="Description" value={p.description} />
      </div>

      {affected.length === 0 ? (
        <p className="mt-3 rounded-sm border border-border bg-chrome px-2.5 py-2 text-[12px] leading-relaxed text-muted-foreground">
          No National Grid assets are affected by this Flood Warning Area.
        </p>
      ) : (
        <>
          <p className="mb-1.5 mt-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Affected assets
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <Tile
              icon={<Landmark className="size-3" />}
              label="Substations"
              value={counts.substation}
            />
            <Tile icon={<Zap className="size-3" />} label="OHL" value={counts.ohl} />
            <Tile icon={<Cable className="size-3" />} label="Cables" value={counts.cable} />
          </div>

          <p className="mb-1.5 mt-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Risk summary
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <Tile
              icon={<span className="size-2 rounded-[1px] bg-risk-high" />}
              label="High"
              value={counts.HIGH}
              tone="high"
            />
            <Tile
              icon={<span className="size-2 rounded-[1px] bg-risk-medium" />}
              label="Medium"
              value={counts.MEDIUM}
              tone="medium"
            />
            <Tile
              icon={<span className="size-2 rounded-[1px] bg-risk-low" />}
              label="Low"
              value={counts.LOW}
              tone="low"
            />
          </div>

          <button
            onClick={openAffected}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm border border-primary/60 bg-primary/20 px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-primary/30"
          >
            View Affected Assets
            <ArrowRight className="size-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
