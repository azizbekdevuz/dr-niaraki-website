'use client';

import { Dot, ExternalLink } from 'lucide-react';
import React from 'react';

import type { PublicationItem } from '@/content/schema';

import { getPublicationTypeLabel, getPublicationTypeStyle } from './publicationLabels';

export type PublicationEntryCardProps = {
  publication: PublicationItem;
};

export function PublicationEntryCard({ publication: pub }: PublicationEntryCardProps) {
  return (
    <article className="card card-rich group p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getPublicationTypeStyle(pub.type)}`}>
              {getPublicationTypeLabel(pub.type)}
            </span>
            <span className="text-sm font-medium text-muted">{pub.year}</span>
            {pub.quartile ? (
              <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-success">
                {pub.quartile}
              </span>
            ) : null}
          </div>

          <h3 className="font-editorial mb-2 text-2xl font-semibold text-foreground transition-colors group-hover:text-accent-primary">
            {pub.title}
          </h3>

          <p className="mb-2 text-sm text-muted">{pub.authors}</p>

          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-secondary">
            <span>{pub.journal}</span>
            {pub.impactFactor ? (
              <span className="inline-flex items-center gap-1 text-muted">
                <Dot className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span>IF: {pub.impactFactor}</span>
              </span>
            ) : null}
          </p>
        </div>

        {pub.doi ? (
          <a
            href={`https://doi.org/${pub.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-surface-secondary/50 px-3 py-2 text-sm font-medium text-accent-primary transition-colors hover:border-accent-primary hover:bg-accent-primary/10"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            DOI
          </a>
        ) : null}
      </div>
    </article>
  );
}
