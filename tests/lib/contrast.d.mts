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
export function isDrawn(part: { ratio: number }): boolean;
export function partContrast(
  image: Image & { width: number; height: number },
  box: { x: number; y: number; width: number; height: number },
  options?: { band?: number; mark?: boolean },
): { color: number[]; ratio: number; background: number[] };
type Change = {
  changed: number; ratio: number; replacedColor: number[] | null; replaced: number[] | null;
  color: number[] | null; adjacent: number[] | null; adjacentRatio: number; area: number;
};
export function indicatorChange(before: Image, after: Image, margin?: number): Change;
export function focusFindings(input: {
  selector: string; step: string; against?: 'adjacent' | 'before';
  change: Pick<Change, 'changed' | 'ratio' | 'color'> & Partial<Change>;
}): Finding[];
export function componentFindings(input: {
  kind: string; selector: string; ratio: number; foreground: number[]; background: number[];
  severity?: Finding['severity']; step?: string; reason?: string;
}): Finding[];
export function obscuredFindings(input: { selector: string; step: string; visible: number; points: number }): Finding[];
export function floorRatio(ratio: number): number;
