export type A11yState =
  | 'none'
  | 'context-menu'
  | 'context-menu-submenu'
  | 'dropdown-menu'
  | 'editor'
  | 'comment'
  | 'data-provider';

export interface A11yPage {
  /** The page's name in the baseline and the summary: a kebab-case slug naming the surface. */
  id: string;
  /** The file under `tests/fixtures/demo/`. */
  fixture: string;
  /** Extra query parameters, appended after the theme. */
  query?: string;
  /** The selector of the grid container the scan includes; `[data-testid="grid"]` when absent. */
  root?: string;
  /** The cell a menu or an editor opens on; `[1, 1]` when absent. */
  cell?: [number, number];
  /** What the spec does before it scans. */
  state: A11yState;
  /** What the page covers, for the reader of the baseline and the summary. */
  surface: string;
}

export const A11Y_PAGES: readonly A11yPage[];
export function fixtureUrl(page: Pick<A11yPage, 'fixture' | 'query'>, theme: string): string;
export function stateSteps(page: Pick<A11yPage, 'state' | 'cell'>): string | undefined;
