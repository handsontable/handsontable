import React from 'react';
import { act } from '@testing-library/react';
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { EditorComponent } from '../src/hotEditor';
import { HotTableRef } from '../src/types';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponentWithRef,
  simulateKeyboardEvent,
} from './_helpers';
import { TEST_LICENSE_KEY } from './licenseKey';

registerAllModules();

type EditedCellRect = ReturnType<Handsontable.editors.BaseEditor['getEditedCellRect']>;

/**
 * Builds a grid whose column 1 uses an `EditorComponent` editor.
 *
 * @param {Function} [onClose] Passed to the editor's `onClose` prop.
 * @param {Function} [validator] A cell validator for the whole grid, with `allowInvalid: false`.
 * @returns {Handsontable} The grid.
 */
function mountGrid(onClose?: () => void, validator?: Handsontable.GridSettings['validator']) {
  const ResizeEditor: React.FC = () => (
    <EditorComponent onClose={onClose}>
      {() => <input id="resize-editor-input" />}
    </EditorComponent>
  );

  return mountComponentWithRef<HotTableRef>((
    <HotTable
      licenseKey={TEST_LICENSE_KEY}
      data={createSpreadsheetData(3, 4)}
      width={900}
      height={300}
      minRowHeights={23}
      colWidths={50}
      init={function() {
        mockElementDimensions(this.rootElement, 900, 300);
      }}
      editor={ResizeEditor}
      validator={validator}
      allowInvalid={validator ? false : undefined}
    />
  )).hotInstance!;
}

/**
 * The editor's positioned overlay: the element `EditorComponent` moves over the edited cell.
 *
 * @returns {HTMLElement}
 */
function editorOverlay(): HTMLElement {
  return document.querySelector<HTMLElement>('#resize-editor-input')!.parentElement!;
}

/**
 * Stands in for the edited cell's measured box, which jsdom cannot lay out. The test changes it the
 * way a grid resize moves a stretched column. `undefined` stands for a cell that is not rendered.
 *
 * @param {Handsontable.editors.BaseEditor} editor The open editor.
 * @param {object|undefined} rect The parts of the box that differ from the defaults.
 */
function stubEditedCellRect(editor: Handsontable.editors.BaseEditor, rect: Partial<EditedCellRect> | undefined) {
  editor.getEditedCellRect = () => (rect === undefined ? undefined : {
    top: 23,
    start: 100,
    width: 200,
    maxWidth: 800,
    height: 23,
    maxHeight: 300,
    ...rect,
  } as EditedCellRect);
}

/**
 * Gives the grid's root element a new measured size and runs core's own resize path, so the size
 * change is detected by `Core#refreshDimensions()` and the editor manager, not the test, asks the
 * open editor to reposition.
 *
 * @param {Handsontable} hot The grid.
 * @param {number} width The new width.
 */
function resizeGrid(hot: Handsontable, width: number) {
  hot.rootElement.getBoundingClientRect = () => ({
    x: 0, y: 0, top: 0, left: 0, right: width, bottom: 300, width, height: 300, toJSON: () => ({}),
  });
  hot.refreshDimensions();
}

/**
 * Selects a cell of column 1 and opens its editor with Enter.
 *
 * @param {Handsontable} hot The grid.
 * @returns {Promise<Handsontable.editors.BaseEditor>} The open editor.
 */
async function openEditorOnStretchedCell(hot: Handsontable) {
  await act(async() => {
    hot.selectCell(1, 1);
  });

  const editor = hot.getActiveEditor()!;

  stubEditedCellRect(editor, { start: 270, width: 201 });

  await act(async() => {
    simulateKeyboardEvent('keydown', 13);
  });

  return editor;
}

describe('EditorComponent on a grid that changes size', () => {
  it('should move the open editor onto its cell when the grid resizes', async() => {
    const hot = mountGrid();
    const editor = await openEditorOnStretchedCell(hot);

    expect(editor.isOpened()).toBe(true);
    expect(editorOverlay().style.left).toBe('270px');
    expect(editorOverlay().style.width).toBe('201px');

    stubEditedCellRect(editor, { start: 169, width: 104 });

    await act(async() => {
      resizeGrid(hot, 500);
    });

    expect(editor.isOpened()).toBe(true);
    expect(editorOverlay().style.left).toBe('169px');
    expect(editorOverlay().style.width).toBe('104px');
  });

  it('should end the edit without saving when the edited cell scrolls out of the rendered range', async() => {
    const onClose = jest.fn();
    const hot = mountGrid(onClose);
    const editor = await openEditorOnStretchedCell(hot);

    await act(async() => {
      editor.setValue('typed');
    });

    // The edited cell left the rendered range, so the editor has no cell to sit on.
    stubEditedCellRect(editor, undefined);

    await act(async() => {
      hot.runHooks('afterScrollVertically');
    });

    expect(editor.isOpened()).toBe(false);
    expect(editorOverlay().style.display).toBe('none');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(hot.getShortcutManager().getActiveContextName()).toBe('grid');
    expect(hot.getDataAtCell(1, 1)).toBe('B2');

    stubEditedCellRect(editor, { start: 169, width: 104 });

    await act(async() => {
      resizeGrid(hot, 500);
    });

    expect(editor.isOpened()).toBe(false);
    expect(editorOverlay().style.left).toBe('270px');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should keep the edit when its cell scrolls out while an async validator is pending', async() => {
    let answer: ((valid: boolean) => void) | undefined;
    const hot = mountGrid(undefined, (_value: unknown, callback: (valid: boolean) => void) => {
      answer = callback;
    });
    const editor = await openEditorOnStretchedCell(hot);

    await act(async() => {
      editor.setValue('bad');
      simulateKeyboardEvent('keydown', 13);
    });

    expect(editor.state).toBe('STATE_WAITING');

    stubEditedCellRect(editor, undefined);

    await act(async() => {
      hot.runHooks('afterScrollVertically');
    });

    expect(editor.state).toBe('STATE_WAITING');

    await act(async() => {
      answer!(false);
    });

    expect(editor.state).toBe('STATE_EDITING');
    expect(editor.isOpened()).toBe(true);
    expect(editor.getValue()).toBe('bad');
    expect(hot.getShortcutManager().getActiveContextName()).toBe('editor');
    expect(hot.getDataAtCell(1, 1)).toBe('B2');
  });
});
