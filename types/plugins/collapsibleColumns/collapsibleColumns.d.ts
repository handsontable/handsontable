import { BasePlugin } from '../base';

export class CollapsibleColumns extends BasePlugin {
  constructor(hotInstance: any);
  isEnabled(): boolean;
  expandSection(coords: { row: number, col: number }): void;
  collapseSection(coords: { row: number, col: number }): void;
  toggleAllCollapsibleSections(action: 'collapse' | 'expand'): void;
  collapseAll(): void;
  expandAll(): void;
  toggleCollapsibleSection(coords: { row: number, col: number }[], action?: 'collapse' | 'expand'): void;
}
