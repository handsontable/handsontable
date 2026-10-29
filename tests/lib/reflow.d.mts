export const REFLOW_CHECK: string;
export const REFLOW_CRITERIA: string[];
export const CONDITIONS: Readonly<Record<'reflow-320' | 'zoom-200' | 'text-spacing', { criteria: string[]; viewport: { width: number; height: number }; label: string }>>;
export const TEXT_SPACING_CSS: string;

type Finding = {
  kind: string;
  criteria: string[];
  severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'advisory';
  reason: string;
  selector?: string;
  step?: string;
  measured?: Record<string, unknown>;
};

export function nameApart<T extends { selector: string }>(items: T[]): T[];
export function clippingFindings(input: { condition: string; boxes: object[] }): Finding[];
export function viewportFindings(input: { condition: string; viewport: { width: number; height: number; scrollX?: number; scrollY?: number; scrollWidth: number; scrollHeight: number }; surfaces: object[] }): Finding[];
export function overlapFindings(input: { condition: string; controls: object[] }): Finding[];
export function hoverFindings(input: { selector: string; dismissible?: boolean; hoverable?: boolean; persistent?: boolean }): Finding[];
export function orientationFindings(sizes: { portrait: { width: number; height: number }; landscape: { width: number; height: number } }): Finding[];
