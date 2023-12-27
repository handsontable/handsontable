import Core from '../../core';
import { BasePlugin } from '../base';

interface DOMBoundaries {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export type Settings = boolean;

export class DragToScroll extends BasePlugin {
  constructor(hotInstance: Core);

  boundaries: DOMRect | undefined;

  isEnabled(): boolean;
  setBoundaries(boundaries: DOMRect | DOMBoundaries): void;
  setCallback(callback: () => void): void;
  check(x: number, y: number): void;
}
