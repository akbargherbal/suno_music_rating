/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Rating = 'RED' | 'YELLOW' | 'GREEN' | null;

export interface TagEvaluation {
  id: string;
  tag: string;
  expected: string;
  type: 'vocals' | 'instruments';
  ratingA: Rating;
  ratingB: Rating;
}

export interface SectionEvaluation {
  sectionId: number;
  maqam: string;
  driftA: 'no' | 'yes' | 'not_sure';
  driftDetailsA: string;
  driftB: 'no' | 'yes' | 'not_sure';
  driftDetailsB: string;
  transitionsA: 'smooth' | 'sudden' | 'not_sure';
  transitionsDetailsA: string;
  transitionsB: 'smooth' | 'sudden' | 'not_sure';
  transitionsDetailsB: string;
  tagEvaluations: TagEvaluation[];
  notes: string;
  specialQuestionAnswer: string;
  generalSuccessA: boolean;
  generalSuccessB: boolean;
  preferredVersion: 'A' | 'B' | 'both' | 'neither' | null;
}

export interface TrackMetadata {
  clip_id: string;
  original_title: string;
  assigned_filename: string;
  styles: string;
  lyrics: string;
  created_at: string;
  downloaded_at: string;
}

export interface SectionData {
  id: number;
  title: string;
  maqam: string;
  description: string;
  watchpoint: string;
  specialQuestion?: string;
  lyrics: string;
  tracks: {
    A: TrackMetadata;
    B: TrackMetadata;
  };
  tags: {
    id: string;
    tag: string;
    expected: string;
    type: 'vocals' | 'instruments';
  }[];
}

export interface LocalAudioFile {
  name: string;
  url: string;
  sectionId: number;
  version: 'A' | 'B';
}
