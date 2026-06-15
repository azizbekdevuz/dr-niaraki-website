'use client';

import { Calendar, CheckCircle, Clock, Flag, Globe, HelpCircle, Shield, XCircle } from 'lucide-react';
import React from 'react';

import type { PatentItem } from '@/content/schema';
import { displayOrNull } from '@/lib/missingValue';

export type PatentEntryCardProps = {
  patent: PatentItem;
};

export function PatentEntryCard({ patent }: PatentEntryCardProps) {
  const statusMeta = {
    registered: { Icon: CheckCircle, color: 'text-success' },
    pending: { Icon: Clock, color: 'text-warning' },
    expired: { Icon: XCircle, color: 'text-muted' },
    unknown: { Icon: HelpCircle, color: 'text-muted' },
  } as const;
  const { Icon: StatusIcon, color: statusColor } = statusMeta[patent.status] ?? statusMeta.unknown;
  const inventors = displayOrNull(patent.inventors);

  return (
    <article className="card card-rich p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          {patent.country === 'US' ? (
            <Globe className="h-5 w-5 text-accent-primary" aria-hidden />
          ) : (
            <Flag className="h-5 w-5 text-accent-secondary" aria-hidden />
          )}
          <span className="text-sm text-muted">{patent.country}</span>
        </div>
        <div className={`flex items-center gap-1 ${statusColor}`}>
          <StatusIcon className="h-4 w-4" aria-hidden />
          <span className="text-xs capitalize">{patent.status}</span>
        </div>
      </div>

      <h3 className="mb-3 line-clamp-2 text-lg font-semibold text-foreground">{patent.title}</h3>

      <div className="space-y-2 text-sm text-muted">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 shrink-0" aria-hidden />
          <span className="font-mono text-xs md:text-sm">{patent.number}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" aria-hidden />
          <span>{patent.date}</span>
        </div>
      </div>

      {inventors ? (
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted">Inventors: {inventors}</p>
      ) : null}
    </article>
  );
}
