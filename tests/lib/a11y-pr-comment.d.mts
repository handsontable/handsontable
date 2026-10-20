export const COMMENT_MARKER: string;
export function neutralizeTaskIds(text: string): string;
export function shouldComment(comparison: object): boolean;
export function renderComment(comparison: object, links?: { reportUrl?: string; runUrl?: string; checkUrl?: string }): string;
