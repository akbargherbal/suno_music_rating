/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import SectionEvaluator from './SectionEvaluator';
import { makeProject, makeSectionEvaluation } from '../test/fixtures';

const project = makeProject();
const section = project.sections[0];

function makeProps(overrides: Partial<ComponentProps<typeof SectionEvaluator>> = {}) {
  return {
    project,
    section,
    evaluation: makeSectionEvaluation(),
    audioUrls: { A: null, B: null },
    onChange: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    isFirst: true,
    isLast: false,
    sectionIndex: 1,
    sectionCount: project.sections.length,
    ...overrides,
  };
}

describe('SectionEvaluator - tag rating', () => {
  it('rates a tag GREEN for version A and reports it via onChange', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<SectionEvaluator {...props} />);

    await user.click(document.getElementById('btn-tag-tag1-A-GREEN')!);

    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0][0];
    expect(updated.tagEvaluations.tag1.ratingA).toBe('GREEN');
    expect(updated.tagEvaluations.tag1.ratingB).toBeNull(); // version B untouched
  });

  it('clicking the same rating again toggles it back to unrated (null)', async () => {
    const user = userEvent.setup();
    const evaluation = makeSectionEvaluation({
      tagEvaluations: { tag1: { ratingA: 'RED', ratingB: null } },
    });
    const onChange = vi.fn();
    render(<SectionEvaluator {...makeProps({ evaluation, onChange })} />);

    await user.click(document.getElementById('btn-tag-tag1-A-RED')!);

    const updated = onChange.mock.calls[0][0];
    expect(updated.tagEvaluations.tag1.ratingA).toBeNull();
  });

  it('rating version B does not affect version A ratings for the same tag', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<SectionEvaluator {...props} />);

    await user.click(document.getElementById('btn-tag-tag1-B-YELLOW')!);

    const updated = props.onChange.mock.calls[0][0];
    expect(updated.tagEvaluations.tag1.ratingB).toBe('YELLOW');
    expect(updated.tagEvaluations.tag1.ratingA).toBeNull();
  });
});

describe('SectionEvaluator - preferred version & success toggles', () => {
  it('selecting a preferred version updates evaluation.preferredVersion', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<SectionEvaluator {...props} />);

    await user.click(document.getElementById('btn-preferred-B')!);

    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ preferredVersion: 'B' }));
  });

  it('toggles generalSuccessA independently of generalSuccessB', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<SectionEvaluator {...props} />);

    await user.click(document.getElementById('btn-success-A')!);

    const updated = props.onChange.mock.calls[0][0];
    expect(updated.generalSuccessA).toBe(false);
    expect(updated.generalSuccessB).toBe(true); // untouched, still default
  });
});

describe('SectionEvaluator - dynamic section questions', () => {
  it('renders a question option per project.sectionQuestions and records an answer', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<SectionEvaluator {...props} />);

    expect(screen.getByText('هل يوجد انقطاع؟')).toBeInTheDocument();

    const radios = screen.getAllByDisplayValue('yes');
    await user.click(radios[0]); // version A's "yes" radio

    const updated = props.onChange.mock.calls[0][0];
    expect(updated.answers.q1.A).toBe('yes');
    expect(updated.answers.q1.B).toBeNull();
  });
});

describe('SectionEvaluator - notes & navigation', () => {
  it('typing in the notes textarea propagates each keystroke via onChange', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<SectionEvaluator {...props} />);

    const textarea = document.getElementById('section-notes-textarea')!;
    await user.type(textarea, 'hi');

    // Controlled input re-renders with the same (stale) `evaluation.notes`
    // each keystroke since the parent in this test doesn't feed updates
    // back in, so onChange should fire once per character typed.
    expect(props.onChange).toHaveBeenCalledTimes(2);
  });

  it('disables the "previous" button on the first section and calls onNext for "next"', async () => {
    const user = userEvent.setup();
    const props = makeProps({ isFirst: true, isLast: false });
    render(<SectionEvaluator {...props} />);

    expect(document.getElementById('btn-prev-section')).toBeDisabled();
    expect(document.getElementById('btn-next-section')).not.toBeDisabled();

    await user.click(document.getElementById('btn-next-section')!);
    expect(props.onNext).toHaveBeenCalledTimes(1);
  });

  it('disables the "next" button on the last section', () => {
    const props = makeProps({ isFirst: false, isLast: true });
    render(<SectionEvaluator {...props} />);

    expect(document.getElementById('btn-next-section')).toBeDisabled();
    expect(document.getElementById('btn-prev-section')).not.toBeDisabled();
  });

  it('shows the "X of Y tags evaluated" footer count based on tagEvaluations', () => {
    const props = makeProps();
    render(<SectionEvaluator {...props} />);

    const total = section.tags.length;
    expect(screen.getByText(new RegExp(`تم تقييم 0 من أصل ${total} تاقات`))).toBeInTheDocument();
  });

  it('reflects an already-rated tag in the footer count', () => {
    const evaluation = makeSectionEvaluation({
      tagEvaluations: { tag1: { ratingA: 'GREEN', ratingB: null } },
    });
    render(<SectionEvaluator {...makeProps({ evaluation })} />);

    expect(screen.getByText(/تم تقييم 1 من أصل 1 تاقات/)).toBeInTheDocument();
  });
});
