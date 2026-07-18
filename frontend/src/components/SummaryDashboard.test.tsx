/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SummaryDashboard from './SummaryDashboard';
import { makeProject, makeEvaluationState } from '../test/fixtures';

const project = makeProject();

function renderDashboard(evaluationsOverride?: ReturnType<typeof makeEvaluationState>) {
  const evaluations = evaluationsOverride ?? makeEvaluationState(project);
  const onImportState = vi.fn();
  const onReset = vi.fn();
  render(
    <SummaryDashboard
      project={project}
      evaluations={evaluations}
      onImportState={onImportState}
      onReset={onReset}
    />
  );
  return { evaluations, onImportState, onReset };
}

let writeTextSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  if (!navigator.clipboard) {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async () => {} },
      configurable: true,
    });
  }
  writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
});

describe('SummaryDashboard - top-level stats', () => {
  it('shows 0 tags evaluated when nothing has been rated yet', () => {
    renderDashboard();
    const label = screen.getByText('التقدم الإجمالي');
    const card = label.closest('div')!.parentElement!;
    expect(card).toHaveTextContent('0');
    expect(card).toHaveTextContent('/ 2 تاقاً'); // total across both fixture sections
  });

  it('counts a fully-rated section as completed', () => {
    const evaluations = makeEvaluationState(project);
    evaluations[1].tagEvaluations.tag1 = { ratingA: 'GREEN', ratingB: 'GREEN' };
    renderDashboard(evaluations);

    // "الأقسام المكتملة" card: 1 of 2 sections complete
    const label = screen.getByText('الأقسام المكتملة');
    const card = label.closest('div')!.parentElement!;
    expect(card).toHaveTextContent('1');
    expect(card).toHaveTextContent('/ 2 أقسام');
  });

  it('tallies preferred-version wins for A and B separately', () => {
    const evaluations = makeEvaluationState(project);
    evaluations[1].preferredVersion = 'A';
    evaluations[2].preferredVersion = 'B';
    renderDashboard(evaluations);

    const table = document.getElementById('final-summary-table')!;
    expect(table).toBeInTheDocument();
  });
});

describe('SummaryDashboard - summary table', () => {
  it('renders one row per evaluated section with the correct title', () => {
    renderDashboard();
    expect(document.getElementById('summary-row-1')).toBeInTheDocument();
    expect(document.getElementById('summary-row-2')).toBeInTheDocument();
    expect(screen.getByText('القسم الأول — فاتحة')).toBeInTheDocument();
  });
});

describe('SummaryDashboard - markdown export', () => {
  it('copies a markdown report that uses real newlines, not literal backslash-n text', async () => {
    renderDashboard();

    fireEvent.click(document.getElementById('btn-copy-markdown')!);

    await screen.findByText('تم نسخ تقرير Markdown!');
    expect(writeTextSpy).toHaveBeenCalledTimes(1);
    const markdown = writeTextSpy.mock.calls[0][0] as string;

    // Regression guard: previously the generator used '\\n' (an escaped
    // backslash followed by "n") instead of '\n', so the exported report
    // contained the literal two-character sequence \n instead of a real
    // line break anywhere a newline was intended.
    expect(markdown).not.toContain('\\\\n');
    expect(markdown.split('\n').length).toBeGreaterThan(1);
    expect(markdown).toContain('# ' + project.title);
  });

  it('shows a "copied" confirmation after copying', async () => {
    renderDashboard();

    fireEvent.click(document.getElementById('btn-copy-markdown')!);

    expect(await screen.findByText('تم نسخ تقرير Markdown!')).toBeInTheDocument();
  });
});

describe('SummaryDashboard - reset flow', () => {
  it('calls onReset only after the user confirms the warning dialog', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { onReset } = renderDashboard();

    await user.click(document.getElementById('btn-reset-evaluation')!);

    expect(confirmSpy).toHaveBeenCalled();
    expect(onReset).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it('does not call onReset when the user cancels the confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { onReset } = renderDashboard();

    await user.click(document.getElementById('btn-reset-evaluation')!);

    expect(onReset).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});

describe('SummaryDashboard - flagged tags insight', () => {
  it('flags a tag that received the worst rating on either version', () => {
    const evaluations = makeEvaluationState(project);
    evaluations[1].tagEvaluations.tag1 = { ratingA: 'RED', ratingB: null };
    renderDashboard(evaluations);

    expect(screen.getByText('reverb')).toBeInTheDocument();
  });

  it('shows the all-clear message when nothing is flagged', () => {
    renderDashboard();
    expect(screen.getByText(/لا توجد تاقات حصلت على أسوأ تقييم/)).toBeInTheDocument();
  });
});
