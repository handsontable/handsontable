export const MOTION_CHECK: string;
export const MOTION_CRITERIA: string[];

type Finding = {
  kind: string;
  criteria: string[];
  severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'advisory';
  reason: string;
  selector?: string;
  step?: string;
  measured?: Record<string, unknown>;
};
type SeenAnimation = { name: string; properties: string[]; duration: number; iterations: number | 'Infinity'; target: string; firstSeen: number; lastSeen: number; running: boolean };

export function isMotion(animation: { properties: string[]; duration: number }): boolean;
export function motionFindings(input: { reducedMotion: boolean; step: string; animations: SeenAnimation[] }): Finding[];
export function controlProblems(input: { reducedMotion: boolean; expectsMotion: boolean; step: string; animations: SeenAnimation[] }): string[];
export function longRunningFindings(input: { frames: { first: number; last: number }; animations: SeenAnimation[] }): Finding[];
export function forcedColorsFindings(input: { part: 'focus' | 'selection' | 'menu' | 'icon' | 'gridlines'; selector: string; step: string; changed: number }): Finding[];
