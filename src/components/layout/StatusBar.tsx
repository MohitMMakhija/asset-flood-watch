import { useGis } from "@/state/gis-store";

export function StatusBar() {
  const { data, isLoading, error, selection } = useGis();
  const stats = data?.stats;

  const state = error
    ? "Layer load failed"
    : isLoading
      ? "Loading layers…"
      : "Spatial analysis complete";

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-border bg-chrome px-4 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span
          className={`size-1.5 rounded-full ${
            error ? "bg-risk-high" : isLoading ? "bg-risk-low" : "bg-layer-cable"
          }`}
        />
        {state}
      </span>
      <span className="num">EPSG:27700 → WGS84</span>
      <span className="hidden md:inline num">Buffer 250 m</span>
      {stats && (
        <>
          <span className="num">Flood areas {stats.floodAreas.toLocaleString()}</span>
          <span className="num">Substations {stats.substations.toLocaleString()}</span>
          <span className="num">OHL {stats.ohl.toLocaleString()}</span>
          <span className="num">Cables {stats.cables.toLocaleString()}</span>
        </>
      )}
      <span className="ml-auto truncate">
        {selection ? `Selected: ${selection.type === "flood" ? "Flood Warning Area" : "Asset"}` : "No selection"}
      </span>
    </footer>
  );
}
