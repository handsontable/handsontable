export type NvdaMode = 'focus' | 'browse';

export declare const MODE_TOGGLES: number;
export declare function lastNvdaMode(phrases: unknown[]): NvdaMode | null;
export declare function inferredModeNote(mode: NvdaMode): string;
export declare function ensureNvdaMode(input: {
  mode: NvdaMode | null;
  wanted: NvdaMode;
  toggle: () => Promise<string>;
  attempts?: number;
  entered?: string[];
}): Promise<{ mode: NvdaMode; said: string[] }>;
