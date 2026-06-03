export type ChangeCategory = 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed';

export type Framework = 'core' | 'react' | 'angular' | 'vue';

export interface VersionEntry {
  version: string;
  releaseDate: string | null;
  category: ChangeCategory;
  breaking: boolean;
  framework: Framework;
  prNumber: number | null;
  prKind: 'issues' | 'pull' | null;
  title: string;
  highlighted: boolean;
  tagline?: string;
  whyItMatters?: string;
  codeBefore?: string;
  codeAfter?: string;
  migrationAnchor?: string;
}

export interface ReleaseSummary {
  version: string;
  releaseDate: string | null;
  major: number;
  minor: number;
  isCurrent: boolean;
}

export interface VersionComparisonData {
  entries: VersionEntry[];
  releases: ReleaseSummary[];
}

export type FilterKind = 'all' | 'breaking' | 'deprecated' | 'new' | 'fixed';
