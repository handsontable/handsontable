import { Core } from '../core';

export interface CellCoords {
  row: number;
  col: number;
}

export interface ViewportScroller {
  resume(): void;
  suspend(): void;
  skipNextScrollCycle(): void;
  scrollTo(cellCoords: CellCoords): void;
}

export interface ScrollStrategy {
  (cellCoords: CellCoords): { row: number; col: number } | void;
}

export interface FocusDetector {
  isFocused(): boolean;
  setFocus(): void;
  removeFocus(): void;
}

export interface HookBucket {
  add(name: string, callback: Function): void;
  remove(name: string, callback: Function): void;
  run(name: string, ...args: any[]): void;
  has(name: string): boolean;
  get(name: string): Function[];
} 