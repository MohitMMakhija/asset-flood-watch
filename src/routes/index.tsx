import { createFileRoute, Link } from "@tanstack/react-router";

import { useGis } from "@/state/gis-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flood Impact Dashboard | National Grid Electricity Network" },
      {
        name: "description",
        content:
          "Executive summary of National Grid electricity assets spatially exposed to Environment Agency Flood Warning Areas.",
      },
      { property: "og:title", content: "Flood Impact Dashboard | National Grid" },
      {
        property: "og:description",
        content:
          "GIS-derived exposure summary for substations, overhead lines and underground cables.",
      },
    ],
  }),
  component: Dashboard,
});

function Kpi({
  label,
  value,
  tone = "default",
  hint,
  valueLinkTo,
  valueLinkSearch,
  valueLinkTitle,
}: {
  label: string;
  value: number | string;
  tone?: "default" | "high" | "medium" | "low" | "primary";
  hint?: string;
  valueLinkTo?: string;
  valueLinkSearch?: Record<string, string>;
  valueLinkTitle?: string;
}) {
  const toneClass = {
    default: "text-brand border-border-info",
    primary: "text-brand border-border-info",
    high: "text-risk-high border-border-critical",
    medium: "text-risk-medium border-border-warn",
    low: "text-risk-low border-border-neutral",
  }[tone];

  const formatted = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div className={`rounded-md border bg-card px-4 py-3 shadow-[0_1px_2px_rgba(27,31,35,0.05)] ${toneClass}`}>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="num mt-1 text-[22px] font-semibold leading-none">
        {valueLinkTo ? (
          <Link
            to={valueLinkTo}
            search={valueLinkSearch}
            title={valueLinkTitle}
            className="cursor-pointer rounded-sm text-inherit underline-offset-4 hover:text-inherit hover:underline hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {formatted}
          </Link>
        ) : (
          formatted
        )}
      </p>
      {hint && <p className="mt-1 text-[10.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}


function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-[0_1px_2px_rgba(27,31,35,0.05)]">
      <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bar({
  label,
  value,
  total,
  colour,
}: {
  label: string;
  value: number;
  total: number;
  colour: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-[11.5px]">
        <span>{label}</span>
        <span className="num text-muted-foreground">
          {value.toLocaleString()} · {pct.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-sm bg-muted">
        <div className={`h-full ${colour}`} style={{ width: `${Math.max(pct, 0.4)}%` }} />
      </div>
    </div>
  );
}

function Dashboard() {
  const { data, isLoading, error } = useGis();

  if (error) {
    return (
      <div className="p-6 text-[13px] text-risk-high">
        Failed to load the GIS datasets: {error.message}
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-6 text-[13px] text-muted-foreground">
        Loading GIS layers and spatial analysis results…
      </div>
    );
  }

  const s = data.stats;
  const totalAssets = s.substations + s.ohl + s.cables;
  const totalAtRisk = s.substationsAtRisk + s.ohlAtRisk + s.cablesAtRisk;

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-4 flex flex-wrap items-baseline gap-3">
        <h1 className="text-[15px] font-semibold">Flood Impact Summary</h1>
        <p className="text-[11.5px] text-muted-foreground">
          Derived from Environment Agency Flood Warning Areas and the National Grid asset register
          using geometric intersection and a {"250"} m proximity buffer.
        </p>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Flood Warning Areas" value={s.floodAreas} tone="primary" />
        <Kpi label="Total Substations" value={s.substations} />
        <Kpi label="Total OHL" value={s.ohl} />
        <Kpi label="Total Cables" value={s.cables} />
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi
          label="Substations at Risk"
          value={s.substationsAtRisk}
          tone="medium"
          hint={`${((s.substationsAtRisk / s.substations) * 100).toFixed(1)}% of substations`}
        />
        <Kpi
          label="OHL at Risk"
          value={s.ohlAtRisk}
          tone="medium"
          hint={`${((s.ohlAtRisk / s.ohl) * 100).toFixed(1)}% of overhead lines`}
        />
        <Kpi
          label="Cables at Risk"
          value={s.cablesAtRisk}
          tone="medium"
          hint={`${((s.cablesAtRisk / s.cables) * 100).toFixed(1)}% of cable routes`}
        />
      </div>

      <div className="mb-3 grid grid-cols-3 gap-3">
        <Kpi
          label="High Risk"
          value={s.high}
          tone="high"
          hint="Asset footprint in flood area"
          valueLinkTo="/assets-at-risk"
          valueLinkSearch={{ risk: "HIGH" }}
          valueLinkTitle="View High Risk assets"
        />
        <Kpi label="Medium Risk" value={s.medium} tone="medium" hint="Line intersects flood area" />
        <Kpi label="Low Risk" value={s.low} tone="low" hint="Within 250 m of a flood area" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel title="Risk distribution (all assets)">
          <Bar label="High" value={s.high} total={totalAssets} colour="bg-risk-high" />
          <Bar label="Medium" value={s.medium} total={totalAssets} colour="bg-risk-medium" />
          <Bar label="Low" value={s.low} total={totalAssets} colour="bg-risk-low" />
          <Bar label="Safe" value={s.safe} total={totalAssets} colour="bg-risk-safe" />
        </Panel>

        <Panel title="Exposure by asset category">
          <Bar
            label="Substations"
            value={s.substationsAtRisk}
            total={s.substations}
            colour="bg-brand"
          />
          <Bar label="Overhead Lines" value={s.ohlAtRisk} total={s.ohl} colour="bg-brand-mid" />
          <Bar
            label="Underground Cables"
            value={s.cablesAtRisk}
            total={s.cables}
            colour="bg-brand-light"
          />
        </Panel>

        <Panel title="Spatial analysis summary">
          <dl className="space-y-1.5 text-[12px]">
            {[
              ["Source CRS", "EPSG:27700 (British National Grid)"],
              ["Map CRS", "EPSG:4326 / WGS84"],
              ["Proximity buffer", "250 m"],
              ["Assets analysed", totalAssets.toLocaleString()],
              ["Assets exposed", `${totalAtRisk.toLocaleString()} (${((totalAtRisk / totalAssets) * 100).toFixed(1)}%)`],
              ["Flood areas with impact", data.impactByFlood.size.toLocaleString()],
              ["Method", "Geometric intersection + proximity"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 border-b border-border/60 pb-1.5">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex gap-2">
            <Link
              to="/map"
              className="rounded-sm border border-primary/50 bg-primary/15 px-2.5 py-1 text-[12px] text-primary hover:bg-primary/25"
            >
              Open GIS map
            </Link>
            <Link
              to="/assets-at-risk"
              className="rounded-sm border border-border bg-secondary px-2.5 py-1 text-[12px] hover:bg-accent"
            >
              View assets at risk
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
