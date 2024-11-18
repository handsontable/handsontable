import Core from '../../core';
import { BasePlugin } from '../base';
import { PredefinedMenuItemKey, Selection, MenuConfig } from '../contextMenu';

export interface SeparatorObject {
  name: string;
}

export interface DetailedSettings {
  callback?: (key: string, selection: Selection[], clickEvent: MouseEvent) => void;
  uiContainer?: HTMLElement,
  items?: PredefinedMenuItemKey[] | MenuConfig;
}

export type Settings = boolean | PredefinedMenuItemKey[] | DetailedSettings;

export class DropdownMenu extends BasePlugin {
  static SEPARATOR: SeparatorObject;

  constructor(hotInstance: Core);
  isEnabled(): boolean;
  open(position: { left: number, top: number } | Event, offset?: { above?: number, below?: number, left?: number, right?: number }): void;
  close(): void;
  executeCommand(commandName: string, ...params: any): void;
}
