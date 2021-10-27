import Core from '../../core';
import { BasePlugin } from '../base';

export type Settings = boolean;

export class TouchScroll extends BasePlugin {
  constructor(hotInstance: Core);

  scrollbars: any[];
  clones: any[];
  lockedCollection: boolean;
  freezeOverlays: boolean;
}
