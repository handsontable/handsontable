import { ComponentRef, createComponent, EnvironmentInjector } from '@angular/core';
import { editorFactory } from 'handsontable/editors';
import { CustomEditorPlaceholderComponent } from './custom-editor-placeholder.component';
import { AngularEditorProperties } from './models/factory-editor-properties';
import { ExtendedEditor } from 'handsontable/editors/factory';
import { HotCellEditorComponent } from './hot-cell-editor.component';
import { take } from 'rxjs';

/**
 * Combined type for the editor instance used throughout the adapter.
 */
type EditorInstance = ExtendedEditor<AngularEditorProperties & Record<string, any>> &
  AngularEditorProperties & {
    container: HTMLDivElement;
    input: HTMLElement;
  };

/**
 * Factory function to create a custom Handsontable editor adapter for Angular components.
 *
 * This adapter integrates Angular components with Handsontable's editor system using the new
 * editorFactory API, allowing you to use Angular components as custom cell editors while
 * maintaining full Angular lifecycle management and change detection.
 *
 * @returns A custom editor class that can be used in Handsontable column settings.
 *
 */
export const FactoryEditorAdapter = (componentRef: ComponentRef<HotCellEditorComponent<any>>) => {
  return editorFactory<EditorInstance>({
    position: componentRef.instance.position,
    shortcuts: componentRef.instance.shortcuts,
    value: componentRef.instance.originalValue,
    init(editor): void {
      editor._componentRef = componentRef;
      editor._editorPlaceHolderRef = undefined;
      editor._finishEditSubscription = undefined;
      editor._cancelEditSubscription = undefined;

      createEditorPlaceholder(editor, (editor.hot as any)._angularEnvironmentInjector);
      editor.input = editor._editorPlaceHolderRef.location.nativeElement;

      editor._afterRowResizeCallback = (): void => {
        if (editor.isOpened()) {
          applyPropsToEditor(editor);
        }
      };

      editor._afterColumnResizeCallback = (): void => {
        if (editor.isOpened()) {
          applyPropsToEditor(editor);
        }
      };

      editor._afterDestroyCallback = (): void => {
        if (editor._editorPlaceHolderRef) {
          editor._editorPlaceHolderRef.destroy();
        }
      };

      editor.hot.addHook('afterRowResize', editor._afterRowResizeCallback);
      editor.hot.addHook('afterColumnResize', editor._afterColumnResizeCallback);
      editor.hot.addHook('afterDestroy', editor._afterDestroyCallback);
    },

    afterInit: (editor) => editor._componentRef.instance.afterInit?.(editor),
    beforeOpen: (editor, context) => {
      cleanupSubscriptions(editor);

      applyPropsToEditor(editor);

      editor._finishEditSubscription = editor._componentRef.instance.finishEdit.pipe(take(1)).subscribe((): void => {
        editor.finishEditing();
      });

      editor._cancelEditSubscription = editor._componentRef.instance.cancelEdit.pipe(take(1)).subscribe((): void => {
        editor.cancelChanges();
      });
      editor._componentRef.instance.beforeOpen?.(editor, context);
    },
    afterOpen: (editor, event) => {
      editor._componentRef.instance.afterOpen?.(editor, event);
    },
    onFocus: (editor) => editor._componentRef.instance.onFocus?.(editor),
    afterClose: (editor) => {
      resetEditorState(editor);
      editor._editorPlaceHolderRef.changeDetectorRef.detectChanges();
      editor._editorPlaceHolderRef.instance.detachEditor();
      editor._componentRef.instance.afterClose(editor);
    },
    getValue: (editor) => editor._componentRef.instance.getValue(),
    setValue: (editor, value) => {
      editor.value = value;
      editor._componentRef.instance.setValue(value);
      editor._componentRef.changeDetectorRef.detectChanges();
    },
  });
};

/**
 * Creates the editor placeholder component.
 * @param editor The editor instance.
 * @param injector The environment injector from Angular.
 */
function createEditorPlaceholder(editor: EditorInstance, injector: EnvironmentInjector | undefined): void {
  if (!injector) {
    return;
  }

  editor._editorPlaceHolderRef = createComponent(CustomEditorPlaceholderComponent, {
    environmentInjector: injector,
  });
}

/**
 * Applies properties to the custom Angular editor and editor placeholder.
 * Updates position, size, and cell context information.
 * @param editor The editor instance.
 */
function applyPropsToEditor(editor: EditorInstance): void {
  if (!editor._componentRef || !editor._editorPlaceHolderRef) {
    return;
  }

  editor._componentRef.setInput('originalValue', editor.originalValue);
  editor._componentRef.setInput('row', editor.row);
  editor._componentRef.setInput('column', editor.col);
  editor._componentRef.setInput('prop', editor.prop);
  editor._componentRef.setInput('cellProperties', editor.cellProperties);
  editor._componentRef.setInput('handsontableInputClass', false);

  const rect = editor.hot.getCell(editor.row, editor.col)?.getBoundingClientRect();

  editor._editorPlaceHolderRef.setInput('placeholderCustomClass', '');
  editor._editorPlaceHolderRef.setInput('height', rect.height);
  editor._editorPlaceHolderRef.setInput('width', rect.width);
  editor._editorPlaceHolderRef.setInput('isVisible', true);
  editor._editorPlaceHolderRef.setInput('componentRef', editor._componentRef);

  editor._editorPlaceHolderRef.changeDetectorRef.detectChanges();
}

/**
 * Resets the editor placeholder state.
 * Clears all positioning and visibility settings.
 * @param editor The editor instance.
 */
function resetEditorState(editor: EditorInstance): void {
  if (!editor._editorPlaceHolderRef) {
    return;
  }

  editor._editorPlaceHolderRef.setInput('top', undefined);
  editor._editorPlaceHolderRef.setInput('left', undefined);
  editor._editorPlaceHolderRef.setInput('height', undefined);
  editor._editorPlaceHolderRef.setInput('width', undefined);
  editor._editorPlaceHolderRef.setInput('isVisible', false);
  editor._editorPlaceHolderRef.setInput('componentRef', undefined);
}

/**
 * Cleans up existing subscriptions.
 * @param editor The editor instance.
 */
function cleanupSubscriptions(editor: EditorInstance): void {
  if (editor._finishEditSubscription) {
    editor._finishEditSubscription.unsubscribe();
    editor._finishEditSubscription = undefined;
  }

  if (editor._cancelEditSubscription) {
    editor._cancelEditSubscription.unsubscribe();
    editor._cancelEditSubscription = undefined;
  }
}
