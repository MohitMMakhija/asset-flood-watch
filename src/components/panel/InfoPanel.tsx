import { ChevronLeft, ChevronRight, ChevronsRight, Crosshair, Info, MapPin } from "lucide-react";
import { useState } from "react";

import { RiskBadge } from "@/components/common/RiskBadge";
import { FloodImpactSummary } from "@/components/panel/FloodImpactSummary";

import { KIND_LABEL, type AssetFeature, type AssetKind } from "@/lib/gis/types";
import { useGis } from "@/state/gis-store";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 border-b border-border/60 py-1.5 text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words">{value === null || value === undefined || value === "" ? "—" : value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 mt-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

const STATUS_LABEL: Record<string, string> = {
  C: "Commissioned",
  E: "Existing",
  D: "Decommissioned",
  P: "Proposed",
};

function statusText(status: string | null | undefined) {
  if (!status) return "—";
  return STATUS_LABEL[status] ? `${STATUS_LABEL[status]} (${status})` : status;
}

function AssetList({ ids, label }: { ids: string[]; label: string }) {
  const { data, zoomToSelection } = useGis();
  const [open, setOpen] = useState(false);
  if (!data) return null;

  return (
    <div className="border-b border-border/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 py-1.5 text-left text-[12px] hover:text-primary"
        disabled={ids.length === 0}
      >
        <ChevronRight className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="flex-1">{label}</span>
        <span className="num font-semibold">{ids.length}</span>
      </button>
      {open && ids.length > 0 && (
        <ul className="mb-2 max-h-48 overflow-auto border-l border-border pl-2">
          {ids.map((id) => {
            const props = data.assetsById.get(id)?.properties;
            if (!props) return null;
            return (
              <li key={id}>
                <button
                  onClick={() => zoomToSelection({ type: "asset", id })}
                  className="flex w-full items-center gap-2 py-1 text-left text-[11.5px] text-muted-foreground hover:text-foreground"
                >
                  <Crosshair className="size-3 shrink-0" />
                  <span className="truncate">{props.name}</span>
                  <span className="num ml-auto shrink-0 text-[10.5px]">{props.voltage ?? ""}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FloodDetails({ id }: { id: string }) {
  const { data } = useGis();
  const feature = data?.floodById.get(id);
  if (!feature) return null;
  const p = feature.properties;
  const impact = data?.impactByFlood.get(id) ?? { substations: [], ohl: [], cables: [] };

  return (
    <div>
      <FloodImpactSummary feature={feature} />
      <SectionTitle>Attributes</SectionTitle>
      <div>
        <Field label="EA Region" value={p.area} />
        <Field label="Internal ID" value={p.id} />
      </div>
      <SectionTitle>Impacted assets</SectionTitle>
      <AssetList ids={impact.substations} label="Substations" />
      <AssetList ids={impact.ohl} label="Overhead Lines" />
      <AssetList ids={impact.cables} label="Underground Cables" />
    </div>
  );
}


function AssetDetails({ feature }: { feature: AssetFeature }) {
  const { data, zoomToSelection } = useGis();
  const p = feature.properties;
  const kind: AssetKind = p.kind;
  const relation = p.risk === "LOW" ? "Nearby Flood Warning Area" : "Intersecting Flood Warning Area";

  return (
    <div>
      <SectionTitle>{KIND_LABEL[kind]}</SectionTitle>
      <h2 className="text-[14px] font-semibold leading-snug">{p.name}</h2>
      <div className="mt-2 flex items-center gap-2">
        <RiskBadge risk={p.risk} />
        {p.risk === "LOW" && (
          <span className="text-[11px] text-muted-foreground">within 250 m buffer</span>
        )}
      </div>
      <div className="mt-2">
        <Field label="Voltage" value={p.voltage ? `${p.voltage}${/kv/i.test(p.voltage) ? "" : " kV"}` : null} />
        {kind === "ohl" && <Field label="Tower Section" value={p.towers} />}
        {kind === "cable" && <Field label="Cable Type" value={p.cableType} />}
        <Field label="Status" value={statusText(p.status)} />
        <Field label="Internal ID" value={p.gid} />
        {kind === "substation" && (
          <Field
            label="Coordinates"
            value={
              p.lat !== undefined && p.lng !== undefined
                ? `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`
                : null
            }
          />
        )}
      </div>
      <SectionTitle>{relation}</SectionTitle>
      {p.floodCodes.length === 0 ? (
        <p className="py-1.5 text-[12px] text-muted-foreground">
          No spatial relationship with any Flood Warning Area.
        </p>
      ) : (
        <ul>
          {p.floodCodes.map((code, i) => (
            <li key={code} className="border-b border-border/60">
              <button
                onClick={() => zoomToSelection({ type: "flood", id: code })}
                className="flex w-full items-center gap-2 py-1.5 text-left text-[12px] hover:text-primary"
                disabled={!data?.floodById.has(code)}
              >
                <MapPin className="size-3.5 shrink-0 text-layer-flood" />
                <span className="truncate">{p.floodNames[i] ?? code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function panelTitle(selection: ReturnType<typeof useGis>["selection"]) {
  if (!selection) return "Selected Asset";
  return selection.type === "flood" ? "Flood Details" : "Selected Asset";
}

function EmptyState() {
  return (
    <div className="pt-4">
      <p className="text-[12.5px] font-semibold">No asset selected</p>
      <p className="mt-1 text-[12px] text-muted-foreground">
        Select a network asset on the map to view
      </p>
      <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
        {["Asset information", "Flood exposure", "Risk classification"].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="size-1 shrink-0 rounded-full bg-muted-foreground" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InfoPanel() {
  const { data, selection, isLoading, panelCollapsed, setPanelCollapsed } = useGis();

  if (panelCollapsed) {
    return (
      <div className="flex w-8 shrink-0 flex-col items-center border-l border-border bg-panel transition-all duration-300">
        <button
          onClick={() => setPanelCollapsed(false)}
          title="Expand asset information"
          aria-label="Expand asset information"
          className="flex w-full flex-col items-center gap-2 py-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          <Info className="size-4" />
          <span className="mt-1 text-[10.5px] font-semibold uppercase tracking-wider [writing-mode:vertical-rl]">
            {panelTitle(selection)}
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-panel transition-all duration-300">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="flex-1 truncate text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          {panelTitle(selection)}
        </span>
        <button
          onClick={() => setPanelCollapsed(true)}
          title="Collapse panel"
          aria-label="Collapse panel"
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-4">
        {isLoading && <p className="pt-3 text-[12px] text-muted-foreground">Loading GIS layers…</p>}
        {!isLoading && !selection && <EmptyState />}
        {selection?.type === "flood" && <FloodDetails id={selection.id} />}
        {selection?.type === "asset" && data?.assetsById.get(selection.id) && (
          <AssetDetails feature={data.assetsById.get(selection.id)!} />
        )}
      </div>
    </aside>
  );
}
