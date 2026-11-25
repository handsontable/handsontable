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
export function isFieldShape(shape: string): boolean;
export function isFieldStop(stop: { shape: string; role: string }): boolean;
type Box = { x: number; y: number; width: number; height: number };
type Outline = { style: string; width: number; offset: number; color?: string };
type Ring = { box: Box; outline: Outline; shadow?: string };

export function outlineReach(outline: Outline): number;
export function shadowReach(shadow: string | undefined): number;
export function focusExtent(element: Ring, rings?: Ring[]): Box;
export function changedRings(focused: Array<Ring | null>, rest: Array<Ring | null>): Ring[];
export function pseudoRingBox(
  block: { x: number; y: number; clientLeft: number; clientTop: number } | null,
  style: { left: string; top: string; width: string; height: string },
): Box;
export function boxInCapture(box: Box, area: { x: number; y: number }): Box;
export function pixelBox(box: Box): Box;
export function boundaryOf(image: { width: number; height: number; data: number[] }, box: Box): {
  boundary: { color: number[]; ratio: number }; fill: { color: number[]; ratio: number }; around: number[];
};
export function boundaryFindings(input: { selector: string; boundary: { ratio: number }; fill: { ratio: number }; around: number[] }): Finding[];
export function stateLostFindings(input: {
  selector: string; state: string;
  element: { normal: Record<string, string>; forced: Record<string, string> };
  sibling: { normal: Record<string, string>; forced: Record<string, string> };
}): Finding[];
