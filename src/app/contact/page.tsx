'use client';

/**
 * Contact page - Contact information and form
 */

import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  GraduationCap,
  Building,
  ExternalLink,
} from 'lucide-react';
import React from 'react';

import { ContactMessageForm } from '@/components/contact/ContactMessageForm';
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

const CONTACT_SOCIAL_ICON_MAP = {
  GraduationCap,
  Linkedin,
  Building,
} as const;

export default function ContactPage() {
  const siteContent = usePublicSiteContent();
  const { heroHeading, heroSubtext, mapPlaceLabel, mapQueryUrl, info: contactInfo, socialLinks } =
    siteContent.contact;

  return (
    <main className="min-h-screen pt-24">
      <section className="section pb-10 md:pb-12">
        <div className="container-custom">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-4xl">
            <motion.p variants={itemVariants} className="editorial-kicker mb-4">
              Contact desk
            </motion.p>
            <motion.div variants={itemVariants} className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl ${TW_ACCENT_SOFT_GRADIENT}`}>
              <Mail className="h-7 w-7 text-accent-primary" />
            </motion.div>
            <motion.h1 variants={itemVariants} className="font-editorial mb-5 text-4xl text-foreground md:text-5xl lg:text-6xl">
              {heroHeading}
            </motion.h1>
            <motion.p variants={itemVariants} className="max-w-3xl text-secondary md:text-lg">
              {heroSubtext}
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="section pt-4 md:pt-6">
        <div className="container-custom">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <motion.h2 variants={itemVariants} className="font-editorial mb-6 text-3xl text-foreground">
                Contact Information
              </motion.h2>

              <div className="space-y-5">
                <motion.div variants={itemVariants} className="card card-rich p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10">
                      <Mail className="h-5 w-5 text-accent-primary" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-sm font-semibold uppercase tracking-[0.09em] text-foreground/90">Email</h3>
                      <a href={`mailto:${contactInfo.email}`} className="block text-accent-primary hover:underline">
                        {contactInfo.email}
                      </a>
                      <a href={`mailto:${contactInfo.personalEmail}`} className="text-sm text-muted hover:text-foreground">
                        {contactInfo.personalEmail}
                      </a>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="card card-rich p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10">
                      <Phone className="h-5 w-5 text-accent-primary" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-sm font-semibold uppercase tracking-[0.09em] text-foreground/90">Phone</h3>
                      <p className="text-secondary">Tel: {contactInfo.phone}</p>
                      <p className="text-sm text-muted">Fax: {contactInfo.fax}</p>
                      <p className="text-sm text-muted">Cell: {contactInfo.cellPhone}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="card card-rich p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10">
                      <MapPin className="h-5 w-5 text-accent-primary" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-sm font-semibold uppercase tracking-[0.09em] text-foreground/90">Office</h3>
                      <p className="text-secondary">{contactInfo.department}</p>
                      <p className="text-secondary">{contactInfo.university}</p>
                      <p className="mt-1 text-sm text-muted">{contactInfo.address}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="card card-rich p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10">
                      <Globe className="h-5 w-5 text-accent-primary" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-sm font-semibold uppercase tracking-[0.09em] text-foreground/90">Website</h3>
                      <a
                        href={
                          contactInfo.websiteDisplay.startsWith('http')
                            ? contactInfo.websiteDisplay
                            : `https://${contactInfo.websiteDisplay}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-accent-primary hover:underline"
                      >
                        {contactInfo.websiteDisplay}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="mt-8">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.09em] text-foreground/90">Connect</h3>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social) => {
                    const SocIcon = CONTACT_SOCIAL_ICON_MAP[social.iconName];
                    return (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-surface-secondary/60 px-4 py-2.5 transition-colors hover:border-accent-primary/40 hover:bg-surface-hover"
                      >
                        <SocIcon className={`h-5 w-5 ${social.colorClass}`} />
                        <span className="text-sm text-foreground">{social.name}</span>
                      </a>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <ContactMessageForm
                directEmail={contactInfo.email}
                siteBrand={siteContent.meta.openGraphSiteName}
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section pt-6 md:pt-8">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="panel-premium overflow-hidden"
          >
            <div className="flex aspect-video items-center justify-center rounded-xl border border-primary/20 bg-surface-tertiary/65">
              <div className="text-center text-muted">
                <MapPin className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>{mapPlaceLabel}</p>
                <a
                  href={mapQueryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center justify-center gap-1 text-accent-primary hover:underline"
                >
                  Open in Google Maps
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
