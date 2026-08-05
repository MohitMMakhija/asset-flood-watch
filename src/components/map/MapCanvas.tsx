import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

import { geometryBounds } from "@/lib/gis/data";
import type { AssetFeature, AssetKind, AssetProperties, RiskLevel } from "@/lib/gis/types";
import { useGis } from "@/state/gis-store";

/** Read a design-system token so map styling stays driven by src/styles.css. */
function token(name: string) {
  if (typeof document === "undefined") return "#888";
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || "#888";
}

const UK_BOUNDS: L.LatLngBoundsExpression = [
  [49.8, -8.2],
  [59.2, 2.1],
];

interface Palette {
  flood: string;
  substation: string;
  ohl: string;
  cable: string;
  high: string;
  medium: string;
  low: string;
  selected: string;
}

function readPalette(): Palette {
  return {
    flood: token("--layer-flood"),
    substation: token("--layer-substation"),
    ohl: token("--layer-ohl"),
    cable: token("--layer-cable"),
    high: token("--risk-high"),
    medium: token("--risk-medium"),
    low: token("--risk-low"),
    selected: token("--primary"),
  };
}

function baseColour(p: Palette, kind: AssetKind) {
  return kind === "substation" ? p.substation : kind === "ohl" ? p.ohl : p.cable;
}

function riskColour(p: Palette, risk: RiskLevel, kind: AssetKind) {
  if (risk === "HIGH") return p.high;
  if (risk === "MEDIUM") return p.medium;
  if (risk === "LOW") return p.low;
  return baseColour(p, kind);
}

/** Resolve a brighter variant of a theme colour to a canvas-safe rgb() string. */
const brightCache = new Map<string, string>();
function brighten(colour: string) {
  const cached = brightCache.get(colour);
  if (cached) return cached;
  let out = colour;
  if (typeof document !== "undefined") {
    const probe = document.createElement("div");
    probe.style.color = `color-mix(in oklab, ${colour} 62%, white)`;
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    if (computed) out = computed;
  }
  brightCache.set(colour, out);
  return out;
}

/** ms the selection emphasis animation runs before settling to a static highlight */
const PULSE_MS = 3000;


