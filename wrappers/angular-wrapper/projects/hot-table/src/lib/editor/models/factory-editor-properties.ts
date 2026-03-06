import { ComponentRef } from '@angular/core';
import { CustomEditorPlaceholderComponent } from '../custom-editor-placeholder.component';
import { Subscription } from 'rxjs';
import { HotCellEditorAdvancedComponent } from '../hot-cell-editor-advanced.component';

/**
 * Angular-specific properties that will be added to the editor instance.
 */
export interface AngularEditorProperties {
  input: HTMLElement;

  /** Reference to the custom Angular editor component. */
  _componentRef?: ComponentRef<HotCellEditorAdvancedComponent<any>>;

  /** Reference to the editor placeholder component. */
  _editorPlaceHolderRef?: ComponentRef<CustomEditorPlaceholderComponent>;

  /** Subscription for the finish edit event. */
  _finishEditSubscription?: Subscription;

  /** Subscription for the cancel edit event. */
  _cancelEditSubscription?: Subscription;

  /** Callback for after row resize hook. */
  _afterRowResizeCallback: () => void;

  /** Callback for after column resize hook. */
  _afterColumnResizeCallback: () => void;

  /** Callback for after destroy hook. */
  _afterDestroyCallback: () => void;
}
