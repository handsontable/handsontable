import Core from '../../core';
import { BasePlugin } from '../base';

export interface DetailedSettings {
  row: number;
  col: number;
  collapsible: boolean;
}

export type Settings = boolean | DetailedSettings[];

export class CollapsibleColumns extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  expandSection(coords: { row: number, col: number }): void;
  collapseSection(coords: { row: number, col: number }): void;
  toggleAllCollapsibleSections(action: 'collapse' | 'expand'): void;
  collapseAll(): void;
  expandAll(): void;
  toggleCollapsibleSection(coords: { row: number, col: number }[], action?: 'collapse' | 'expand'): void;
}
