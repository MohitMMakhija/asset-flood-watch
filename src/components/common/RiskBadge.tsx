import { RISK_LABEL, type RiskLevel } from "@/lib/gis/types";

const styles: Record<RiskLevel, string> = {
  HIGH: "border-risk-high/60 bg-risk-high/20 text-risk-high",
  MEDIUM: "border-risk-medium/60 bg-risk-medium/20 text-risk-medium",
  LOW: "border-risk-low/60 bg-risk-low/20 text-risk-low",
  SAFE: "border-border bg-muted text-muted-foreground",
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ${styles[risk]}`}
    >
      {RISK_LABEL[risk]}
    </span>
  );
}
