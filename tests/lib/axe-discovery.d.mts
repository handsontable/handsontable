export const DISCOVERY_CHECK: string;
export const DISCOVERY_TAGS: string[];
export function ruleFamily(tags?: string[]): 'experimental' | 'wcag-a-aa' | 'wcag-aaa' | 'best-practice';
export function nodeReason(node: object): string;
export function nodeCause(node: object): string;
export function rightToLeftQuery(source: string): string;
export function discoveryFindings(results: { violations?: object[]; incomplete?: object[] }, location?: { file?: string; line?: number }): Array<{
  kind: string;
  rule: string;
  criteria: string[];
  severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'advisory';
  selector: string;
  measured: { rule: string; family: string; nodes: number; example: string };
  reason: string;
  cause?: string;
  file?: string;
  line?: number;
}>;
