import { useCallback, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateRiskSummary, type RiskSummary } from "@/lib/ai/risk-summary";
import type { GisData } from "@/lib/gis/types";

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-1.5 text-[12.5px] leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AiSummaryDialog({ data }: { data: GisData | undefined }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setOpen(true);
    setBusy(true);
    setSummary(await generateRiskSummary(data));
    setBusy(false);
  }, [data]);

  return (
    <>
      <button
        type="button"
        onClick={run}
        className="rounded-sm border border-primary/50 bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title="Generate an executive summary from the loaded data (AI Summary Preview)"
      >
        ✦ AI Summary
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-[16px]">✦ AI Summary Preview</DialogTitle>
            <DialogDescription className="text-[11.5px]">
              Future AI capability. This preview is generated locally from the loaded GIS analysis
              results using deterministic logic — no LLM or external AI service is used at this
              stage.
            </DialogDescription>
          </DialogHeader>

          {busy || !summary ? (
            <p className="py-6 text-[12.5px] text-muted-foreground">Analysing current dashboard data…</p>
          ) : (
            <div className="space-y-4">
              <Section title="Situation" items={summary.situation} />
              <Section title="Key Risks" items={summary.keyRisks} />
              <Section title="Recommended Focus" items={summary.recommendedFocus} />

              {summary.hotspots.length > 0 && (
                <section>
                  <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Highest-impact Flood Warning Areas
                  </h3>
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="py-1 font-medium">Flood Warning Area</th>
                        <th className="py-1 text-right font-medium">Subs</th>
                        <th className="py-1 text-right font-medium">OHL</th>
                        <th className="py-1 text-right font-medium">Cables</th>
                        <th className="py-1 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.hotspots.map((h) => (
                        <tr key={h.id} className="border-b border-border/60">
                          <td className="py-1 pr-2">{h.name}</td>
                          <td className="num py-1 text-right">{h.substations}</td>
                          <td className="num py-1 text-right">{h.ohl}</td>
                          <td className="num py-1 text-right">{h.cables}</td>
                          <td className="num py-1 text-right font-semibold">{h.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              <p className="border-t border-border pt-2 text-[10.5px] text-muted-foreground">
                Generated {new Date(summary.generatedAt).toLocaleString()} · local deterministic
                generator · replaceable with Azure-hosted AI processing
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
