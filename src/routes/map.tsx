import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useRef } from "react";

import { Legend } from "@/components/map/Legend";

// Leaflet touches `window` at module scope, so the map is client-only.
const MapCanvas = lazy(() =>
  import("@/components/map/MapCanvas").then((m) => ({ default: m.MapCanvas })),
);
import { MapFilters } from "@/components/map/MapFilters";
import { MapToolbar } from "@/components/map/MapToolbar";
import { InfoPanel } from "@/components/panel/InfoPanel";
import { useGis } from "@/state/gis-store";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "GIS Map — Flood Impact Assessment | National Grid" },
      {
        name: "description",
        content:
          "Interactive GIS map of National Grid substations, overhead lines and underground cables against Environment Agency Flood Warning Areas.",
      },
      { property: "og:title", content: "GIS Map — Flood Impact Assessment" },
      {
        property: "og:description",
        content:
          "Visualise electricity network assets spatially exposed to Environment Agency Flood Warning Areas.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLoading, error } = useGis();

  return (
    <div className="flex h-full min-h-0">
      <section className="flex min-w-0 flex-1 flex-col">
        <MapFilters />
        <div ref={containerRef} className="relative min-h-0 flex-1 bg-background">
          <ClientOnly>
            <Suspense fallback={null}>
              <MapCanvas />
            </Suspense>
          </ClientOnly>
          <div className="pointer-events-none absolute inset-0 z-500 p-3">
            <div className="absolute left-3 top-3">
              <MapToolbar containerRef={containerRef} />
            </div>
            <div className="absolute bottom-8 left-3">
              <Legend />
            </div>
            {(isLoading || error) && (
              <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-sm border border-border bg-chrome/95 px-3 py-1.5 text-[12px]">
                {error ? "Failed to load GIS layers" : "Loading GIS layers and analysis results…"}
              </div>
            )}
          </div>
        </div>
      </section>
      <InfoPanel />
    </div>
  );
}
