import { describe, it, expect } from 'vitest';
import { sectionsData, initialEvaluationState } from './data';

describe('sectionsData', () => {
  it('contains exactly 6 sections, matching the fixed 6-section UI (progress bars, nav, footer text)', () => {
    expect(sectionsData).toHaveLength(6);
  });

  it('has unique, sequential ids from 1 to 6', () => {
    const ids = sectionsData.map(s => s.id).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('every section has both A and B tracks with non-empty clip ids', () => {
    sectionsData.forEach(section => {
      expect(section.tracks.A.clip_id).toBeTruthy();
      expect(section.tracks.B.clip_id).toBeTruthy();
    });
  });

  it('every tag has a unique id within its section', () => {
    sectionsData.forEach(section => {
      const tagIds = section.tags.map(t => t.id);
      expect(new Set(tagIds).size).toBe(tagIds.length);
    });
  });

  it('every tag has a non-empty tag label and expected description', () => {
    sectionsData.forEach(section => {
      section.tags.forEach(tag => {
        expect(tag.tag.trim().length).toBeGreaterThan(0);
        expect(tag.expected.trim().length).toBeGreaterThan(0);
        expect(['vocals', 'instruments']).toContain(tag.type);
      });
    });
  });
});

describe('initialEvaluationState', () => {
  const state = initialEvaluationState(sectionsData);

  it('creates one evaluation entry per section, keyed by section id', () => {
    expect(Object.keys(state)).toHaveLength(sectionsData.length);
    sectionsData.forEach(section => {
      expect(state[section.id]).toBeDefined();
      expect(state[section.id].sectionId).toBe(section.id);
    });
  });

  it('carries over the maqam from the source section', () => {
    sectionsData.forEach(section => {
      expect(state[section.id].maqam).toBe(section.maqam);
    });
  });

  it('defaults drift/transition fields to their "no problem" values', () => {
    Object.values(state).forEach(evaluation => {
      expect(evaluation.driftA).toBe('no');
      expect(evaluation.driftB).toBe('no');
      expect(evaluation.transitionsA).toBe('smooth');
      expect(evaluation.transitionsB).toBe('smooth');
      expect(evaluation.generalSuccessA).toBe(true);
      expect(evaluation.generalSuccessB).toBe(true);
      expect(evaluation.preferredVersion).toBeNull();
    });
  });

  it('creates one tagEvaluation per section tag, both ratings unset', () => {
    sectionsData.forEach(section => {
      const evaluation = state[section.id];
      expect(evaluation.tagEvaluations).toHaveLength(section.tags.length);
      evaluation.tagEvaluations.forEach((tagEval, idx) => {
        expect(tagEval.id).toBe(section.tags[idx].id);
        expect(tagEval.ratingA).toBeNull();
        expect(tagEval.ratingB).toBeNull();
      });
    });
  });

  it('returns independent objects per call (no shared references / mutation leakage)', () => {
    const stateA = initialEvaluationState(sectionsData);
    const stateB = initialEvaluationState(sectionsData);

    stateA[1].notes = 'mutated in A';
    stateA[1].tagEvaluations[0].ratingA = 'RED';

    expect(stateB[1].notes).toBe('');
    expect(stateB[1].tagEvaluations[0].ratingA).toBeNull();
  });
});