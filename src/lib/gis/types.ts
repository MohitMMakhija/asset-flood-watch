/**
 * GIS domain types.
 *
 * All data originates from the four uploaded Environment Agency / National Grid
 * shapefiles, converted once from EPSG:27700 to WGS84 by
 * scripts/prepare-gis-data.ts. Risk classification is computed in that same
 * preprocessing step using pure geometry predicates (intersection + 250 m
 * proximity) — no AI, no scores, no synthetic data.
 */

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "SAFE";
export type AssetKind = "substation" | "ohl" | "cable";

export interface AssetProperties {
  id: string;
  kind: AssetKind;
  name: string;
  voltage: string | null;
  status: string | null;
  gid: number | null;
  risk: RiskLevel;
  /** fws_tacode values of the related Flood Warning Areas */
  floodCodes: string[];
  floodNames: string[];
  /** OHL only */
  towers?: string | null;
  /** Cable only */
  cableType?: string | null;
  /** Substation centroid (WGS84) */
  lat?: number;
  lng?: number;
}

export interface FloodProperties {
  id: string;
  kind: "flood";
  name: string;
  river: string | null;
  authority: string | null;
  description: string | null;
  area: string | null;
}

export type Geometry = {
  type: string;
  coordinates: unknown;
};

export interface Feature<P> {
  type: "Feature";
  properties: P;
  geometry: Geometry;
}

export interface FeatureCollection<P> {
  type: "FeatureCollection";
  features: Feature<P>[];
}

export type AssetFeature = Feature<AssetProperties>;
export type FloodFeature = Feature<FloodProperties>;

export interface FloodImpact {
  substations: string[];
  ohl: string[];
  cables: string[];
}

export interface GisData {
  flood: FeatureCollection<FloodProperties>;
  substations: FeatureCollection<AssetProperties>;
  ohl: FeatureCollection<AssetProperties>;
  cables: FeatureCollection<AssetProperties>;
  /** all assets keyed by id */
  assetsById: Map<string, AssetFeature>;
  floodById: Map<string, FloodFeature>;
  /** fws_tacode -> impacted asset ids, inverted from the analysis results */
  impactByFlood: Map<string, FloodImpact>;
  stats: GisStats;
}

export interface GisStats {
  floodAreas: number;
  substations: number;
  ohl: number;
  cables: number;
  substationsAtRisk: number;
  ohlAtRisk: number;
  cablesAtRisk: number;
  high: number;
  medium: number;
  low: number;
  safe: number;
}

export const BUFFER_METRES = 250;

export const RISK_LABEL: Record<RiskLevel, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  SAFE: "Safe",
};

export const KIND_LABEL: Record<AssetKind, string> = {
  substation: "Substation",
  ohl: "Overhead Line",
  cable: "Underground Cable",
};
