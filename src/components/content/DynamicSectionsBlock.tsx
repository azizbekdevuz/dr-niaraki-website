'use client';

/**
 * Safe public/draft preview for CV-derived dynamic sections.
 * Text-only rendering — never uses dangerouslySetInnerHTML.
 */

import React from 'react';

import { SectionHeading } from '@/components/shared/SectionHeading';
import type { DynamicSection, DynamicSectionItem } from '@/content/schema';

function paragraphsFromBody(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function RichTextBody({ body }: { body: string }) {
  const paragraphs = paragraphsFromBody(body);
  if (paragraphs.length === 0) {return null;}
  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-secondary leading-relaxed whitespace-pre-wrap">
          {p}
        </p>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: readonly DynamicSectionItem[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-secondary">
      {items.map((item) => (
        <li key={item.id} className="leading-relaxed">
          <span className="text-foreground">{item.title}</span>
          {item.body ? <span className="text-muted"> — {item.body}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function TimelineList({ items }: { items: readonly DynamicSectionItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-2 md:flex-row md:items-start md:gap-4">
          {item.date ? (
            <span className="inline-block shrink-0 rounded-full bg-accent-primary/15 px-3 py-1 text-sm font-medium text-accent-primary ring-1 ring-accent-primary/20">
              {item.date}
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
            {item.body ? <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupedCards({ items }: { items: readonly DynamicSectionItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <article key={item.id} className="card card-rich p-5">
          <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
          {item.body ? (
            <p className="text-sm leading-relaxed text-muted whitespace-pre-wrap">{item.body}</p>
          ) : null}
          {item.date ? <p className="mt-2 text-xs text-accent-primary">{item.date}</p> : null}
        </article>
      ))}
    </div>
  );
}

function KeyValueList({ items }: { items: readonly DynamicSectionItem[] }) {
  return (
    <dl className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-1 border-b border-primary/10 pb-3 last:border-0 last:pb-0 sm:flex-row sm:gap-4"
        >
          <dt className="shrink-0 text-sm font-semibold text-foreground sm:w-40">{item.title}</dt>
          <dd className="min-w-0 text-sm leading-relaxed text-secondary whitespace-pre-wrap">
            {item.body ?? ''}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SectionBody({ section }: { section: DynamicSection }) {
  const items = section.items ?? [];
  if (section.presentation === 'bullet_list' && items.length > 0) {
    return <BulletList items={items} />;
  }
  if (section.presentation === 'timeline' && items.length > 0) {
    return <TimelineList items={items} />;
  }
  if (section.presentation === 'grouped_cards' && items.length > 0) {
    return <GroupedCards items={items} />;
  }
  if (section.presentation === 'key_value' && items.length > 0) {
    return <KeyValueList items={items} />;
  }
  if (section.body) {
    return <RichTextBody body={section.body} />;
  }
  return null;
}

export type DynamicSectionsBlockProps = {
  sections: readonly DynamicSection[];
  /** Optional eyebrow above the first section heading band. */
  eyebrow?: string;
};

/**
 * Renders sorted dynamic sections for About (or draft preview).
 * Returns null when there is nothing to show.
 */
export function DynamicSectionsBlock({
  sections,
  eyebrow = 'Additional CV sections',
}: DynamicSectionsBlockProps) {
  const sorted = [...sections].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );
  if (sorted.length === 0) {return null;}

  return (
    <div className="space-y-10">
      {sorted.map((section, index) => (
        <div key={section.id}>
          <SectionHeading
            eyebrow={index === 0 ? eyebrow : undefined}
            title={section.title}
            className="!mb-5"
          />
          <div className="list-page-panel p-6 md:p-8">
            <SectionBody section={section} />
          </div>
        </div>
      ))}
    </div>
  );
}
