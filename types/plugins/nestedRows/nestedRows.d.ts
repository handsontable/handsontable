import Core from '../../core';
import { BasePlugin } from '../base';

export class NestedRows extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;

  disableCoreAPIModifiers(): void;
  enableCoreAPIModifiers(): void;
}
