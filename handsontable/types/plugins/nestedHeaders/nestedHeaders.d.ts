import Core from '../../core';
import { BasePlugin } from '../base';

export interface DetailedSettings {
  label: string;
  colspan: number;
}

export type Settings = Array<Array<string | DetailedSettings>>;

export class NestedHeaders extends BasePlugin {
  constructor(hotInstance: Core);

  detectedOverlappedHeaders: boolean;

  isEnabled(): boolean;
}
