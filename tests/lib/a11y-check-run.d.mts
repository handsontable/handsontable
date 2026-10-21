export const CHECK_RUN_NAME: string;
export const ANNOTATIONS_PER_REQUEST: number;

export interface CheckRunAnnotation {
  path: string;
  start_line: number;
  end_line: number;
  annotation_level: 'notice' | 'warning' | 'failure';
  title: string;
  message: string;
}

export interface CheckRunPayload {
  name: string;
  conclusion: 'success' | 'neutral' | 'failure';
  title: string;
  summary: string;
  annotations: CheckRunAnnotation[];
}

export function pageLines(source: string): Map<string, number>;
export function baselineLines(source: string): Map<string, number>;
export function buildCheckRun(input: {
  comparison: object | null;
  pages: Map<string, number>;
  baseline: Map<string, number>;
  reportUrl?: string;
  runUrl?: string;
}): CheckRunPayload;
export function annotationBatches<T>(items: T[], size?: number): T[][];
