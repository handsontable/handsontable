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
export function docsPageLines(source: string, ids: string[]): Map<string, number>;
export function baselineLines(source: string): Map<string, number>;
export interface ScanReport {
  name: string;
  title: string;
  job: string;
  comparison: string;
  pagesFile: string;
  baselineFile: string;
  source: string;
  check: string;
}
export const PRODUCT_SCAN: Readonly<ScanReport>;
export const DOCS_SCAN: Readonly<ScanReport>;
export function buildCheckRun(input: {
  comparison: object | null;
  pages: Map<string, number>;
  baseline: Map<string, number>;
  reportUrl?: string;
  runUrl?: string;
  scope?: 'audit' | 'change';
  tracked?: (source: string, check: string, finding: object) => boolean;
  scan?: ScanReport;
  drift?: (item: object) => boolean;
}): CheckRunPayload;
export function annotationBatches<T>(items: T[], size?: number): T[][];
