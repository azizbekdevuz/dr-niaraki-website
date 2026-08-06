'use client';

import type { LucideIcon } from 'lucide-react';
import React from 'react';

import type { SiteContent } from '@/content/schema';

type ResearchInterest = SiteContent['research']['interests'][number];

const ICON_BOX =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent-primary/25 bg-accent-primary/10 transition-colors group-hover:border-accent-primary/40 group-hover:bg-accent-primary/15';

export type ResearchInterestCardProps = {
  interest: ResearchInterest;
  icon: LucideIcon;
};

export function ResearchInterestCard({ interest, icon: InterestIcon }: ResearchInterestCardProps) {
  return (
    <article className="card card-rich group p-6">
      <div className="flex items-start gap-4">
        <span className={ICON_BOX}>
          <InterestIcon className="h-6 w-6 text-accent-primary" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-editorial mb-2 text-2xl font-semibold text-foreground">{interest.name}</h3>
          <p className="mb-3 text-sm leading-relaxed text-muted">{interest.description}</p>
          <div className="flex flex-wrap gap-2">
            {interest.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-primary/20 bg-surface-secondary/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted transition-colors group-hover:border-primary/30"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
