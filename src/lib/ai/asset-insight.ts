/**
 * Asset risk insight service (local deterministic generator).
 *
 * Single replaceable abstraction: `generateAssetRiskInsight(assetData)` is
 * async so the local generator can later be swapped for an Azure-hosted
 * LLM/AI service without any change to the UI or the calling component.
 */

import { KIND_LABEL, RISK_LABEL, type AssetProperties } from "@/lib/gis/types";

export interface AssetRiskInsight {
  provider: "local-deterministic";
  generatedAt: string;
  headline: string;
  /** Risk level of the asset, echoed from the data (never inferred). */
  risk: AssetProperties["risk"];
  assessment: string;
  reasons: string[];
  recommendedFocus: string[];
  insufficientData: boolean;
}

const RISK_HEADLINE: Record<AssetProperties["risk"], string> = {
  HIGH: "High Flood Risk",
  MEDIUM: "Medium Flood Risk",
  LOW: "Low Flood Risk",
  SAFE: "No Flood Exposure Identified",
};

const RISK_BASIS: Record<AssetProperties["risk"], string> = {
  HIGH: "the asset footprint falls inside a mapped Flood Warning Area",
  MEDIUM: "the asset geometry intersects a Flood Warning Area boundary",
  LOW: "the asset sits within the 250 m proximity buffer of a Flood Warning Area",
  SAFE: "no spatial relationship with any Flood Warning Area was found",
};

function voltageText(voltage: string | null) {
  if (!voltage) return null;
  return /kv/i.test(voltage) ? voltage : `${voltage} kV`;
}

export async function generateAssetRiskInsight(
  assetData: AssetProperties | undefined,
): Promise<AssetRiskInsight> {
  const generatedAt = new Date().toISOString();

  if (!assetData) {
    return {
      provider: "local-deterministic",
      generatedAt,
      headline: "Insufficient Data",
      risk: "SAFE",
      assessment: "No asset is currently selected, so no risk insight can be produced.",
      reasons: [],
      recommendedFocus: [],
      insufficientData: true,
    };
  }

  const p = assetData;
  const kind = KIND_LABEL[p.kind];
  const volts = voltageText(p.voltage);
  const zones = p.floodNames.filter(Boolean);
  const zoneCount = p.floodCodes.length;

  const assessment =
    p.risk === "SAFE"
      ? `${kind} "${p.name}" is not classified as flood exposed: ${RISK_BASIS.SAFE} in the current datasets.`
      : `${kind} "${p.name}" is classified ${RISK_LABEL[p.risk]} risk because ${RISK_BASIS[p.risk]}. Based on the available flood and asset data, this combination of asset characteristics and flood exposure indicates the level of operational attention below.`;

  const reasons: string[] = [];
  reasons.push(
    p.risk === "SAFE"
      ? "No Flood Warning Area intersects the asset or its 250 m proximity buffer."
      : `Spatial classification: ${RISK_LABEL[p.risk]} — ${RISK_BASIS[p.risk]}.`,
  );
  if (zoneCount > 0) {
    reasons.push(
      zoneCount === 1
        ? `Related Flood Warning Area: ${zones[0] ?? p.floodCodes[0]}.`
        : `Related to ${zoneCount} Flood Warning Areas, including ${zones.slice(0, 3).join(", ")}${zoneCount > 3 ? " and others" : ""}.`,
    );
  }
  if (volts) {
    reasons.push(`Operating voltage recorded as ${volts}, indicating its role in the network.`);
  } else {
    reasons.push("No voltage value is recorded for this asset in the source dataset.");
  }
  if (p.status) reasons.push(`Asset status recorded as "${p.status}" in the asset register.`);
  if (p.kind === "ohl" && p.towers) reasons.push(`Tower section reference: ${p.towers}.`);
  if (p.kind === "cable" && p.cableType) reasons.push(`Cable type recorded as ${p.cableType}.`);
  if (p.kind === "substation") {
    reasons.push(
      p.lat !== undefined && p.lng !== undefined
        ? `Location: ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)} (WGS84).`
        : "No point location is recorded for this substation.",
    );
  }

  const recommendedFocus: string[] = [];
  if (p.risk === "HIGH") {
    recommendedFocus.push("Prioritise this asset for operational review before the next flood season.");
    recommendedFocus.push("Validate local flood defences and confirm alternative switching arrangements.");
  } else if (p.risk === "MEDIUM") {
    recommendedFocus.push("Schedule a resilience inspection of the section intersecting the flood boundary.");
    recommendedFocus.push("Confirm access and recovery routes remain usable during a flood event.");
  } else if (p.risk === "LOW") {
    recommendedFocus.push("Add to the flood monitoring watchlist; no immediate intervention indicated.");
  } else {
    recommendedFocus.push("No flood mitigation action indicated by the current spatial analysis.");
  }
  if (p.kind === "substation" && p.risk !== "SAFE") {
    recommendedFocus.push("Review site-level protection given the concentrated impact of substation outages.");
  }
  if (!volts || !p.status) {
    recommendedFocus.push("Complete the missing asset register attributes to support a fuller assessment.");
  }

  return {
    provider: "local-deterministic",
    generatedAt,
    headline: RISK_HEADLINE[p.risk],
    risk: p.risk,
    assessment,
    reasons,
    recommendedFocus,
    insufficientData: false,
  };
}
