import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { EditorComponent, useHotEditor } from '../src/hotEditor';
import { HotTableRef } from '../src/types';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponentWithRef,
  simulateKeyboardEvent,
} from './_helpers';

registerAllModules();

type OpenSurface = 'useHotEditor' | 'EditorComponent';

/**
 * Handsontable treats two left-button clicks on the same cell as a double-click
 * and opens the editor with the mouseup that completes the pair.
 * @param cell
 */
function dispatchDoubleClick(cell: Element): MouseEvent {
  const click = (type: 'mousedown' | 'mouseup'): MouseEvent => {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: type === 'mousedown' ? 1 : 0,
      view: window,
    });

    cell.dispatchEvent(event);

    return event;
  };

  click('mousedown');
  click('mouseup');
  click('mousedown');

  return click('mouseup');
}

function editorFor(surface: OpenSurface, opened: Array<Event | undefined>): React.FC {
  if (surface === 'useHotEditor') {
    return function HookOpenEditor() {
      useHotEditor({
        onOpen(event?: Event) {
          opened.push(event);
        },
      });

      return <div id="on-open-editor" />;
    };
  }

  return function ComponentOpenEditor() {
    return (
      <EditorComponent
        onOpen={(event?: Event) => {
          opened.push(event);
        }}
      >
        {() => <span />}
      </EditorComponent>
    );
  };
}

function mountEditor(surface: OpenSurface, opened: Array<Event | undefined>) {
  return mountComponentWithRef<HotTableRef>((
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      data={createSpreadsheetData(3, 3)}
      width={300}
      height={300}
      rowHeights={23}
      colWidths={50}
      init={function() {
        mockElementDimensions(this.rootElement, 300, 300);
      }}
      editor={editorFor(surface, opened)}
    />
  )).hotInstance!;
}

describe.each(['useHotEditor', 'EditorComponent'] as const)('%s onOpen', (surface) => {
  it('should receive the Enter keydown that opened the editor', async() => {
    const opened: Array<Event | undefined> = [];
    const hot = mountEditor(surface, opened);

    let enter: KeyboardEvent;

    await act(async() => {
      hot.selectCell(0, 0);
      enter = simulateKeyboardEvent('keydown', 13);
    });

    expect(opened).toHaveLength(1);
    expect(opened[0]).toBe(enter!);
    expect(opened[0]).toBeInstanceOf(KeyboardEvent);
  });

  it('should receive the character keydown that opened the editor', async() => {
    const opened: Array<Event | undefined> = [];
    const hot = mountEditor(surface, opened);

    let typed: KeyboardEvent;

    await act(async() => {
      hot.selectCell(0, 0);
      typed = simulateKeyboardEvent('keydown', 65);
    });

    expect(opened).toHaveLength(1);
    expect(opened[0]).toBe(typed!);
    expect(opened[0]).toBeInstanceOf(KeyboardEvent);
  });

  it('should receive the mouseup that completes a double-click', async() => {
    const opened: Array<Event | undefined> = [];
    const hot = mountEditor(surface, opened);
    const cell = hot.getCell(0, 0);

    expect(cell).not.toBeNull();

    let completing: MouseEvent;

    await act(async() => {
      completing = dispatchDoubleClick(cell!);
    });

    expect(opened).toHaveLength(1);
    expect(opened[0]).toBe(completing!);
    expect(opened[0]).toBeInstanceOf(MouseEvent);
  });

  it('should receive undefined when editing starts from the API', async() => {
    const opened: Array<Event | undefined> = [];
    const hot = mountEditor(surface, opened);

    await act(async() => {
      hot.selectCell(0, 0);
      hot.getActiveEditor()!.beginEditing();
    });

    expect(opened).toEqual([undefined]);
  });
});

/**
 * jsdom reports 0 for every cell's offset, so two cells would land the editor
 * in the same place and the assertion could not tell them apart.
 * @param cell
 * @param left
 * @param top
 */
function pinCellOffset(cell: HTMLElement, left: number, top: number) {
  Object.defineProperty(cell, 'offsetLeft', {
    configurable: true,
    get() {
      return left;
    },
  });
  Object.defineProperty(cell, 'offsetTop', {
    configurable: true,
    get() {
      return top;
    },
  });
}

describe('EditorComponent onOpen position', () => {
  it('should position the editor on the new cell before onOpen runs', async() => {
    const seen: string[] = [];

    const hot = mountComponentWithRef<HotTableRef>((
      <HotTable
        licenseKey="non-commercial-and-evaluation"
        data={createSpreadsheetData(3, 3)}
        width={300}
        height={300}
        rowHeights={23}
        colWidths={50}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        editor={function PositionEditor() {
          return (
            <EditorComponent
              onOpen={() => {
                const root = document.getElementById('editor-anchor')?.parentElement as HTMLElement;

                seen.push(root.style.left);
              }}
            >
              {() => <span id="editor-anchor" />}
            </EditorComponent>
          );
        }}
      />
    )).hotInstance!;

    const openCell = async(row: number, col: number, left: number) => {
      let cell: HTMLElement;

      await act(async() => {
        hot.selectCell(row, col);
        cell = hot.getCell(row, col)!;
        pinCellOffset(cell, left, 30);
        simulateKeyboardEvent('keydown', 13);
      });
    };

    await openCell(0, 0, 40);

    const root = document.getElementById('editor-anchor')!.parentElement as HTMLElement;
    const firstCell = root.style.left;

    await act(async() => {
      hot.destroyEditor();
    });

    await openCell(0, 1, 140);

    expect(seen).toHaveLength(2);
    expect(firstCell).not.toBe('');
    expect(root.style.left).not.toBe(firstCell);
    expect(seen[1]).toBe(root.style.left);
  });
});
