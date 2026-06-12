import 'server-only';

import type { SiteContent } from '@/content/schema';
import type { ImportQualityHints } from '@/server/imports/importMergeSectionSafety.types';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

export function deriveImportQualityHints(
  details: DetailsSchemaType,
  mergeBaseline: SiteContent,
): ImportQualityHints {
  return {
    journeyCollapse: {
      importedCount: details.about.education.length,
      baselineCount: mergeBaseline.about.journey.length,
      hasGiantRows: details.about.education.some(
        (e) => (e.details?.length ?? 0) > 400 || (e.raw?.length ?? 0) > 400,
      ),
    },
    experienceQuality: {
      unknownOrgCount: details.about.positions.filter((p) => p.institution === 'Unknown Organization').length,
      totalCount: details.about.positions.length,
    },
  };
}
