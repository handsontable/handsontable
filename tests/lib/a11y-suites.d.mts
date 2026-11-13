export interface A11ySuite {
  id: 'product' | 'docs';
  title: string;
  reportTitle: string;
  reportFile: string;
  baselineFile: string;
  pagesFile: string;
  artifact: string;
  outputDir: string;
  pages: ReadonlyArray<{ id: string; surface?: string }>;
  themes: readonly string[];
  baseUrl?: string;
  policy: { file: string; anchor: string; title: string };
  locate(page: object, theme: string, scannedPath?: string): { path: string; href: string; steps: string | undefined };
  pageEntry(page: object): object;
  about: string;
  reproduce: { build: string; scan: string; outputs: string };
  howToFind: string;
  linkNote: string;
}

export const FIXTURE_SERVER: string;
export const DOCS_BASELINE_FILE: string;
export const A11Y_SUITE_IDS: readonly string[];
export function withScannedUrls(suite: A11ySuite, scans?: readonly { page: string; theme: string; url?: string }[]): A11ySuite;
export const PRODUCT_SUITE: A11ySuite;
export function docsSuite(baseUrl?: string): A11ySuite;
export function suiteFor(id: string, options?: { docsBaseUrl?: string }): A11ySuite;
