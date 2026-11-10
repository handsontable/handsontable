type Finding = {
  kind: string;
  criteria: string[];
  severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'advisory';
  reason: string;
  selector?: string;
  step?: string;
  measured?: Record<string, unknown>;
};

export function textKey(text: unknown): string;
export function pageFindings(page: object, site: { name: string; home?: boolean }): Finding[];
export function duplicateTitleFindings(page: { id: string; path: string; title: string }, titles: Array<{ id: string; path: string; title: string }>): Finding[];
export function waysFindings(page: { inNavigation: boolean }, site: { search: boolean }): Finding[];
export function consistencyFindings(page: object, reference: object, normalizeHref?: (href: string, here: string) => string): Finding[];
