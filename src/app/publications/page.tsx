'use client';

/**
 * Publications page - Academic publications and citations
 */

import { motion } from 'framer-motion';
import {
  FileText,
  Book,
  BookOpen,
  ExternalLink,
  Search,
  Calendar,
  Award,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { PublicationEntryCard } from '@/components/publications/PublicationEntryCard';
import type { PublicationTypeFilter } from '@/components/publications/publicationLabels';
import { ContentStatTile } from '@/components/shared/ContentStatTile';
import { EmptyStateHint } from '@/components/shared/EmptyStateHint';
import { FilterChipButton } from '@/components/shared/FilterChipButton';
import { ListPagination } from '@/components/shared/ListPagination';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { usePublicSiteContent } from '@/contexts/PublicSiteContentContext';
import { usePaginatedSlice } from '@/hooks/usePaginatedSlice';
import { TW_ACCENT_SOFT_GRADIENT } from '@/lib/ui/chromeClassStrings';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const PUBLICATIONS_PAGE_SIZE = 5;

export default function PublicationsPage() {
  const siteContent = usePublicSiteContent();
  const { heroIntro, scholarUrl, stats: publicationStats, items: publicationItems } =
    siteContent.publications;
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<PublicationTypeFilter>('all');
  const [yearSort, setYearSort] = useState<'desc' | 'asc'>('desc');

  // Filter and sort publications
  const filteredPublications = useMemo(() => {
    return publicationItems
      .filter((pub) => {
        const matchesSearch =
          searchQuery === '' ||
          pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pub.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pub.journal.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || pub.type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        return yearSort === 'desc' ? b.year - a.year : a.year - b.year;
      });
  }, [searchQuery, typeFilter, yearSort, publicationItems]);

  const publicationIds = useMemo(
    () => publicationItems.map((p) => p.id).join('|'),
    [publicationItems],
  );
  const listResetKey = useMemo(
    () => `${searchQuery}::${typeFilter}::${yearSort}::${publicationIds}`,
    [searchQuery, typeFilter, yearSort, publicationIds],
  );

  const {
    slice: pagedPublications,
    page: listPage,
    setPage: setListPage,
    itemCount: filteredCount,
    pageSize: listPageSize,
  } = usePaginatedSlice(filteredPublications, PUBLICATIONS_PAGE_SIZE, listResetKey);

  return (
    <main className="min-h-screen pt-24">
      <section className="section pb-10 md:pb-12">
        <div className="container-custom">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-4xl">
            <motion.p variants={itemVariants} className="editorial-kicker mb-4">
              Publication archive
            </motion.p>
            <motion.div variants={itemVariants} className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl ${TW_ACCENT_SOFT_GRADIENT}`}>
              <FileText className="h-7 w-7 text-accent-primary" />
            </motion.div>
            <motion.h1 variants={itemVariants} className="font-editorial mb-5 text-4xl text-foreground md:text-5xl lg:text-6xl">
              Publications
            </motion.h1>
            <motion.p variants={itemVariants} className="max-w-3xl text-secondary md:text-lg">
              {heroIntro}
            </motion.p>
            <motion.a
              variants={itemVariants}
              href={scholarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent-primary/35 px-4 py-2 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary/10"
            >
              <Award className="h-4 w-4" />
              View on Google Scholar
              <ExternalLink className="h-4 w-4" />
            </motion.a>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-primary/20 bg-surface-secondary/35 py-10">
        <div className="container-custom">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
            {[
              { label: 'Total Publications', value: `${publicationStats.total}+`, icon: FileText },
              { label: 'Journal Papers', value: `${publicationStats.journals}+`, icon: BookOpen },
              { label: 'Conferences', value: `${publicationStats.conferences}+`, icon: FileText },
              { label: 'Books', value: `${publicationStats.books}`, icon: Book },
              { label: 'Ph.D. advised', value: `${publicationStats.phdAdvised}+`, icon: Award },
            ].map((stat) => (
              <ContentStatTile key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-custom mx-auto max-w-6xl">
          <SectionHeading eyebrow="Library" title="Browse & filter" icon={Search} className="!mb-6" />

          <div className="panel-premium mb-10 flex flex-col gap-4 md:flex-row md:items-stretch">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search publications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-full min-h-11 w-full rounded-xl border border-primary/45 bg-background/35 py-3 pl-10 pr-4 text-foreground outline-none ring-accent-primary/30 transition-all placeholder:text-muted/70 focus:border-accent-primary focus:ring-2"
              />
            </div>

            <div className="flex flex-wrap gap-2 md:items-center">
              {(['all', 'journal', 'conference', 'book', 'other'] as PublicationTypeFilter[]).map((type) => {
                let label = 'All';
                if (type !== 'all') {
                  label = type === 'other' ? 'Other' : `${type.charAt(0).toUpperCase()}${type.slice(1)}s`;
                }
                return (
                  <FilterChipButton key={type} selected={typeFilter === type} onClick={() => setTypeFilter(type)}>
                    {label}
                  </FilterChipButton>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setYearSort(yearSort === 'desc' ? 'asc' : 'desc')}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/35 bg-surface-secondary/70 px-4 py-2.5 font-medium text-muted transition-all hover:border-accent-primary/40 hover:text-foreground md:min-w-[11rem]"
            >
              <Calendar className="h-4 w-4 shrink-0 text-accent-primary" />
              <span>{yearSort === 'desc' ? 'Newest first' : 'Oldest first'}</span>
            </button>
          </div>

          {filteredPublications.length === 0 ? (
            <EmptyStateHint
              icon={FileText}
              title="No publications match this view."
              hint="Try clearing search or switching the type filter."
            />
          ) : (
            <>
              <motion.div
                key={listPage}
                initial={{ opacity: 0.88, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                {pagedPublications.map((pub) => (
                  <PublicationEntryCard key={pub.id} publication={pub} />
                ))}
              </motion.div>

              <ListPagination
                page={listPage}
                itemCount={filteredCount}
                pageSize={listPageSize}
                onPageChange={setListPage}
                ariaLabel="Publications list pages"
              />
            </>
          )}

          <div className="mt-8 text-center">
            <a
              href={scholarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-2 px-8 py-3"
            >
              View All on Google Scholar
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
