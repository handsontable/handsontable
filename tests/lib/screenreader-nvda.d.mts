export type NvdaMode = 'focus' | 'browse';

export declare const MODE_TOGGLES: number;
export declare const NO_MODE_ANNOUNCED: string;
export declare function lastNvdaMode(phrases: unknown[]): NvdaMode | null;
export declare function inferredModeNote(mode: NvdaMode): string;
export declare function ensureNvdaMode(input: {
  mode: NvdaMode | null;
  wanted: NvdaMode;
  toggle: () => Promise<string>;
  attempts?: number;
}): Promise<{ mode: NvdaMode; said: string[] }>;
