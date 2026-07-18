/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProjectData, ProjectSummary, EvaluationState } from './types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body.errors ? JSON.stringify(body.errors) : body.description || '';
    } catch {
      // ignore parsing if not JSON error
    }
    throw new Error(`${res.status} ${res.statusText}${detail ? ' — ' + detail : ''}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listProjects: () => request<ProjectSummary[]>('/api/projects'),

  getProject: (projectId: string) => request<ProjectData>(`/api/projects/${projectId}`),

  createProject: (project: ProjectData) =>
    request<{ projectId: string }>('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    }),

  validateProject: (project: unknown) =>
    request<{ valid: boolean; errors: string[] }>('/api/projects/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    }),

  getEvaluations: (projectId: string) =>
    request<EvaluationState>(`/api/projects/${projectId}/evaluations`),

  saveEvaluations: (projectId: string, data: EvaluationState) =>
    request<{ status: string }>(`/api/projects/${projectId}/evaluations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  resetEvaluations: (projectId: string) =>
    request<EvaluationState>(`/api/projects/${projectId}/evaluations/reset`, {
      method: 'POST',
    }),

  getAudioManifest: (projectId: string) =>
    request<Record<string, { filename: string; sizeBytes: number; url: string }>>(
      `/api/projects/${projectId}/audio`
    ),

  uploadAudio: (projectId: string, sectionId: number, version: 'A' | 'B', file: File) => {
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'mp3';
    return request<{ filename: string; sizeBytes: number }>(
      `/api/projects/${projectId}/audio/${sectionId}/${version}?ext=${ext}`,
      { method: 'PUT', body: file }
    );
  },
};