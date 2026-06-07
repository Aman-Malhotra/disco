import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import type { CampaignPackage } from "@/entities/campaign";
import { Card, Eyebrow } from "@/shared/ui";

import { ScoredList, type ScoredItem } from "./ScoredList";

export function PackageView({ pkg }: { pkg: CampaignPackage }) {
  const publishers: ScoredItem[] = (pkg.publishers?.matches ?? []).map((m) => ({
    id: m.publisher_id,
    name: m.name,
    score: m.fit_score,
    matches: m.reasoning,
    mismatches: m.risks,
  }));
  const personas: ScoredItem[] = (pkg.personas?.personas ?? []).map((p) => ({
    id: p.persona_id,
    name: p.name,
    score: p.score,
    matches: p.reasoning,
    mismatches: p.risks,
  }));

  return (
    <div className="space-y-4">
      {pkg.advertiser_profile && <ProfileCard p={pkg.advertiser_profile} />}
      {publishers.length > 0 && <ScoredList title="Recommended publishers" items={publishers} />}
      {personas.length > 0 && <ScoredList title="Target personas" items={personas} />}
      {pkg.campaign && <CampaignCard c={pkg.campaign} />}
      {pkg.creatives.length > 0 && <CreativesCard creatives={pkg.creatives} />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <Eyebrow className="mb-3">{title}</Eyebrow>
      {children}
    </Card>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t, i) => (
        <span
          key={i}
          className="rounded-md border border-canvas-rule bg-canvas-inset px-2 py-0.5 text-xs text-ink-dim"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function ProfileCard({ p }: { p: NonNullable<CampaignPackage["advertiser_profile"]> }) {
  return (
    <Section title="Advertiser profile">
      <p className="text-sm text-ink">
        <span className="font-medium">{p.category}</span>
        {p.subcategory ? ` · ${p.subcategory}` : ""}
        {p.positioning ? ` · ${p.positioning}` : ""}
      </p>
      {p.summary && <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">{p.summary}</p>}
      {p.benefits.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-ink-mute">Benefits</p>
          <Chips items={p.benefits} />
        </div>
      )}
      {p.audience_traits.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-ink-mute">Audience</p>
          <Chips items={p.audience_traits} />
        </div>
      )}
    </Section>
  );
}

function CampaignCard({ c }: { c: NonNullable<CampaignPackage["campaign"]> }) {
  const t = c.targeting;
  const tags = [
    ...(t.age_min || t.age_max ? [`age ${t.age_min ?? "?"}–${t.age_max ?? "?"}`] : []),
    ...t.genders,
    ...t.geos,
    ...t.income_tiers,
    ...t.interests,
  ];
  return (
    <Section title="Campaign config">
      <div className="flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm">
        <Stat label="objective" value={c.objective} />
        <Stat label="daily budget" value={`$${c.daily_budget_usd.toLocaleString()}`} />
        <Stat
          label="bid"
          value={`${c.bid_strategy.model} · $${c.bid_strategy.suggested_bid_low_usd ?? "?"}–${c.bid_strategy.suggested_bid_high_usd ?? "?"}`}
        />
      </div>

      {tags.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs text-ink-mute">Targeting</p>
          <Chips items={tags} />
        </div>
      )}

      <div className="mt-4 space-y-1.5">
        <p className="text-xs text-ink-mute">Budget allocation</p>
        {c.allocation.map((a) => (
          <div key={a.publisher_id} className="flex items-center gap-3 font-mono text-sm">
            <span className="w-40 truncate text-ink-dim">{a.name}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas-rule">
              <div className="h-full rounded-full bg-brand" style={{ width: `${a.pct}%` }} />
            </div>
            <span className="w-10 text-right text-ink-dim">{a.pct}%</span>
          </div>
        ))}
      </div>

      {c.rationale && <p className="mt-3 text-sm leading-relaxed text-ink-mute">{c.rationale}</p>}
    </Section>
  );
}

function CreativesCard({ creatives }: { creatives: CampaignPackage["creatives"] }) {
  return (
    <Section title="Ad creatives">
      <div className="grid gap-2 sm:grid-cols-2">
        {creatives.map((cr, i) => (
          <div key={i} className="rounded-xl border border-canvas-rule bg-canvas-inset/60 p-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-violet" />
              <span className="text-xs text-ink-mute">{cr.persona_name}</span>
            </div>
            <p className="font-display text-sm font-semibold leading-snug text-ink">{cr.headline}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-dim">{cr.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute">{label}</span>
      <p className="text-ink">{value}</p>
    </div>
  );
}
