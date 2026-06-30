import type { LiveList } from "@liveblocks/client";

export const GRID_ROWS = 10;
export const GRID_COLS = 5;

declare global {
  interface Liveblocks {
    Presence: {
      selectedCell: { row: number; col: number } | null;
    };
    Storage: {
      grid: LiveList<LiveList<string>>;
    };
  }
}
