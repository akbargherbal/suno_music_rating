/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { api } from './api';
import { makeProject, makeEvaluationState } from './test/fixtures';

vi.mock('./api', () => ({
  api: {
    listProjects: vi.fn(),
    getProject: vi.fn(),
    createProject: vi.fn(),
    validateProject: vi.fn(),
    getEvaluations: vi.fn(),
    saveEvaluations: vi.fn(),
    resetEvaluations: vi.fn(),
    getAudioManifest: vi.fn(),
    uploadAudio: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);
const project = makeProject();

beforeEach(() => {
  vi.clearAllMocks();
  mockedApi.saveEvaluations.mockResolvedValue({ status: 'saved' });
  mockedApi.getAudioManifest.mockResolvedValue({});
});

describe('App - project selection screen', () => {
  it('shows the project selector when no project is active yet', async () => {
    mockedApi.listProjects.mockResolvedValue([
      { projectId: project.projectId, title: project.title, subtitle: project.subtitle, sectionCount: 2 },
    ]);

    render(<App />);

    expect(await screen.findByText('نموذج تقييم استماع أغاني سونو')).toBeInTheDocument();
    expect(screen.getByText(project.title)).toBeInTheDocument();
  });
});

describe('App - loading a project', () => {
  beforeEach(() => {
    mockedApi.listProjects.mockResolvedValue([
      { projectId: project.projectId, title: project.title, subtitle: project.subtitle, sectionCount: 2 },
    ]);
    mockedApi.getProject.mockResolvedValue(project);
    mockedApi.getEvaluations.mockResolvedValue(makeEvaluationState(project));
  });

  it('fetches project data, evaluations, and audio manifest once a project is selected', async () => {
    const user = userEvent.setup();
    render(<App />);

    const card = await screen.findByText(project.title);
    await user.click(card);

    await waitFor(() => expect(mockedApi.getProject).toHaveBeenCalledWith(project.projectId));
    expect(mockedApi.getEvaluations).toHaveBeenCalledWith(project.projectId);
    expect(mockedApi.getAudioManifest).toHaveBeenCalledWith(project.projectId);

    // The loaded project's own title & first section render — driven
    // entirely by what the server returned, not any hardcoded fixture.
    expect(await screen.findByText(project.sections[0].title)).toBeInTheDocument();
    expect(screen.getByText(project.projectId)).toBeInTheDocument();
  });

  it('lists every section from the server response in the sidebar index', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText(project.title));
    await screen.findByText(project.sections[0].title);

    for (const section of project.sections) {
      const sidebarButton = document.getElementById(`sidebar-sec-btn-${section.id}`);
      expect(sidebarButton).toBeInTheDocument();
      expect(sidebarButton).toHaveTextContent((section.title.split('—')[1] || section.title).trim());
    }
  });

  it('autosaves evaluation changes to the backend via the api client', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByText(project.title));

    await screen.findByText(project.sections[0].title);
    const firstTagId = project.sections[0].tags[0].id;
    await user.click(document.getElementById(`btn-tag-${firstTagId}-A-GREEN`)!);

    await waitFor(() => expect(mockedApi.saveEvaluations).toHaveBeenCalledWith(project.projectId, expect.any(Object)));
  });
});

describe('App - project load failure', () => {
  it('alerts and falls back to the selector if the project fails to load', async () => {
    mockedApi.listProjects.mockResolvedValue([
      { projectId: project.projectId, title: project.title, subtitle: project.subtitle, sectionCount: 2 },
    ]);
    mockedApi.getProject.mockRejectedValue(new Error('network down'));
    mockedApi.getEvaluations.mockResolvedValue({});
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByText(project.title));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(await screen.findByText('نموذج تقييم استماع أغاني سونو')).toBeInTheDocument();
    alertSpy.mockRestore();
  });
});
