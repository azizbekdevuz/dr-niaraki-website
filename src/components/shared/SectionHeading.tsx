'use client';

import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

export type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  icon?: LucideIcon;
  /** Default: start (public dense pages). Center for homepage-style bands. */
  align?: 'start' | 'center';
  /** Override title typography (e.g. homepage hero scale). */
  titleClassName?: string;
  className?: string;
};

/**
 * Dense list / content sections: clear hierarchy + subtle tech accent.
 */
export function SectionHeading({
  eyebrow,
  title,
  icon: Icon,
  align = 'start',
  titleClassName,
  className,
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <header className={clsx('mb-8 md:mb-10', centered && 'text-center', className)}>
      {eyebrow ? (
        <p
          className={clsx(
            'editorial-kicker mb-2',
            centered && 'mx-auto max-w-prose',
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <div className={clsx('flex flex-wrap items-center gap-3', centered && 'justify-center')}>
        {Icon ? (
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent-primary/35 bg-accent-primary/10 shadow-section-heading-icon">
            <Icon className="h-5 w-5 text-accent-primary" aria-hidden />
          </span>
        ) : null}
        <h2
          className={clsx(
            'font-editorial text-3xl font-semibold tracking-tight text-foreground md:text-4xl',
            titleClassName,
          )}
        >
          {title}
        </h2>
      </div>
      <div
        className={clsx(
          'mt-4 h-px max-w-[12rem] rounded-full bg-gradient-to-r from-accent-primary/90 via-accent-secondary/55 to-transparent',
          centered && 'mx-auto',
        )}
        aria-hidden
      />
    </header>
  );
}
