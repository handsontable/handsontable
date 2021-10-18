import { BasePlugin } from '../base';

export class DragToScroll extends BasePlugin {
  constructor(hotInstance: any);

  boundaries: DOMRect | void;

  isEnabled(): boolean;
  setBoundaries(boundaries: DOMRect): void;
  setCallback(callback: () => void): void;
  check(x: number, y: number): void;
}
