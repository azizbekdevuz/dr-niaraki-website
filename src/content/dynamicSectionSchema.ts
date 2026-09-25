/**
 * Zod schemas for CV-derived dynamic sections on SiteContent.
 */

import { z } from 'zod';

/** Presentation modes for CV-derived dynamic sections on the public site. */
export const DynamicSectionPresentationSchema = z.enum([
  'rich_text',
  'bullet_list',
  'timeline',
  'grouped_cards',
  'key_value',
]);

export const DynamicSectionItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().optional(),
  date: z.string().optional(),
  meta: z.record(z.string(), z.string()).optional(),
});

export const DynamicSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  presentation: DynamicSectionPresentationSchema,
  sortOrder: z.number().int(),
  /** Plain text body for `rich_text` presentation. */
  body: z.string().optional(),
  items: z.array(DynamicSectionItemSchema).optional(),
  sourceNormalizedTitle: z.string().optional(),
});

export type DynamicSection = z.infer<typeof DynamicSectionSchema>;
export type DynamicSectionItem = z.infer<typeof DynamicSectionItemSchema>;
export type DynamicSectionPresentation = z.infer<typeof DynamicSectionPresentationSchema>;
