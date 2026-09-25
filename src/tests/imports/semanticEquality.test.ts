import { describe, expect, it } from 'vitest';

import { parseAcceptedCvNormalizedSnapshot } from '@/server/imports/cvUpdate/normalizeBaseline';
import {
  normalizeSemanticText,
  semanticAward,
  semanticEqual,
  semanticPatent,
  semanticPublication,
} from '@/server/imports/cvUpdate/semanticEquality';

describe('semanticEqual via semantic builders', () => {
  it('treats null, undefined, and absent fields equivalently for publications', () => {
    expect(
      semanticEqual(
        semanticPublication({ title: 'Paper A', authors: null, journal: undefined }),
        semanticPublication({ title: 'Paper A' }),
      ),
    ).toBe(true);
  });

  it('treats null, undefined, and absent fields equivalently for patents', () => {
    expect(
      semanticEqual(
        semanticPatent({ title: 'Patent A', inventors: null, number: undefined }),
        semanticPatent({ title: 'Patent A' }),
      ),
    ).toBe(true);
  });

  it('treats null, undefined, and absent fields equivalently for awards', () => {
    expect(
      semanticEqual(
        semanticAward({ title: 'Award A', organization: null, details: undefined }),
        semanticAward({ title: 'Award A' }),
      ),
    ).toBe(true);
  });

  it('equates KR and Korea for patents', () => {
    expect(
      semanticEqual(
        semanticPatent({ title: 'GeoAI System', country: 'KR', number: '10-123' }),
        semanticPatent({ title: 'GeoAI System', country: 'Korea', number: '10-123' }),
      ),
    ).toBe(true);
  });

  it('strips wrapping quotes from titles', () => {
    expect(
      semanticEqual(
        semanticPatent({ title: 'Mixed reality device', number: '10-1' }),
        semanticPatent({ title: '"Mixed reality device"', number: '10-1' }),
      ),
    ).toBe(true);
  });

  it('equates Registration completed with registered, not Application completed', () => {
    expect(
      semanticEqual(
        semanticPatent({ title: 'XR Device', status: 'Registration completed' }),
        semanticPatent({ title: 'XR Device', status: 'registered' }),
      ),
    ).toBe(true);
    expect(
      semanticEqual(
        semanticPatent({ title: 'XR Device', status: 'Application completed' }),
        semanticPatent({ title: 'XR Device', status: 'pending' }),
      ),
    ).toBe(true);
    expect(
      semanticEqual(
        semanticPatent({ title: 'XR Device', status: 'Application completed' }),
        semanticPatent({ title: 'XR Device', status: 'registered' }),
      ),
    ).toBe(false);
    expect(
      semanticEqual(
        semanticPatent({ title: 'XR Device', status: 'pending' }),
        semanticPatent({ title: 'XR Device', status: 'registered' }),
      ),
    ).toBe(false);
    // Bare "completed" must not silently equal registered.
    expect(
      semanticEqual(
        semanticPatent({ title: 'XR Device', status: 'completed' }),
        semanticPatent({ title: 'XR Device', status: 'registered' }),
      ),
    ).toBe(false);
  });

  it('does not equate different titles', () => {
    expect(
      semanticEqual(
        semanticAward({ title: 'Best Paper Award' }),
        semanticAward({ title: 'Outstanding Researcher Award' }),
      ),
    ).toBe(false);
    expect(
      semanticEqual(
        semanticPatent({ title: 'Patent Alpha' }),
        semanticPatent({ title: 'Patent Beta' }),
      ),
    ).toBe(false);
    expect(
      semanticEqual(
        semanticPublication({ title: 'Paper One' }),
        semanticPublication({ title: 'Paper Two' }),
      ),
    ).toBe(false);
  });

  it('ignores id differences when using semantic builders', () => {
    const awardA = { id: 'A1', title: 'Best Paper', organization: 'IEEE', year: '2020', raw: 'x' };
    const awardB = { id: 'B1', title: 'Best Paper', organization: 'IEEE', year: '2020' };
    expect(semanticEqual(semanticAward(awardA), semanticAward(awardB))).toBe(true);
    expect('id' in semanticAward(awardA)).toBe(false);

    const patentA = {
      id: 'P1',
      title: 'Spatial Method',
      number: 'KR-1',
      country: 'KR',
      raw: 'noise',
    };
    const patentB = { id: 'Q1', title: 'Spatial Method', number: 'KR-1', country: 'Korea' };
    expect(semanticEqual(semanticPatent(patentA), semanticPatent(patentB))).toBe(true);
  });

  it('normalizes whitespace and unicode dashes', () => {
    expect(normalizeSemanticText('  Hello   World  ')).toBe('Hello World');
    expect(normalizeSemanticText('Geo–AI System')).toBe('Geo-AI System');
    expect(normalizeSemanticText('XR—based\u00a0platform')).toBe('XR-based platform');

    expect(
      semanticEqual(
        semanticPublication({ title: 'Geo–AI\u00a0for\u00a0Cities' }),
        semanticPublication({ title: 'Geo-AI for Cities' }),
      ),
    ).toBe(true);
  });

  it('equates publication year number and string forms', () => {
    expect(
      semanticEqual(
        semanticPublication({ title: 'Paper A', year: 2003 }),
        semanticPublication({ title: 'Paper A', year: '2003' }),
      ),
    ).toBe(true);
  });

  it('rehydrates stale baseline publication years on parse', () => {
    const parsed = parseAcceptedCvNormalizedSnapshot({
      schemaVersion: 1,
      algorithmVersion: 2,
      scalars: {},
      lists: {
        publications: [
          {
            stableId: 'p1',
            fingerprint: 'old',
            title: 'Paper A',
            payload: {
              title: 'Paper A',
              authors: 'A',
              journal: 'J',
              year: 2003,
              type: 'conference',
              doi: null,
            },
          },
        ],
        patents: [],
        education: [],
        appointments: [],
        awards: [],
        projects: [],
      },
      sectionFingerprints: {},
      sourceSectionMappings: [],
    });
    expect(parsed).not.toBeNull();
    expect(
      semanticEqual(parsed!.lists.publications[0]!.payload, semanticPublication({ title: 'Paper A', year: '2003', authors: 'A', journal: 'J', type: 'conference', doi: null })),
    ).toBe(true);
  });
});
