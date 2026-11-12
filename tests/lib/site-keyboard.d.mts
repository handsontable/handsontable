type Finding = {
  kind: string;
  criteria: string[];
  severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'advisory';
  reason: string;
  selector?: string;
  step?: string;
  measured?: Record<string, unknown>;
};

export const NAMED_ROLES: Set<string>;
export type WalkVerdict = 'complete' | 'navigated' | 'cycle' | 'budget' | 'stopped';
export function walkVerdict(walk: { stops: Array<{ key: string; region: string; navigated?: boolean }>; budgetExhausted?: boolean;
  direction?: 'forward' | 'backward' }): WalkVerdict;
export function walkProblem(verdict: WalkVerdict, budget: number): string | null;
export function walkFindings(input: { stops: object[]; verdict: WalkVerdict; escaped?: boolean; gridTrap?: boolean }): Finding[];
export function skipLinkFindings(input: { present: boolean; first: boolean; visible: boolean | null; landsInMain: boolean | null; selector?: string }): Finding[];
export function popupFindings(input: {
  state: string; selector: string; reachedItem: boolean; closedOnEscape: boolean; focusReturned: boolean; modal?: boolean; leftModal?: boolean;
}): Finding[];
export function shortcutFindings(results: Array<{ key: string; navigated: boolean; dialogOpened: boolean; focused: string | null }>): Finding[];
export function inputFindings(results: Array<{ selector: string; key: string; navigated: boolean; dialogOpened: boolean; focusMoved: boolean }>): Finding[];
export function unreachableFindings(controls: Array<{ shape: string; role: string; name: string }>): Finding[];
