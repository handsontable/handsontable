type Finding = {
  kind: string;
  criteria: string[];
  severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'advisory';
  reason: string;
  selector?: string;
  step?: string;
  measured?: Record<string, unknown>;
};

export const STATE_SIGNATURE: string[];
export function pageReflowFindings(input: { condition: string; viewport: { width: number; scrollWidth: number }; offenders: Array<{ selector: string; right: number }>; exempt?: number }): Finding[];
export function orientationFindings(sizes: Record<'portrait' | 'landscape', { width: number; height: number }>): Finding[];
export function boundaryFindings(input: { selector: string; boundary: { ratio: number }; fill: { ratio: number }; around: number[] }): Finding[];
export function stateLostFindings(input: {
  selector: string; state: string;
  element: { normal: Record<string, string>; forced: Record<string, string> };
  sibling: { normal: Record<string, string>; forced: Record<string, string> };
}): Finding[];
