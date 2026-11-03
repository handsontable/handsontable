import type { A11yPage } from '../pages.mjs';

export const DISCOVERY_PAGES: ReadonlyArray<Omit<A11yPage, 'state'> & { state: string }>;
