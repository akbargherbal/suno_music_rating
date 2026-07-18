/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RatingOption {
  value: string;
  icon?: string;
}

export interface RatingScale {
  id: string;
  options: RatingOption[];
}

export interface TagTypeDef {
  label: string;
  ratingLabels: Record<string, string>;
}

export type QuestionType = 'single_choice' | 'boolean' | 'free_text';

export interface SectionQuestionDef {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[];
  optionLabels?: Record<string, string>;
  hasDetails?: boolean;
  detailsLabel?: string;
}

export interface TrackMetadata {
  clip_id?: string;
  original_title?: string;
  assigned_filename: string;
  styles?: string;
  lyrics?: string;
  created_at?: string;
  downloaded_at?: string;
}

export interface TagDef {
  id: string;
  tag: string;
  expected: string;
  type: string; // references key in ProjectData.tagTypes
}

export interface SectionData {
  id: number;
  title: string;
  meta?: Record<string, string>;
  description?: string;
  watchpoint?: string;
  specialQuestion?: string | null;
  lyrics: string;
  tracks: {
    A: TrackMetadata;
    B: TrackMetadata;
  };
  tags: TagDef[];
}

export interface ProjectData {
  schemaVersion: number;
  projectId: string;
  title: string;
  subtitle?: string;
  poemTitle?: string;
  brandLetter?: string;
  footerNote?: string;
  ratingScale: RatingScale;
  tagTypes: Record<string, TagTypeDef>;
  sectionQuestions: SectionQuestionDef[];
  sections: SectionData[];
}

export interface ProjectSummary {
  projectId: string;
  title: string;
  subtitle?: string;
  sectionCount: number;
}

// --- Dynamic Evaluations State Structures ---

export interface QuestionAnswer {
  A: string | null;
  B: string | null;
  detailsA?: string;
  detailsB?: string;
}

export interface TagRating {
  ratingA: string | null;
  ratingB: string | null;
}

export interface SectionEvaluation {
  sectionId: number;
  answers: Record<string, QuestionAnswer>;
  tagEvaluations: Record<string, TagRating>;
  notes: string;
  specialQuestionAnswer: string;
  generalSuccessA: boolean;
  generalSuccessB: boolean;
  preferredVersion: 'A' | 'B' | 'both' | 'neither' | null;
}

export type EvaluationState = Record<number, SectionEvaluation>;

export interface LocalAudioFile {
  name: string;
  url: string;
  sectionId: number;
  version: 'A' | 'B';
}