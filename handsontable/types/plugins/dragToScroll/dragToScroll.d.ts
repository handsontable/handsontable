import Core from '../../core';
import { BasePlugin } from '../base';

export type Settings = boolean;

export class DragToScroll extends BasePlugin {
  constructor(hotInstance: Core);

  boundaries: DOMRect | undefined;

  isEnabled(): boolean;
  setBoundaries(boundaries: DOMRect): void;
  setCallback(callback: () => void): void;
  check(x: number, y: number): void;
}
