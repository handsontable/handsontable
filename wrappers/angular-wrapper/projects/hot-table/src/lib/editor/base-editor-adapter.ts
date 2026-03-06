import Handsontable from 'handsontable/base';
import {
  ComponentRef,
  createComponent,
  EnvironmentInjector,
} from '@angular/core';
import { CustomEditorPlaceholderComponent } from './custom-editor-placeholder.component';
import { ColumnSettingsInternal } from '../models/column-settings';
import { HotCellEditorComponent } from './hot-cell-editor.component';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

/**
 * Adapter for BaseEditor from Handsontable.
 */
export class BaseEditorAdapter extends Handsontable.editors.BaseEditor {
  /** Reference to the custom editor component. */
  private _componentRef?: ComponentRef<HotCellEditorComponent<any>>;

  /** Reference to the editor placeholder component. */
  private _editorPlaceHolderRef: ComponentRef<CustomEditorPlaceholderComponent>;

  /** Flag indicating whether the placeholder is ready. */
  private _isPlaceholderReady = false;

  /** Subscription for the finish edit event. */
  private _finishEditSubscription?: Subscription;

  /** Subscription for the cancel edit event. */
  private _cancelEditSubscription?: Subscription;

  /**
   * Creates an instance of BaseEditorAdapter.
   * @param instance The Handsontable instance.
   */
  constructor(instance: Handsontable.Core) {
    super(instance);

    this.hot.addHook('afterRowResize', this.onAfterRowResize.bind(this));
    this.hot.addHook('afterColumnResize', this.onAfterColumnResize.bind(this));
    this.hot.addHook('afterDestroy', this.onAfterDestroy.bind(this));
  }

  /**
   * Prepares the editor for editing. Parameters are passed from Handsontable.
   * @param row The row index.
   * @param column The column index.
   * @param prop The property name.
   * @param TD The table cell element.
   * @param originalValue The original value of the cell.
   * @param cellProperties The cell properties.
   */
  override prepare(
    row: number,
    column: number,
    prop: string | number,
    TD: HTMLTableCellElement,
    originalValue: any,
    cellProperties: Handsontable.CellProperties
  ): void {
    if (!this.isOpened()) {
      super.prepare(row, column, prop, TD, originalValue, cellProperties);
      const columnMeta: ColumnSettingsInternal = this.hot.getColumnMeta(
        column
      ) as ColumnSettingsInternal;

      if (!this._isPlaceholderReady) {
        this.createEditorPlaceholder(columnMeta._environmentInjector);
        this._isPlaceholderReady = true;
      }

      this._componentRef = columnMeta._editorComponentReference;

      if (this._finishEditSubscription) {
        this._finishEditSubscription.unsubscribe();
        this._finishEditSubscription = undefined;
      }

      if (this._cancelEditSubscription) {
        this._cancelEditSubscription.unsubscribe();
        this._cancelEditSubscription = undefined;
      }

      this._finishEditSubscription = this._componentRef.instance.finishEdit
        .pipe(take(1))
        .subscribe(() => {
          this.finishEditing();
        });

      this._cancelEditSubscription = this._componentRef.instance.cancelEdit
        .pipe(take(1))
        .subscribe(() => {
          this.cancelChanges();
        });
    }
  }

  /**
   * Closes the editor. This event is triggered by Handsontable.
   */
  close(): void {
    if (this.isOpened()) {
      this.resetEditorState();
      this._editorPlaceHolderRef.changeDetectorRef.detectChanges();
      this._editorPlaceHolderRef.instance.detachEditor();
      this._componentRef.instance.onClose();
    }
  }

  /**
   * Focuses the editor. This event is triggered by Handsontable.
   */
  focus(): void {
    this._componentRef.instance.onFocus();
  }

  /**
   * Gets the value from the editor.
   * @returns The value from the editor.
   */
  getValue(): any {
    return this._componentRef.instance?.getValue();
  }

  /**
   * Opens the editor. This event is triggered by Handsontable.
   * When opening, we set the shortcut context to 'editor'.
   * This allows the built-in keyboard shortcuts to operate within the editor.
   * @param event The event that triggered the opening of the editor.
   * @remarks When entering edit mode using double-click, keyboard shortcuts do not work.
   */
  open(event?: Event): void {
    this.hot.getShortcutManager().setActiveContextName('editor');
    this.applyPropsToEditor();
    this._componentRef.instance.onOpen(event);
  }

  /**
   * Sets the value for the custom editor.
   * @param newValue The value to set.
   */
  setValue(newValue?: any): void {
    this._componentRef.instance?.setValue(newValue);
    this._componentRef.changeDetectorRef.detectChanges();
  }

  /**
   * Applies properties to the custom editor and editor placeholder.
   */
  private applyPropsToEditor(): void {
    const rect = this.getEditedCellRect();

    if (!this.isInFullEditMode()) {
      this._componentRef.instance.setValue(null);
    }

    this._componentRef.setInput('originalValue', this.originalValue);
    this._componentRef.setInput('row', this.row);
    this._componentRef.setInput('column', this.col);
    this._componentRef.setInput('prop', this.prop);
    this._componentRef.setInput('cellProperties', this.cellProperties);

    this._editorPlaceHolderRef.setInput('top', rect.top);
    this._editorPlaceHolderRef.setInput('left', rect.start);
    this._editorPlaceHolderRef.setInput('height', rect.height);
    this._editorPlaceHolderRef.setInput('width', rect.width);
    this._editorPlaceHolderRef.setInput('isVisible', true);
    this._editorPlaceHolderRef.setInput('componentRef', this._componentRef);
    this._editorPlaceHolderRef.changeDetectorRef.detectChanges();
  }

  /**
   * Creates the editor placeholder and append it to hot rootElement.
   * @param injector The environment injector.
   */
  private createEditorPlaceholder(injector: EnvironmentInjector): void {
    this._editorPlaceHolderRef = createComponent(
      CustomEditorPlaceholderComponent,
      {
        environmentInjector: injector as EnvironmentInjector,
      }
    );

    this.hot.rootElement.appendChild(
      this._editorPlaceHolderRef.location.nativeElement
    );
  }

  /**
   * Handles the after column resize event.
   * Helps adjust the editor size to the column size and update its position.
   */
  private onAfterColumnResize(): void {
    if (this.isOpened()) {
      this.applyPropsToEditor();
    }
  }

  /**
   * Handles the after row resize event.
   * Helps adjust the editor size to the column size and update its position.
   */
  private onAfterRowResize(): void {
    if (this.isOpened()) {
      this.applyPropsToEditor();
    }
  }

  /**
   * Handles the after destroy event.
   */
  private onAfterDestroy(): void {
    this._editorPlaceHolderRef?.destroy();
  }

  /**
   * Resets the editor placeholder state.
   * We need to reset the editor placeholder state because we use it
   * to store multiple references to the custom editor.
   */
  private resetEditorState(): void {
    this._editorPlaceHolderRef.setInput('top', undefined);
    this._editorPlaceHolderRef.setInput('left', undefined);
    this._editorPlaceHolderRef.setInput('height', undefined);
    this._editorPlaceHolderRef.setInput('width', undefined);
    this._editorPlaceHolderRef.setInput('isVisible', false);
    this._editorPlaceHolderRef.setInput('componentRef', undefined);
  }
}
