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
  locate(page: object, theme: string): { path: string; href: string; steps: string | undefined };
  pageEntry(page: object): object;
  about: string;
  reproduce: { build: string; scan: string; outputs: string };
  howToFind: string;
  linkNote: string;
}

export const FIXTURE_SERVER: string;
export const DOCS_BASELINE_FILE: string;
export const A11Y_SUITE_IDS: readonly string[];
export const PRODUCT_SUITE: A11ySuite;
export function docsSuite(baseUrl?: string): A11ySuite;
export function suiteFor(id: string, options?: { docsBaseUrl?: string; websiteBaseUrl?: string }): A11ySuite;
export function websiteSuite(baseUrl?: string): A11ySuite;
export const WEBSITE_BASELINE_FILE: string;
