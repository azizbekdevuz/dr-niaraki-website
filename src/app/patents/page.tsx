'use client';

/**
 * Patents page - Registered and pending patents
 */

import { motion } from 'framer-motion';
import { Globe, Flag, Clock, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo } from 'react';

import { PatentEntryCard } from '@/components/patents/PatentEntryCard';
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

// Patent types
type PatentFilter = 'all' | 'international' | 'korean' | 'pending' | 'unknown';

const PATENTS_PAGE_SIZE = 4;

export default function PatentsPage() {
  const siteContent = usePublicSiteContent();
  const { heroIntro, licensingHeading, licensingBody, stats: patentStats, items: patentItems } =
    siteContent.patents;
  const [filter, setFilter] = useState<PatentFilter>('all');

  // Filter patents
  const filteredPatents = useMemo(() => {
    return patentItems.filter((patent) => {
      if (filter === 'all') {
        return true;
      }
      if (filter === 'pending') {
        return patent.status === 'pending';
      }
      if (filter === 'unknown') {
        return patent.status === 'unknown';
      }
      return patent.type === filter;
    });
  }, [filter, patentItems]);

  const patentIds = useMemo(() => patentItems.map((p) => p.id).join('|'), [patentItems]);
  const listResetKey = useMemo(() => `${filter}::${patentIds}`, [filter, patentIds]);

  const {
    slice: pagedPatents,
    page: listPage,
    setPage: setListPage,
    itemCount: filteredCount,
    pageSize: listPageSize,
  } = usePaginatedSlice(filteredPatents, PATENTS_PAGE_SIZE, listResetKey);

  return (
    <main className="min-h-screen pt-24">
      <section className="section pb-10 md:pb-12">
        <div className="container-custom">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-4xl">
            <motion.p variants={itemVariants} className="editorial-kicker mb-4">
              Innovation portfolio
            </motion.p>
            <motion.div variants={itemVariants} className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl ${TW_ACCENT_SOFT_GRADIENT}`}>
              <Shield className="h-7 w-7 text-accent-primary" />
            </motion.div>
            <motion.h1 variants={itemVariants} className="font-editorial mb-5 text-4xl text-foreground md:text-5xl lg:text-6xl">
              Patents
            </motion.h1>
            <motion.p variants={itemVariants} className="max-w-3xl text-secondary md:text-lg">
              {heroIntro}
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-primary/20 bg-surface-secondary/35 py-10">
        <div className="container-custom">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[
              { label: 'Total Patents', value: `${patentStats.total}+`, icon: Shield },
              { label: 'International (US)', value: `${patentStats.international}`, icon: Globe },
              { label: 'Korean', value: `${patentStats.korean}+`, icon: Flag },
              { label: 'Pending', value: `${patentStats.pending}+`, icon: Clock },
            ].map((stat) => (
              <ContentStatTile key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-custom mx-auto max-w-6xl">
          <SectionHeading eyebrow="Portfolio" title="Filter & explore" icon={Shield} className="!mb-6" />

          <div className="panel-premium mb-10 flex flex-wrap gap-2 !p-3">
            {[
              { value: 'all', label: 'All Patents' },
              { value: 'international', label: 'International' },
              { value: 'korean', label: 'Korean' },
              { value: 'pending', label: 'Pending' },
              { value: 'unknown', label: 'Unknown' },
            ].map((option) => (
              <FilterChipButton
                key={option.value}
                selected={filter === option.value}
                onClick={() => setFilter(option.value as PatentFilter)}
              >
                {option.label}
              </FilterChipButton>
            ))}
          </div>

          {filteredPatents.length === 0 ? (
            <EmptyStateHint
              icon={Shield}
              title='No patents match this filter.'
              hint='Try "All Patents" or another category.'
            />
          ) : (
            <>
              <motion.div
                key={listPage}
                initial={{ opacity: 0.88, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="grid gap-6 md:grid-cols-2"
              >
                {pagedPatents.map((patent) => (
                  <PatentEntryCard key={patent.id} patent={patent} />
                ))}
              </motion.div>

              <ListPagination
                page={listPage}
                itemCount={filteredCount}
                pageSize={listPageSize}
                onPageChange={setListPage}
                ariaLabel="Patents list pages"
              />
            </>
          )}
        </div>
      </section>

      <section className="section pt-6 md:pt-8">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="panel-premium text-center"
          >
            <p className="editorial-kicker mb-3">Partnership</p>
            <h2 className="font-editorial mb-4 text-3xl font-semibold text-foreground md:text-4xl">
              {licensingHeading}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-muted">{licensingBody}</p>
            <Link href="/contact" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
              Get in Touch
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
