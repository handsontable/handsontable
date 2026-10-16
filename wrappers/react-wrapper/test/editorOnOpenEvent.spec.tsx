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
} from './_helpers';

registerAllModules();

type OpenSurface = 'useHotEditor' | 'EditorComponent';

/**
 * Builds a keyboard event the shortcut manager and the editor manager can both read.
 * jsdom leaves `keyCode` at 0 on a constructed `KeyboardEvent`, and the fast-edit
 * path decides from that code whether the key opens an editor.
 * @param keyCode
 * @param key
 */
function dispatchKey(keyCode: number, key: string): KeyboardEvent {
  const event = document.createEvent('KeyboardEvent') as KeyboardEvent & { keyCodeVal: number };

  Object.defineProperty(event, 'keyCode', {
    get() {
      return this.keyCodeVal;
    }
  });
  Object.defineProperty(event, 'which', {
    get() {
      return this.keyCodeVal;
    }
  });
  Object.defineProperty(event, 'key', {
    get() {
      return key;
    }
  });

  if (event.initKeyboardEvent) {
    event.initKeyboardEvent('keydown', true, true, window, key, key, '', '', false, '');
  } else {
    event.initKeyEvent('keydown', true, true, window, false, false, false, false, keyCode, 0);
  }

  event.keyCodeVal = keyCode;
  document.activeElement!.dispatchEvent(event);

  return event;
}

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
      enter = dispatchKey(13, 'enter');
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
      typed = dispatchKey(65, 'a');
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

  it('should still run a callback that takes no arguments', async() => {
    let calls = 0;
    const Editor: React.FC = surface === 'useHotEditor' ?
      function NoArgHookEditor() {
        useHotEditor({
          onOpen() {
            calls += 1;
          },
        });

        return <div />;
      } :
      function NoArgComponentEditor() {
        return (
          <EditorComponent onOpen={() => {
            calls += 1;
          }}>
            {() => <span />}
          </EditorComponent>
        );
      };

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
        editor={Editor}
      />
    )).hotInstance!;

    await act(async() => {
      hot.selectCell(0, 0);
      dispatchKey(13, 'enter');
    });

    expect(calls).toBe(1);
  });
});
