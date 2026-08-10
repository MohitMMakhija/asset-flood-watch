import { createFileRoute } from "@tanstack/react-router";
import {
  CloudRain,
  Activity,
  Gauge,
  ListChecks,
  FlaskConical,
  Wrench,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/future-ai-enhancements")({
  head: () => ({
    meta: [
      { title: "Future AI Enhancements — Flood Impact Platform | National Grid" },
      {
        name: "description",
        content:
          "A future-state AI roadmap showing how the National Grid flood impact geospatial foundation can scale into forecasting, anomaly detection and decision support.",
      },
      { property: "og:title", content: "Future AI Enhancements | National Grid Flood Platform" },
      {
        property: "og:description",
        content:
          "Six scalable AI capability opportunities built on the current GIS flood-risk proof of concept.",
      },
    ],
  }),
  component: FutureAiEnhancements,
});

type Capability = {
  icon: LucideIcon;
  title: string;
  description: string;
  builds: string;
};

const capabilities: Capability[] = [
  {
    icon: CloudRain,
    title: "AI Flood Forecasting",
    description:
      "Predict emerging flood risk using weather, river, sensor and historical-event data to improve early warning and operational readiness.",
    builds: "Extends Flood Warning Area geometry with time-based prediction",
  },
  {
    icon: Activity,
    title: "Intelligent Anomaly Detection",
    description:
      "Identify abnormal sensor readings, potential sensor failures and emerging flood-risk patterns in near real time.",
    builds: "Adds live telemetry alongside the existing asset register",
  },
  {
    icon: Gauge,
    title: "Dynamic AI Risk Scoring",
    description:
      "Continuously assess flood exposure and potential impact across substations and critical assets as conditions change.",
    builds: "Evolves today's static High / Medium / Low classification",
  },
  {
    icon: ListChecks,
    title: "AI-Assisted Decision Support",
    description:
      "Provide prioritised alerts, recommended actions and escalation guidance to accelerate operational response.",
    builds: "Layers guidance on top of the assets-at-risk register",
  },
  {
    icon: FlaskConical,
    title: "Scenario & What-If Simulation",
    description:
      "Model extreme-weather scenarios to understand potential asset exposure, operational impact and resilience requirements.",
    builds: "Re-runs spatial analysis across simulated flood extents",
  },
  {
    icon: Wrench,
    title: "Predictive Asset Resilience",
    description:
      "Identify assets requiring proactive inspection or maintenance based on flood exposure, environmental conditions, asset health and historical trends.",
    builds: "Combines exposure results with asset health records",
  },
];

function FutureAiEnhancements() {
  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-4 max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-info bg-brand/5 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-brand">
          <Sparkles className="size-3" />
          Future roadmap — not currently implemented
        </span>
        <h1 className="mt-3 text-[15px] font-semibold">Future AI Enhancements</h1>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
          The capabilities below are future enhancement opportunities that could be scaled from the
          current geospatial flood-risk foundation. None of them are operational in this proof of
          concept, which performs GIS intersection and proximity analysis only.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {capabilities.map((c, i) => (
          <section
            key={c.title}
            className="flex flex-col rounded-md border border-border bg-card p-4 shadow-[0_1px_2px_rgba(27,31,35,0.05)] transition-colors hover:border-border-info"
          >
            <div className="mb-2.5 flex items-start justify-between gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border-info bg-brand/5 text-brand">
                <c.icon className="size-4" />
              </span>
              <span className="num text-[10.5px] font-semibold text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h2 className="text-[13.5px] font-semibold leading-snug">{c.title}</h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              {c.description}
            </p>
            <div className="mt-auto pt-3">
              <p className="border-t border-border/60 pt-2.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                Scales from
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed">{c.builds}</p>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-4 max-w-3xl rounded-md border border-border bg-secondary/60 p-3 text-[11.5px] leading-relaxed text-muted-foreground">
        Indicative roadmap for discussion. Delivery of any capability above would require additional
        data feeds, model validation and operational governance beyond the scope of this proof of
        concept.
      </p>
    </div>
  );
}
