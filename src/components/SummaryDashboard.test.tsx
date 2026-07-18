import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SummaryDashboard from './SummaryDashboard';
import { sectionsData, initialEvaluationState } from '../data';

function baseEvaluations() {
  return initialEvaluationState(sectionsData);
}

describe('SummaryDashboard - progress stats', () => {
  it('shows 0 / N tags evaluated when nothing has been rated yet', () => {
    const totalTags = sectionsData.reduce((sum, s) => sum + s.tags.length, 0);
    render(
      <SummaryDashboard
        evaluations={baseEvaluations()}
        sections={sectionsData}
        onImportState={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const progressCard = screen.getByText('التقدم الإجمالي').closest('div')!.parentElement!;
    expect(progressCard.textContent).toContain(`0`);
    expect(progressCard.textContent).toContain(`/ ${totalTags} تاقاً`);
  });

  it('counts a tag as "evaluated" if either A or B has a rating (not requiring both)', () => {
    const evaluations = baseEvaluations();
    evaluations[1].tagEvaluations[0].ratingA = 'GREEN';

    render(
      <SummaryDashboard
        evaluations={evaluations}
        sections={sectionsData}
        onImportState={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const progressCard = screen.getByText('التقدم الإجمالي').closest('div')!.parentElement!;
    expect(progressCard.textContent).toMatch(/^التقدم الإجمالي1/);
  });

  it('only counts a section as "complete" once every tag has both A and B rated', () => {
    const evaluations = baseEvaluations();
    // Fully rate every tag in section 1, both versions.
    evaluations[1].tagEvaluations = evaluations[1].tagEvaluations.map(t => ({
      ...t,
      ratingA: 'GREEN',
      ratingB: 'GREEN',
    }));

    render(
      <SummaryDashboard
        evaluations={evaluations}
        sections={sectionsData}
        onImportState={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const completedCard = screen.getByText('الأقسام المكتملة').closest('div')!.parentElement!;
    expect(completedCard.textContent).toMatch(/^الأقسام المكتملة1/);
  });

  it('tallies preferred-version wins per section correctly', () => {
    const evaluations = baseEvaluations();
    evaluations[1].preferredVersion = 'A';
    evaluations[2].preferredVersion = 'A';
    evaluations[3].preferredVersion = 'B';

    render(
      <SummaryDashboard
        evaluations={evaluations}
        sections={sectionsData}
        onImportState={vi.fn()}
        onReset={vi.fn()}
      />
    );

    // "فوز النسخة A" card should read 2, "فوز النسخة B" should read 1.
    const winA = screen.getByText('فوز النسخة A').closest('div')!.parentElement!;
    const winB = screen.getByText('فوز النسخة B').closest('div')!.parentElement!;
    expect(winA.textContent).toContain('2');
    expect(winB.textContent).toContain('1');
  });
});

describe('SummaryDashboard - JSON export / import', () => {
  it('exports the current evaluations as a downloadable JSON data URI', async () => {
    const user = userEvent.setup();
    const evaluations = baseEvaluations();
    evaluations[1].notes = 'export-me';

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(
      <SummaryDashboard
        evaluations={evaluations}
        sections={sectionsData}
        onImportState={vi.fn()}
        onReset={vi.fn()}
      />
    );

    await user.click(document.getElementById('btn-export-json')!);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it('imports a valid JSON file and forwards the parsed state via onImportState', async () => {
    const user = userEvent.setup();
    const onImportState = vi.fn();
    const importedState = { 1: { ...baseEvaluations()[1], notes: 'imported-note' } };

    render(
      <SummaryDashboard
        evaluations={baseEvaluations()}
        sections={sectionsData}
        onImportState={onImportState}
        onReset={vi.fn()}
      />
    );

    const file = new File([JSON.stringify(importedState)], 'state.json', { type: 'application/json' });
    const input = document.getElementById('input-import-json-file') as HTMLInputElement;

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    await user.upload(input, file);

    expect(onImportState).toHaveBeenCalledWith(importedState);
    alertSpy.mockRestore();
  });

  it('alerts the user and does not call onImportState when the uploaded file is not valid JSON', async () => {
    const user = userEvent.setup();
    const onImportState = vi.fn();

    render(
      <SummaryDashboard
        evaluations={baseEvaluations()}
        sections={sectionsData}
        onImportState={onImportState}
        onReset={vi.fn()}
      />
    );

    const file = new File(['{not valid json'], 'state.json', { type: 'application/json' });
    const input = document.getElementById('input-import-json-file') as HTMLInputElement;

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    await user.upload(input, file);

    expect(onImportState).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('فشل قراءة الملف'));
    alertSpy.mockRestore();
  });
});

describe('SummaryDashboard - reset confirmation', () => {
  it('only calls onReset if the user confirms the destructive action', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();

    render(
      <SummaryDashboard
        evaluations={baseEvaluations()}
        sections={sectionsData}
        onImportState={vi.fn()}
        onReset={onReset}
      />
    );

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.click(document.getElementById('btn-reset-evaluation')!);
    expect(onReset).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    await user.click(document.getElementById('btn-reset-evaluation')!);
    expect(onReset).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });
});

describe('SummaryDashboard - copy report to clipboard', () => {
  it('writes a markdown report to the clipboard when the copy button is clicked', async () => {
    const user = userEvent.setup();

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    render(
      <SummaryDashboard
        evaluations={baseEvaluations()}
        sections={sectionsData}
        onImportState={vi.fn()}
        onReset={vi.fn()}
      />
    );

    await user.click(document.getElementById('btn-copy-markdown')!);

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const md = writeTextMock.mock.calls[0][0];
    expect(md).toContain('# تقرير تقييم الاستماع');
    // Every section title should appear in the generated report.
    sectionsData.forEach(sec => {
      expect(md).toContain(sec.title);
    });
  });
});