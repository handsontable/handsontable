import Core from '../../core';
import { BasePlugin } from '../base';
import { PredefinedMenuItemKey, Selection, MenuConfig } from '../contextMenu';

export interface SeparatorObject {
  name: string;
}

export interface DetailedSettings {
  callback?: (key: string, selection: Selection[], clickEvent: MouseEvent) => void;
  items: PredefinedMenuItemKey[] | MenuConfig;
}

export type Settings = boolean | PredefinedMenuItemKey[] | DetailedSettings;

export class DropdownMenu extends BasePlugin {
  static SEPARATOR: SeparatorObject;

  constructor(hotInstance: Core);
  isEnabled(): boolean;
  open(event: Event): void;
  close(): void;
  executeCommand(commandName: string, ...params: any): void;
}
