import type {
  AssetFeature,
  AssetKind,
  FeatureCollection,
  AssetProperties,
  FloodProperties,
  FloodFeature,
  GisData,
  GisStats,
  RiskLevel,
} from "./types";

import floodAsset from "@/data/flood.geojson.asset.json";
import substationsAsset from "@/data/substations.geojson.asset.json";
import ohlAsset from "@/data/ohl.geojson.asset.json";
import cablesAsset from "@/data/cables.geojson.asset.json";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load GIS layer (${res.status}): ${url}`);
  return (await res.json()) as T;
}

function isAtRisk(risk: RiskLevel) {
  return risk !== "SAFE";
}

function computeStats(
  flood: FeatureCollection<FloodProperties>,
  layers: Record<AssetKind, FeatureCollection<AssetProperties>>,
): GisStats {
  const all = [...layers.substation.features, ...layers.ohl.features, ...layers.cable.features];
  const count = (level: RiskLevel) => all.filter((f) => f.properties.risk === level).length;
  return {
    floodAreas: flood.features.length,
    substations: layers.substation.features.length,
    ohl: layers.ohl.features.length,
    cables: layers.cable.features.length,
    substationsAtRisk: layers.substation.features.filter((f) => isAtRisk(f.properties.risk)).length,
    ohlAtRisk: layers.ohl.features.filter((f) => isAtRisk(f.properties.risk)).length,
    cablesAtRisk: layers.cable.features.filter((f) => isAtRisk(f.properties.risk)).length,
    high: count("HIGH"),
    medium: count("MEDIUM"),
    low: count("LOW"),
    safe: count("SAFE"),
  };
}

/** Invert per-asset analysis results into a Flood Warning Area -> assets index. */
function buildImpactIndex(assets: AssetFeature[]) {
  const index = new Map<string, { substations: string[]; ohl: string[]; cables: string[] }>();
  for (const feature of assets) {
    const { risk, floodCodes, id, kind } = feature.properties;
    if (risk === "SAFE" || risk === "LOW") continue;
    for (const code of floodCodes) {
      let entry = index.get(code);
      if (!entry) {
        entry = { substations: [], ohl: [], cables: [] };
        index.set(code, entry);
      }
      if (kind === "substation") entry.substations.push(id);
      else if (kind === "ohl") entry.ohl.push(id);
      else entry.cables.push(id);
    }
  }
  return index;
}

export async function loadGisData(): Promise<GisData> {
  const [flood, substations, ohl, cables] = await Promise.all([
    fetchJson<FeatureCollection<FloodProperties>>(floodAsset.url),
    fetchJson<FeatureCollection<AssetProperties>>(substationsAsset.url),
    fetchJson<FeatureCollection<AssetProperties>>(ohlAsset.url),
    fetchJson<FeatureCollection<AssetProperties>>(cablesAsset.url),
  ]);

  const assetsById = new Map<string, AssetFeature>();
  for (const layer of [substations, ohl, cables]) {
    for (const feature of layer.features) assetsById.set(feature.properties.id, feature);
  }

  const floodById = new Map<string, FloodFeature>();
  for (const feature of flood.features) {
    if (feature.properties.id) floodById.set(feature.properties.id, feature);
  }

  return {
    flood,
    substations,
    ohl,
    cables,
    assetsById,
    floodById,
    impactByFlood: buildImpactIndex([...assetsById.values()]),
    stats: computeStats(flood, { substation: substations, ohl, cable: cables }),
  };
}

/** Bounding box of any GeoJSON geometry as [[south, west], [north, east]]. */
export function geometryBounds(geometry: { type: string; coordinates: unknown }) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const walk = (coords: unknown) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const x = coords[0] as number;
      const y = coords[1] as number;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      return;
    }
    for (const child of coords) walk(child);
  };
  walk(geometry.coordinates);

  if (minX === Infinity) return null;
  return [
    [minY, minX],
    [maxY, maxX],
  ] as [[number, number], [number, number]];
}
