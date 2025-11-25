type FocusScopeType = 'modal' | 'inline';
type FocusScopeActivationSource = 'unknown' | 'click' | 'tab_from_above' | 'tab_from_below';

type FocusScopeOptions = {
  shortcutsContextName?: string;
  type?: FocusScopeType;
  contains?: (target: HTMLElement) => boolean;
  runOnlyIf?: () => boolean;
  onActivate?: (focusSource: FocusScopeActivationSource) => void;
  onDeactivate?: () => void;
};

export interface FocusScopeManager {
  getActiveScopeId(): string | null;
  registerScope(scopeId: string, container: HTMLElement, options?: FocusScopeOptions): void;
  unregisterScope(scopeId: string): void;
  activateScope(scopeId: string): void;
  deactivateScope(scopeId: string): void;
}
