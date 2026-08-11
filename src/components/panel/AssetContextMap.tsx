import { useEffect, useRef } from "react";

import type { AssetProperties } from "@/lib/gis/types";

/**
 * Small read-only locator map used as supporting context inside the
 * AI Risk Insight modal. Uses the same light basemap as the main map.
 * No selection/analysis behaviour — purely visual context.
 */
export function AssetContextMap({ asset }: { asset: AssetProperties }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || asset.lat == null || asset.lng == null) return;
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;
      map = L.map(el, {
        center: [asset.lat!, asset.lng!],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);
      L.circleMarker([asset.lat!, asset.lng!], {
        radius: 7,
        weight: 2,
        color: "#003da5",
        fillColor: "#003da5",
        fillOpacity: 0.5,
      }).addTo(map);
      setTimeout(() => map?.invalidateSize(), 60);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [asset.lat, asset.lng]);

  if (asset.lat == null || asset.lng == null) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-border bg-muted/40 px-3 text-center text-[11.5px] text-muted-foreground">
        No point location recorded for this asset — see the main map for its network geometry.
      </div>
    );
  }

  return (
    <div className="relative h-40 overflow-hidden rounded-md border border-border">
      <div ref={ref} className="absolute inset-0" />
    </div>
  );
}