export function MapCanvas() {
  const { data, layers, filters, selection, select, zoomNonce, resetNonce } = useGis();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const paletteRef = useRef<Palette | null>(null);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  const groupsRef = useRef<{
    flood?: L.GeoJSON;
    substationPolygons?: L.GeoJSON;
    substationMarkers?: L.LayerGroup;
    ohl?: L.GeoJSON;
    cable?: L.GeoJSON;
  }>({});
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  /** vector layers keyed by asset / flood id, used for the selection emphasis */
  const assetPathRefs = useRef<Map<string, L.Path[]>>(new Map());
  const floodPathRefs = useRef<Map<string, L.Path[]>>(new Map());


  /* ---------------------------------------------------------------- map init */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      preferCanvas: true,
      zoomControl: false,
      attributionControl: true,
    });
    mapRef.current = map;
    paletteRef.current = readPalette();

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap &copy; CARTO",
    }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 19,
      pane: "shadowPane",
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.scale({ position: "bottomleft", imperial: false, metric: true }).addTo(map);
    map.fitBounds(UK_BOUNDS);

    return () => {
      map.remove();
      mapRef.current = null;
      groupsRef.current = {};
      markerRefs.current.clear();
    };
  }, []);

  /* ------------------------------------- keep canvas sized to its container */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize({ animate: false });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ------------------------------------------------------------ build layers */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;
    const p = paletteRef.current ?? readPalette();
    paletteRef.current = p;

    Object.values(groupsRef.current).forEach((layer) => layer && map.removeLayer(layer));
    groupsRef.current = {};
    markerRefs.current.clear();
    assetPathRefs.current.clear();
    floodPathRefs.current.clear();

    const register = (store: Map<string, L.Path[]>, id: string, layer: L.Layer) => {
      const list = store.get(id);
      if (list) list.push(layer as L.Path);
      else store.set(id, [layer as L.Path]);
    };

    const floodRenderer = L.canvas({ padding: 0.3 });
    const lineRenderer = L.canvas({ padding: 0.3 });


    const assetVisible = (props: AssetProperties) => {
      if (filters.assetType !== "all" && props.kind !== filters.assetType) return false;
      if (filters.risk !== "all" && props.risk !== filters.risk) return false;
      return true;
    };

    const affectedIds = () => {
      const sel = selectionRef.current;
      if (!sel || sel.type !== "flood") return null;
      const impact = data.impactByFlood.get(sel.id);
      if (!impact) return new Set<string>();
      return new Set<string>([...impact.substations, ...impact.ohl, ...impact.cables]);
    };

    const isSelectedAsset = (id: string) => {
      const sel = selectionRef.current;
      return sel?.type === "asset" && sel.id === id;
    };

    const floodStyle = (feature?: { properties: { id: string } }): L.PathOptions => {
      const sel = selectionRef.current;
      const selected = !!feature && sel?.type === "flood" && sel.id === feature.properties.id;
      const relatedToAsset =
        !!feature &&
        sel?.type === "asset" &&
        (data.assetsById.get(sel.id)?.properties.floodCodes ?? []).includes(feature.properties.id);
      const highlight = selected || relatedToAsset;
      return {
        renderer: floodRenderer,
        color: highlight ? p.selected : p.flood,
        weight: selected ? 3.5 : highlight ? 2 : 0.8,
        opacity: highlight ? 1 : 0.85,
        fillColor: p.flood,
        fillOpacity: selected ? 0.5 : highlight ? 0.4 : 0.22,
      };
    };

    const lineStyle = (kind: AssetKind) => (feature?: AssetFeature): L.PathOptions => {
      const props = feature?.properties;
      const affected = affectedIds();
      const highlighted =
        !!props && (isSelectedAsset(props.id) || (affected?.has(props.id) ?? false));
      const risky = !!props && props.risk !== "SAFE";
      const colour = props ? riskColour(p, props.risk, kind) : baseColour(p, kind);
      return {
        renderer: lineRenderer,
        color: highlighted ? brighten(colour) : colour,
        weight: highlighted ? 5 : risky ? 2.4 : 1.4,
        opacity: highlighted ? 1 : 0.9,
        dashArray: highlighted && kind === "ohl" ? "10 6" : undefined,
      };
    };

    const substationPolygonStyle = (feature?: AssetFeature): L.PathOptions => {
      const props = feature?.properties;
      const affected = affectedIds();
      const highlighted =
        !!props && (isSelectedAsset(props.id) || (affected?.has(props.id) ?? false));
      const colour = props ? riskColour(p, props.risk, "substation") : p.substation;
      return {
        renderer: lineRenderer,
        color: highlighted ? p.selected : colour,
        weight: highlighted ? 3 : 1.2,
        fillColor: highlighted ? brighten(colour) : colour,
        fillOpacity: 0.5,
      };
    };

    const onFeatureClick = (id: string) => select({ type: "asset", id });

    /* flood polygons */
    const flood = L.geoJSON(data.flood as never, {
      style: floodStyle as never,
      onEachFeature: (feature, layer) => {
        register(floodPathRefs.current, feature.properties.id, layer);
        layer.on("click", () => select({ type: "flood", id: feature.properties.id }));
      },
    });

    groupsRef.current.flood = flood;

    /* substations — analysis uses the polygon footprint, markers are for display */
    const substationPolygons = L.geoJSON(data.substations as never, {
      style: substationPolygonStyle as never,
      filter: (feature) => assetVisible((feature as AssetFeature).properties),
      onEachFeature: (feature, layer) => {
        register(assetPathRefs.current, feature.properties.id, layer);
        layer.on("click", () => onFeatureClick(feature.properties.id));
      },

    });
    groupsRef.current.substationPolygons = substationPolygons;

    const markerGroup = L.layerGroup();
    for (const feature of data.substations.features) {
      const props = feature.properties;
      if (!assetVisible(props) || props.lat === undefined || props.lng === undefined) continue;
      const colour = riskColour(p, props.risk, "substation");
      const marker = L.marker([props.lat, props.lng], {
        icon: L.divIcon({
          className: "",
          iconSize: [11, 11],
          iconAnchor: [5.5, 5.5],
          html: `<div class="gis-substation-marker" style="width:11px;height:11px;background:${colour};border:1.5px solid rgba(0,0,0,0.55)"></div>`,
        }),
        interactive: true,
      });
      marker.on("click", () => onFeatureClick(props.id));
      marker.addTo(markerGroup);
      markerRefs.current.set(props.id, marker);
    }
    groupsRef.current.substationMarkers = markerGroup;

    const ohl = L.geoJSON(data.ohl as never, {
      style: lineStyle("ohl") as never,
      filter: (feature) => assetVisible((feature as AssetFeature).properties),
      onEachFeature: (feature, layer) => {
        register(assetPathRefs.current, feature.properties.id, layer);
        layer.on("click", () => onFeatureClick(feature.properties.id));
      },
    });
    groupsRef.current.ohl = ohl;

    const cable = L.geoJSON(data.cables as never, {
      style: lineStyle("cable") as never,
      filter: (feature) => assetVisible((feature as AssetFeature).properties),
      onEachFeature: (feature, layer) => {
        register(assetPathRefs.current, feature.properties.id, layer);
        layer.on("click", () => onFeatureClick(feature.properties.id));
      },
    });
    groupsRef.current.cable = cable;
  }, [data, filters, select]);


  /* ------------------------------------------------------- layer visibility */
  useEffect(() => {
    const map = mapRef.current;
    const g = groupsRef.current;
    if (!map || !g.flood) return;

    const set = (layer: L.Layer | undefined, visible: boolean) => {
      if (!layer) return;
      if (visible && !map.hasLayer(layer)) layer.addTo(map);
      if (!visible && map.hasLayer(layer)) map.removeLayer(layer);
    };
    const typeOk = (kind: AssetKind) =>
      filters.assetType === "all" || filters.assetType === kind;

    set(g.flood, layers.flood);
    set(g.substationPolygons, layers.substation && typeOk("substation"));
    set(g.substationMarkers, layers.substation && typeOk("substation"));
    set(g.ohl, layers.ohl && typeOk("ohl"));
    set(g.cable, layers.cable && typeOk("cable"));
  }, [layers, filters, data]);

  /* --------------------------------------------------------- restyle on select */
  useEffect(() => {
    const g = groupsRef.current;
    if (!g.flood || !data) return;
    const p = paletteRef.current ?? readPalette();

    g.flood.setStyle((g.flood.options.style as never) ?? {});
    g.substationPolygons?.setStyle((g.substationPolygons.options.style as never) ?? {});
    g.ohl?.setStyle((g.ohl.options.style as never) ?? {});
    g.cable?.setStyle((g.cable.options.style as never) ?? {});

    const impact = selection?.type === "flood" ? data.impactByFlood.get(selection.id) : undefined;
    const affected = new Set(impact?.substations ?? []);
    for (const [id, marker] of markerRefs.current) {
      const el = marker.getElement()?.firstElementChild as HTMLElement | null;
      if (!el) continue;
      const props = data.assetsById.get(id)?.properties;
      if (!props) continue;
      const highlighted =
        (selection?.type === "asset" && selection.id === id) || affected.has(id);
      el.style.background = riskColour(p, props.risk, "substation");
      el.style.outline = highlighted ? `2px solid ${p.selected}` : "none";
      el.style.width = highlighted ? "15px" : "11px";
      el.style.height = highlighted ? "15px" : "11px";
    }
  }, [selection, data]);

  /* ------------------------------- temporary emphasis animation on selection */
  useEffect(() => {
    if (!selection || !data) return;

    const targets: L.Path[] = [];
    if (selection.type === "flood") {
      targets.push(...(floodPathRefs.current.get(selection.id) ?? []));
      const impact = data.impactByFlood.get(selection.id);
      const ids = [...(impact?.substations ?? []), ...(impact?.ohl ?? []), ...(impact?.cables ?? [])];
      for (const id of ids) targets.push(...(assetPathRefs.current.get(id) ?? []));
    } else {
      targets.push(...(assetPathRefs.current.get(selection.id) ?? []));
    }

    const bases = targets.map((path) => ({
      path,
      weight: (path.options.weight as number) ?? 2,
      opacity: (path.options.opacity as number) ?? 1,
      fillOpacity: (path.options.fillOpacity as number) ?? 0,
    }));

    const markerEls: HTMLElement[] = [];
    const markerIds =
      selection.type === "flood"
        ? (data.impactByFlood.get(selection.id)?.substations ?? [])
        : [selection.id];
    for (const id of markerIds) {
      const el = markerRefs.current.get(id)?.getElement()?.firstElementChild as HTMLElement | null;
      if (el) {
        el.classList.add("is-pulsing");
        markerEls.push(el);
      }
    }

    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const elapsed = now - start;
      if (elapsed >= PULSE_MS) {
        for (const b of bases) {
          b.path.setStyle({ weight: b.weight, opacity: b.opacity, fillOpacity: b.fillOpacity });
        }
        for (const el of markerEls) el.classList.remove("is-pulsing");
        return;
      }
      const wave = 0.5 + 0.5 * Math.sin((elapsed / 400) * Math.PI);
      for (const b of bases) {
        b.path.setStyle({
          weight: b.weight * (1 + 0.8 * wave),
          opacity: Math.min(1, b.opacity * (0.7 + 0.3 * wave)),
          fillOpacity: Math.min(1, b.fillOpacity * (0.75 + 0.5 * wave)),
        });
      }
      frame = requestAnimationFrame(step);
    });

    return () => {
      cancelAnimationFrame(frame);
      for (const b of bases) {
        b.path.setStyle({ weight: b.weight, opacity: b.opacity, fillOpacity: b.fillOpacity });
      }
      for (const el of markerEls) el.classList.remove("is-pulsing");
    };
  }, [selection, data]);


  /* ------------------------------------------------------------ zoom targets */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data || !selection || zoomNonce === 0) return;
    const geometry =
      selection.type === "flood"
        ? data.floodById.get(selection.id)?.geometry
        : data.assetsById.get(selection.id)?.geometry;
    if (!geometry) return;
    const bounds = geometryBounds(geometry);
    if (!bounds) return;
    map.flyToBounds(L.latLngBounds(bounds).pad(0.4), {
      maxZoom: selection.type === "flood" ? 14 : 15,
      duration: 0.6,
    });
  }, [zoomNonce, selection, data]);

  useEffect(() => {
    if (resetNonce === 0) return;
    mapRef.current?.fitBounds(UK_BOUNDS);
  }, [resetNonce]);

  return <div ref={containerRef} className="size-full" />;
}
