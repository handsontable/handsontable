import { Context } from './context';

export interface ShortcutManager {
  addContext(contextName: string, scope?: 'table' | 'global'): Context;
  getActiveContextName(): string;
  getContext(contextName: string): Context | undefined;
  getOrCreateContext(contextName: string, scope?: 'table' | 'global'): Context;
  setActiveContextName(contextName: string): void;
  hasEventShortcut(contextName: string, event: KeyboardEvent): boolean;
  isCtrlPressed(): boolean;
  destroy(): void;
}
