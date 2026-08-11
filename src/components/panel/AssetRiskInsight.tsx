import { Sparkles } from "lucide-react";
import { useCallback, useState } from "react";

import { RiskBadge } from "@/components/common/RiskBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateAssetRiskInsight, type AssetRiskInsight } from "@/lib/ai/asset-insight";
import type { AssetProperties } from "@/lib/gis/types";

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
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

export function AssetRiskInsightAction({ asset }: { asset: AssetProperties }) {
  const [open, setOpen] = useState(false);
  const [insight, setInsight] = useState<AssetRiskInsight | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setOpen(true);
    setBusy(true);
    setInsight(await generateAssetRiskInsight(asset));
    setBusy(false);
  }, [asset]);

  return (
    <>
      <button
        type="button"
        onClick={run}
        title="Generate a risk insight from this asset's data (AI Risk Insight Preview)"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-sm border border-primary/50 bg-primary/10 px-2.5 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Sparkles className="size-3.5" />✦ AI Risk Insight
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-[15px]">✦ AI Risk Insight Preview</DialogTitle>
            <DialogDescription className="text-[11.5px]">
              Future AI capability. This insight is generated locally from the selected asset's
              recorded data using deterministic logic — no LLM or external AI service is used at
              this stage.
            </DialogDescription>
          </DialogHeader>

          {busy || !insight ? (
            <p className="py-6 text-[12.5px] text-muted-foreground">Analysing selected asset data…</p>
          ) : (
            <div className="space-y-4">
              <section>
                <div className="flex items-center gap-2">
                  <h3 className="text-[13.5px] font-semibold">{insight.headline}</h3>
                  {!insight.insufficientData && <RiskBadge risk={insight.risk} />}
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed">{insight.assessment}</p>
              </section>

              <List title="Why this asset is at risk" items={insight.reasons} />
              <List title="Recommended focus" items={insight.recommendedFocus} />

              <p className="border-t border-border pt-2 text-[10.5px] text-muted-foreground">
                Generated {new Date(insight.generatedAt).toLocaleString()} · local deterministic
                generator · replaceable with Azure-hosted AI processing
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
