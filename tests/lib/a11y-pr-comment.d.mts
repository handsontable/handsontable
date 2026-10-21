export const COMMENT_MARKER: string;
export function neutralizeTaskIds(text: string): string;
export type BaselineGrowth = { added: object[]; raised: object[] } | { error: string };
export type RestRequest = (url: string, options?: { method?: string; payload?: object; raw?: boolean }) => Promise<any>;
export function baselineGrowth(base: { text?: string; error?: string }, head: { entries?: object[] } | null): BaselineGrowth;
export function renderComment(comparison: object, links?: { reportUrl?: string; runUrl?: string; checkUrl?: string; growth?: BaselineGrowth }): string;
export function readBaseBaseline(input: { request: RestRequest; repoApi: string; sha?: string }): Promise<{ text: string } | { error: string }>;
export function upsertComment(input: { request: RestRequest; repoApi: string; prNumber: string | number; body: string }): Promise<{ action: 'edited' | 'posted'; url: string }>;
export function textBar(value: number, max: number, width?: number): string;
