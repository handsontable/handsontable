export const FOCUS_CHECK: string;
export const FOCUS_CRITERIA: string[];
export const NON_TEXT_RATIO: number;

type Image = { width?: number; height?: number; data: number[] };
type Finding = {
  kind: string;
  criteria: string[];
  severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'advisory';
  reason: string;
  selector?: string;
  step?: string;
  measured?: Record<string, unknown>;
};

export function relativeLuminance(color: number[]): number;
export function contrastRatio(a: number[], b: number[]): number;
export function composite(color: number[], background: number[]): number[];
export function dominantColor(image: Image): number[];
export function strongestPixel(image: Image, background: number[]): { color: number[]; ratio: number };
export function indicatorChange(before: Image, after: Image): { changed: number; ratio: number; color: number[] | null; area: number };
export function focusFindings(input: { selector: string; step: string; change: { changed: number; ratio: number; color: number[] | null } }): Finding[];
export function componentFindings(input: {
  kind: string; selector: string; ratio: number; foreground: number[]; background: number[];
  severity?: Finding['severity']; step?: string; reason?: string;
}): Finding[];
export function obscuredFindings(input: { selector: string; step: string; visible: number; points: number }): Finding[];
