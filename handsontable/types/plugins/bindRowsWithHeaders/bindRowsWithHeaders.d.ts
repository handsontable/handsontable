import Core from '../../core';
import { BasePlugin } from '../base';

export type Settings = boolean;

export class BindRowsWithHeaders extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
}
