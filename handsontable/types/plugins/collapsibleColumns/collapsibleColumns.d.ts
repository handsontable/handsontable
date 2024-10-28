import Core from '../../core';
import { BasePlugin } from '../base';
import { SimpleCellCoords } from '../../common';

export interface DetailedSettings {
  row: number;
  col: number;
  collapsible: boolean;
}

export type Settings = boolean | DetailedSettings[];

export class CollapsibleColumns extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  expandSection(coords: SimpleCellCoords): void;
  collapseSection(coords: SimpleCellCoords): void;
  toggleAllCollapsibleSections(action: 'collapse' | 'expand'): void;
  collapseAll(): void;
  expandAll(): void;
  toggleCollapsibleSection(coords: SimpleCellCoords[], action?: 'collapse' | 'expand'): void;
}
