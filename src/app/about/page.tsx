'use client';

/**
 * About page - Full biography and academic information
 */

import { motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  Users,
  Globe,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import {
  AboutAwardsSection,
  AboutExperienceSection,
  AboutJourneySection,
} from '@/components/about/AboutPaginatedSections';
import { ContentStatTile } from '@/components/shared/ContentStatTile';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { usePublicSiteContent } from '@/contexts/PublicSiteContentContext';
import { TW_ACCENT_SOFT_GRADIENT } from '@/lib/ui/chromeClassStrings';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AboutPage() {
  const siteContent = usePublicSiteContent();
  const { journey, experiences, awards, stats, page } = siteContent.about;
  const { displayName, roleLine, photoSrc, photoAlt, aboutIntroTagline, aboutSkillTags } =
    siteContent.profile;

  const statsRow = [
    { icon: BookOpen, value: `${stats.publications}+`, label: 'Publications' },
    { icon: Users, value: `${stats.studentsSupervised}+`, label: 'Graduate students supervised' },
    { icon: Globe, value: `${stats.countriesCollaborated}+`, label: 'Countries' },
    { icon: Award, value: `${stats.thesesExamined}+`, label: 'Theses examined (external)' },
  ];

  return (
    <main className="min-h-screen pt-24">
      <section className="section pb-10 md:pb-14">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <motion.div variants={itemVariants} className="order-2 space-y-5 lg:order-1">
              <p className="editorial-kicker">Academic profile</p>
              <h1 className="font-editorial text-4xl leading-tight text-foreground md:text-5xl lg:text-6xl">
                {displayName}
              </h1>
              <p className="text-base font-medium text-accent-primary md:text-lg">{roleLine}</p>
              <p className="max-w-2xl text-secondary leading-relaxed">{aboutIntroTagline}</p>
              <div className="flex flex-wrap gap-2.5">
                {aboutSkillTags.map((tag, i) => {
                  const palette = [
                    'border-accent-primary/35 text-accent-primary',
                    'border-accent-secondary/35 text-accent-secondary',
                    'border-accent-tertiary/35 text-accent-tertiary',
                  ] as const;
                  const cls = palette[i % palette.length];
                  return (
                    <span
                      key={tag}
                      className={`rounded-full border bg-surface-secondary/45 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.08em] ${cls}`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="order-1 lg:order-2">
              <div className="panel-premium relative mx-auto flex max-w-[26rem] items-center justify-center p-6 md:p-8">
                <div className={`absolute inset-0 rounded-2xl opacity-60 blur-2xl ${TW_ACCENT_SOFT_GRADIENT}`} />
                <div className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-accent-primary/35 md:h-80 md:w-80">
                  <Image src={photoSrc} alt={photoAlt} fill className="object-cover" priority />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-primary/20 bg-surface-secondary/35 py-10">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
          >
            {statsRow.map((stat) => (
              <motion.div key={stat.label} variants={itemVariants}>
                <ContentStatTile variant="hero" icon={stat.icon} value={stat.value} label={stat.label} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <SectionHeading eyebrow="Overview" title="Professional Summary" className="!mb-6" />
            </motion.div>
            <motion.div variants={itemVariants} className="panel-premium space-y-4">
              {page.professionalSummaryParagraphs.map((paragraph, idx) => (
                <p key={idx} className="text-secondary leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="section bg-gradient-to-b from-transparent via-surface-tertiary/70 to-transparent">
        <div className="container-custom mx-auto max-w-5xl">
          <AboutJourneySection journey={journey} itemVariants={itemVariants} />
        </div>
      </section>

      <section className="section">
        <div className="container-custom">
          <AboutExperienceSection experiences={experiences} itemVariants={itemVariants} />
        </div>
      </section>

      <section className="section bg-gradient-to-b from-transparent via-surface-tertiary/70 to-transparent">
        <div className="container-custom mx-auto max-w-5xl">
          <AboutAwardsSection awards={awards} itemVariants={itemVariants} />
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
            <p className="editorial-kicker mb-3">Collaboration</p>
            <h2 className="font-editorial mb-4 text-3xl font-semibold text-foreground md:text-4xl">
              {page.collaborationHeading}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-muted">{page.collaborationBody}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
                Get in Touch
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/publications" className="btn-secondary inline-flex items-center gap-2 px-8 py-3">
                View Publications
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
