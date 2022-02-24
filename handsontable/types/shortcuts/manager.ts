import { Context } from './context';

export interface ShortcutManager {
  addContext(contextName: string): Context;
  getActiveContextName(): string;
  getContext(contextName: string): Context;
  setActiveContextName(contextName: string): void;
  isCtrlPressed(): boolean;
  destroy(): void;
}
