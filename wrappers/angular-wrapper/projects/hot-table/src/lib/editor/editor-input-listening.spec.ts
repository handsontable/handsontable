import { TestBed, ComponentFixture } from '@angular/core/testing';
import Handsontable from 'handsontable';
import { Component, EnvironmentInjector } from '@angular/core';
import { BaseEditorAdapter } from './base-editor-adapter';
import { HotCellEditorComponent } from './hot-cell-editor.component';

/**
 * A component editor whose focusable control is a plain `<input>`. The adapter appends its
 * placeholder to `hot.rootElement`, so the field lives inside the grid's own DOM and carries no
 * `data-hot-input` stamp - the shape the core fix recognises by containment.
 */
@Component({
  selector: 'hot-mock-input-editor',
  template: '<input id="ngEditorField" />',
  standalone: true,
})
class InputEditorComponent extends HotCellEditorComponent<string> {
  onFocus(): void {}
}

/**
 * DEV-2787. On every document `mouseup` the grid decides whether the focused input is its own, and
 * it used to read that from the `data-hot-input` attribute alone. A component editor's field
 * carries none, so a click into it unlistened the grid - which blocks every `table`-scoped
 * shortcut context, the `editor` one included, taking the editor's own Enter, Escape and Tab with
 * it.
 *
 * The React wrapper reaches the same verdict from `rootPortalElement`; Angular's placeholder sits
 * in `rootElement`, which is the other half of the containment test and is pinned here.
 */
describe('An Angular component editor whose input takes the browser focus', () => {
  let instance: Handsontable.Core;
  let container: HTMLElement;
  let editorFixture: ComponentFixture<InputEditorComponent>;

  beforeEach(() => {
    editorFixture = TestBed.createComponent(InputEditorComponent);

    const column = {
      editor: BaseEditorAdapter,
      _editorComponentReference: editorFixture.componentRef,
      _environmentInjector: TestBed.inject(EnvironmentInjector),
    };

    // Attached to the document on purpose: `document.activeElement` only follows `focus()` for an
    // element that is in the document, and the verdict under test reads exactly that.
    container = document.createElement('div');
    document.body.appendChild(container);

    instance = new Handsontable(container, <Handsontable.GridSettings>{
      licenseKey: 'non-commercial-and-evaluation',
      columns: [column],
      data: [['A1'], ['A2']],
    });
  });

  afterEach(() => {
    instance.destroy();
    editorFixture.destroy();
    container.remove();
  });

  it('should keep the grid listening', () => {
    instance.selectCell(0, 0);

    const editor = instance.getActiveEditor();

    if (!editor) {
      throw new Error('No editor was prepared for the selected cell');
    }

    editor.beginEditing();

    const field = instance.rootElement.querySelector('#ngEditorField') as HTMLInputElement;

    expect(field).not.toBeNull();
    expect(instance.isListening()).toBe(true);

    let unlistenCount = 0;

    instance.addHook('afterUnlisten', () => {
      unlistenCount += 1;
    });

    field.focus();
    field.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, buttons: 1 }));
    field.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));

    // The precondition the case rests on: with the focus anywhere else the verdict never reaches
    // the focused-input branch, and the case would pin nothing.
    expect(document.activeElement).toBe(field);

    expect(unlistenCount).toBe(0);
    expect(instance.isListening()).toBe(true);
  });
});
