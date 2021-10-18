import { BasePlugin } from "../base";

export type SeparatorObject = {
  name: string;
}

export class DropdownMenu extends BasePlugin {
  static SEPARATOR: SeparatorObject;

  constructor(hotInstance: any);
  isEnabled(): boolean;
  open(event: Event): void;
  close(): void;
  executeCommand(commandName: string, ...params: any): void;
}
