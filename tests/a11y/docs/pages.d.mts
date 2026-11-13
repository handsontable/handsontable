export type DocsState = 'none' | 'versions-menu' | 'support-menu' | 'docs-assistant' | 'search' | 'phone-navigation';

export interface DocsPage {
  /**
   * The page's name in the baseline and the summary: the framework prefix and the slug, or the chrome state.
   */
  id: string;
  /**
   * The URL path under the docs base URL.
   */
  path: string;
  /**
   * What the spec does before it scans.
   */
  state: DocsState;
  /**
   * `phone` for the 390 px viewport; the desktop one when absent.
   */
  viewport?: 'phone';
  /**
   * A control only some builds render; without it the page is not scanned.
   */
  requires?: 'search';
  /**
   * The HTTP status the page answers with; 200 when absent.
   */
  status?: number;
  /**
   * What the page covers.
   */
  surface: string;
}

export interface DocsFramework {
  prefix: string;
  name: string;
  urlPath: string;
  paths: ReadonlyArray<{ path: string }>;
}

export const DOCS_THEMES: readonly string[];
export const DEFAULT_DOCS_BASE_URL: string;
export const DOCS_FRAMEWORKS: readonly DocsFramework[];
export const ALL_FRAMEWORK_SLUGS: readonly string[];
export const DESKTOP_VIEWPORT: { width: number; height: number };
export const PHONE_VIEWPORT: { width: number; height: number };
export const EXTRA_PAGES: readonly DocsPage[];
export const DOCS_PAGES: readonly DocsPage[];
export function idPart(slug: string): string;
export function guidePages(frameworks?: readonly DocsFramework[]): DocsPage[];
export function docsBaseUrl(value: string | undefined): string;
export function docsUrl(page: Pick<DocsPage, 'path'>, theme?: string, baseUrl?: string): string;
export function docsStateSteps(page: Pick<DocsPage, 'state' | 'viewport'>, theme?: string): string;
