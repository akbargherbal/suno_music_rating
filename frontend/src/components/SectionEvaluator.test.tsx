import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import SectionEvaluator from './SectionEvaluator';
import { sectionsData, initialEvaluationState } from '../data';

const section = sectionsData[0];

function makeProps(overrides: Partial<ComponentProps<typeof SectionEvaluator>> = {}) {
  const evaluation = initialEvaluationState(sectionsData)[section.id];
  return {
    section,
    evaluation,
    audioUrls: { A: null, B: null },
    onChange: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    isFirst: true,
    isLast: false,
    ...overrides,
  };
}

describe('SectionEvaluator - tag rating', () => {
  it('rates a tag GREEN for version A and reports it via onChange', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<SectionEvaluator {...props} />);

    const firstTag = section.tags[0];
    await user.click(document.getElementById(`btn-tag-${firstTag.id}-A-GREEN`)!);

    expect(props.onChange).toHaveBeenCalledTimes(1);
    const updated = props.onChange.mock.calls[0][0];
    const updatedTag = updated.tagEvaluations.find((t: any) => t.id === firstTag.id);
    expect(updatedTag.ratingA).toBe('GREEN');
    expect(updatedTag.ratingB).toBeNull(); // version B must be untouched
  });

  it('clicking the same rating again toggles it back to unrated (null)', async () => {
    const user = userEvent.setup();
    const firstTag = section.tags[0];
    let evaluation = initialEvaluationState(sectionsData)[section.id];
    evaluation = {
      ...evaluation,
      tagEvaluations: evaluation.tagEvaluations.map(t =>
        t.id === firstTag.id ? { ...t, ratingA: 'RED' } : t
      ),
    };
    const onChange = vi.fn();
    render(<SectionEvaluator {...makeProps({ evaluation, onChange })} />);

    await user.click(document.getElementById(`btn-tag-${firstTag.id}-A-RED`)!);

    const updated = onChange.mock.calls[0][0];
    const updatedTag = updated.tagEvaluations.find((t: any) => t.id === firstTag.id);
    expect(updatedTag.ratingA).toBeNull();
  });

  it('rating version B does not affect version A ratings for the same tag', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<SectionEvaluator {...props} />);

    const firstTag = section.tags[0];
    await user.click(document.getElementById(`btn-tag-${firstTag.id}-B-YELLOW`)!);

    const updated = props.onChange.mock.calls[0][0];
    const updatedTag = updated.tagEvaluations.find((t: any) => t.id === firstTag.id);
    expect(updatedTag.ratingB).toBe('YELLOW');
    expect(updatedTag.ratingA).toBeNull();
  });
});

describe('SectionEvaluator - preferred version & success toggles', () => {
  it('selecting a preferred version updates evaluation.preferredVersion', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<SectionEvaluator {...props} />);

    await user.click(document.getElementById('btn-preferred-B')!);

    expect(props.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ preferredVersion: 'B' })
    );
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
});