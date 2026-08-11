/**
 * Risk summary service (local deterministic generator).
 *
 * This module is the single replaceable abstraction for narrative summary
 * generation. `generateRiskSummary(data)` returns a Promise so that the local
 * generator can later be swapped for an Azure-hosted AI/LLM implementation
 * without any change to the dashboard UI or calling code.
 */

import type { GisData } from "@/lib/gis/types";

export interface RiskSummaryHotspot {
  id: string;
  name: string;
  substations: number;
  ohl: number;
  cables: number;
  total: number;
}

export interface RiskSummary {
  /** Which implementation produced this summary. */
  provider: "local-deterministic";
  generatedAt: string;
  situation: string[];
  keyRisks: string[];
  recommendedFocus: string[];
  hotspots: RiskSummaryHotspot[];
  /** Set when the loaded datasets are too sparse to summarise. */
  insufficientData: boolean;
}

const pct = (value: number, total: number) =>
  total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "n/a";

const n = (value: number) => value.toLocaleString();

function topHotspots(data: GisData, limit: number): RiskSummaryHotspot[] {
  const rows: RiskSummaryHotspot[] = [];
  for (const [code, impact] of data.impactByFlood) {
    const total = impact.substations.length + impact.ohl.length + impact.cables.length;
    if (total === 0) continue;
    rows.push({
      id: code,
      name: data.floodById.get(code)?.properties.name ?? code,
      substations: impact.substations.length,
      ohl: impact.ohl.length,
      cables: impact.cables.length,
      total,
    });
  }
  rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  return rows.slice(0, limit);
}

/**
 * Generates an executive risk summary from the data currently loaded in the
 * application. Purely deterministic: every statement is derived from counts
 * present in `data` — nothing is invented or hardcoded.
 */
export async function generateRiskSummary(data: GisData | undefined): Promise<RiskSummary> {
  const generatedAt = new Date().toISOString();

  if (!data) {
    return {
      provider: "local-deterministic",
      generatedAt,
      insufficientData: true,
      situation: ["No GIS datasets are currently loaded, so no summary can be produced."],
      keyRisks: [],
      recommendedFocus: [],
      hotspots: [],
    };
  }

  const s = data.stats;
  const totalAssets = s.substations + s.ohl + s.cables;
  const totalAtRisk = s.substationsAtRisk + s.ohlAtRisk + s.cablesAtRisk;

  if (totalAssets === 0 || s.floodAreas === 0) {
    return {
      provider: "local-deterministic",
      generatedAt,
      insufficientData: true,
      situation: [
        `Insufficient data to summarise: ${n(s.floodAreas)} Flood Warning Areas and ${n(totalAssets)} assets are loaded.`,
      ],
      keyRisks: [],
      recommendedFocus: [],
      hotspots: [],
    };
  }

  const hotspots = topHotspots(data, 5);

  const situation: string[] = [
    `${n(totalAssets)} network assets (${n(s.substations)} substations, ${n(s.ohl)} overhead lines, ${n(s.cables)} cable routes) were assessed against ${n(s.floodAreas)} Environment Agency Flood Warning Areas.`,
    `${n(totalAtRisk)} assets (${pct(totalAtRisk, totalAssets)}) fall within a flood area or its 250 m proximity buffer; ${n(s.safe)} are classified Safe.`,
    `${n(data.impactByFlood.size)} of ${n(s.floodAreas)} Flood Warning Areas contain at least one High or Medium risk asset.`,
  ];

  const keyRisks: string[] = [];
  if (s.high > 0) {
    keyRisks.push(
      `${n(s.high)} assets are High risk (${pct(s.high, totalAssets)} of the estate) — asset footprint inside a flood area.`,
    );
  } else {
    keyRisks.push("No assets are classified High risk in the current datasets.");
  }
  if (s.medium > 0) {
    keyRisks.push(`${n(s.medium)} assets are Medium risk, intersecting a flood area boundary.`);
  }
  if (s.low > 0) {
    keyRisks.push(`${n(s.low)} assets are Low risk, sitting within 250 m of a flood area.`);
  }

  const shares: Array<[string, number, number]> = [
    ["Substations", s.substationsAtRisk, s.substations],
    ["Overhead lines", s.ohlAtRisk, s.ohl],
    ["Cable routes", s.cablesAtRisk, s.cables],
  ];
  const worst = shares
    .filter(([, , total]) => total > 0)
    .sort((a, b) => b[1] / b[2] - a[1] / a[2])[0];
  if (worst) {
    keyRisks.push(
      `${worst[0]} show the highest proportional exposure at ${pct(worst[1], worst[2])} (${n(worst[1])} of ${n(worst[2])}).`,
    );
  }
  if (hotspots.length > 0) {
    keyRisks.push(
      `Risk is concentrated around ${hotspots[0].name}, with ${n(hotspots[0].total)} impacted assets.`,
    );
  }

  const recommendedFocus: string[] = [];
  if (s.substationsAtRisk > 0) {
    recommendedFocus.push(
      `Prioritise resilience surveys for the ${n(s.substationsAtRisk)} exposed substations, starting with High risk sites.`,
    );
  }
  if (hotspots.length > 0) {
    recommendedFocus.push(
      `Review the ${n(hotspots.length)} highest-impact Flood Warning Areas listed below for localised mitigation planning.`,
    );
  }
  if (s.high > 0) {
    recommendedFocus.push(
      `Validate flood defences and switching alternatives for the ${n(s.high)} High risk assets before the next flood season.`,
    );
  }
  if (s.low > 0) {
    recommendedFocus.push(
      `Place the ${n(s.low)} Low risk assets on a monitoring watchlist rather than immediate intervention.`,
    );
  }
  if (recommendedFocus.length === 0) {
    recommendedFocus.push("No exposure detected in the current datasets; no mitigation actions indicated.");
  }

  return {
    provider: "local-deterministic",
    generatedAt,
    insufficientData: false,
    situation,
    keyRisks,
    recommendedFocus,
    hotspots,
  };
}
