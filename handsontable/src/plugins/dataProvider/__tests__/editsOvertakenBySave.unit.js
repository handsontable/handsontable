import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { DataProvider } from '../dataProvider';
import { Dialog } from '../../dialog/dialog';
import { EmptyDataState } from '../../emptyDataState/emptyDataState';
import { TextEditor } from '../../../editors/textEditor';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * Lets the queued microtask chains (validators, mutation queue, fetch landing) run to their end.
 *
 * @returns {Promise<void>}
 */
async function settle() {
  for (let i = 0; i < 60; i++) {
    await Promise.resolve();
  }
}

describe('DataProvider -> an edit the refetch that follows a save drops while it waits for its validator', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(DataProvider);
    registerPlugin(Dialog);
    registerPlugin(EmptyDataState);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot && !hot.isDestroyed) {
      hot.destroy();
    }

    hot = null;
    container.remove();
  });

  /**
   * Creates a server whose `fetchRows` answers only when the test releases it (except the first fetch), and a
   * validator whose answer for a gated value waits until the test gives it. An ungated value is valid unless
   * the test set another verdict for it.
   *
   * @returns {object}
   */
  function createServer() {
    const server = {
      records: [
        { id: 1, name: 'Ann' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Cid' },
      ],
      pendingFetches: [],
      gates: new Map(),
      verdicts: new Map(),
    };

    server.config = {
      rowId: 'id',
      fetchRows: jest.fn((query, { signal }) => new Promise((resolve, reject) => {
        const respond = () => {
          const rows = server.records.map(record => ({ ...record }));

          resolve({ rows, totalRows: rows.length });
        };

        if (server.config.fetchRows.mock.calls.length === 1) {
          respond();

          return;
        }

        server.pendingFetches.push(respond);
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })),
      onRowsUpdate: jest.fn((rows) => {
        rows.forEach(({ id, changes }) => {
          Object.assign(server.records.find(record => record.id === id), changes);
        });

        return Promise.resolve();
      }),
      onRowsCreate: jest.fn(() => Promise.resolve()),
      onRowsRemove: jest.fn(() => Promise.resolve()),
    };

    server.gate = (value) => {
      server.gates.set(value, []);
    };
    server.validator = (value, callback) => {
      const waiting = server.gates.get(value);

      if (waiting) {
        waiting.push(callback);
      } else {
        callback(server.verdicts.get(value) ?? true);
      }
    };
    server.answer = async(value, result = true) => {
      const waiting = server.gates.get(value) ?? [];

      server.gates.delete(value);
      waiting.forEach(callback => callback(result));
      await settle();
    };
    server.releaseFetches = async() => {
      server.pendingFetches.splice(0).forEach(respond => respond());
      await settle();
    };
    server.savedNames = () => server.config.onRowsUpdate.mock.calls
      .flatMap(([rows]) => rows.map(({ id, changes }) => [id, changes.name]));

    return server;
  }

  /**
   * @param {object} server The server from `createServer()`.
   * @param {object} [nameColumn] Extra settings of the validated column.
   * @param {object} [settings] Extra grid settings.
   * @returns {Promise<void>}
   */
  async function createGrid(server, nameColumn = {}, settings = {}) {
    hot = new Handsontable(container, {
      columns: [
        { data: 'id' },
        { data: 'name', validator: (value, callback) => server.validator(value, callback), ...nameColumn },
      ],
      dataProvider: server.config,
      renderAllRows: true,
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    await settle();
  }

  /**
   * Saves an edit of the first record; its refetch waits for `releaseFetches()`.
   *
   * @returns {Promise<void>}
   */
  async function saveFirstEdit() {
    hot.setDataAtCell(0, 1, 'Ann 2', 'edit');
    await settle();
  }

  /**
   * Confirms a value in the cell editor, the way a user does.
   *
   * @param {number} row The visual row.
   * @param {number} col The visual column.
   * @param {string} value The typed value.
   */
  function confirmInEditor(row, col, value) {
    hot.selectCell(row, col);
    hot._getEditorManager().openEditor(value, undefined, true);
    hot.getActiveEditor().finishEditing();
  }

  it('should save an edit the refetch dropped, and keep it after its own refetch', async() => {
    const server = createServer();

    await createGrid(server);
    await saveFirstEdit();

    server.gate('Bob 2');
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();
    await server.releaseFetches();

    expect(hot.getDataAtCol(1)).toEqual(['Ann 2', 'Bob', 'Cid']);

    await server.answer('Bob 2');

    expect(server.savedNames()).toEqual([[1, 'Ann 2'], [2, 'Bob 2']]);
    expect(hot.getDataAtCell(1, 1)).toBe('Bob 2');

    await server.releaseFetches();

    expect(hot.getDataAtCol(1)).toEqual(['Ann 2', 'Bob 2', 'Cid']);
  });

  it('should write the edit into its record when the refetch reorders the rows', async() => {
    const server = createServer();

    await createGrid(server);
    await saveFirstEdit();

    server.gate('Bob 2');
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();
    server.records[0].name = 'Ann 2';
    server.records.splice(0, 0, { id: 4, name: 'Dee' });
    await server.releaseFetches();
    await server.answer('Bob 2');

    expect(hot.getDataAtRowProp(2, 'name')).toBe('Bob 2');
    expect(hot.getDataAtRowProp(1, 'name')).toBe('Ann 2');
    expect(server.savedNames()).toEqual([[1, 'Ann 2'], [2, 'Bob 2']]);
  });

  it('should leave the edit dropped when the server removed its record', async() => {
    const server = createServer();

    await createGrid(server);
    await saveFirstEdit();

    server.gate('Bob 2');
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();
    server.records.splice(1, 1);
    await server.releaseFetches();
    await server.answer('Bob 2');

    expect(hot.getDataAtCol(1)).toEqual(['Ann 2', 'Cid']);
    expect(server.savedNames()).toEqual([[1, 'Ann 2']]);
  });

  it('should leave the edit dropped when its row has no id', async() => {
    const server = createServer();

    server.records[1].id = null;
    await createGrid(server);
    await saveFirstEdit();

    server.gate('Bob 2');
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();
    await server.releaseFetches();
    await server.answer('Bob 2');

    expect(hot.getDataAtCell(1, 1)).toBe('Bob');
    expect(server.savedNames()).toEqual([[1, 'Ann 2']]);
  });

  it('should keep an invalid edit marked and unsaved under allowInvalid: true', async() => {
    const server = createServer();

    await createGrid(server);
    await saveFirstEdit();

    server.gate('Bob 2');
    server.verdicts.set('Bob 2', false);
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();
    await server.releaseFetches();
    await server.answer('Bob 2', false);

    expect(hot.getDataAtCell(1, 1)).toBe('Bob 2');
    expect(hot.getCellMeta(1, 1).valid).toBe(false);
    expect(server.savedNames()).toEqual([[1, 'Ann 2']]);
  });

  it('should open the editor on the record again when the first validation rejects the typed value', async() => {
    const server = createServer();

    await createGrid(server, { allowInvalid: false });
    await saveFirstEdit();

    server.gate('Bob 2');
    confirmInEditor(1, 1, 'Bob 2');
    await settle();
    server.records.splice(0, 0, { id: 4, name: 'Dee' });
    await server.releaseFetches();

    expect(hot.getActiveEditor().isOpened()).toBe(false);

    await server.answer('Bob 2', false);

    const editor = hot.getActiveEditor();

    expect(editor.isOpened()).toBe(true);
    expect(editor.getValue()).toBe('Bob 2');
    expect([editor.row, editor.col]).toEqual([2, 1]);
    expect(hot.getDataAtCell(2, 1)).toBe('Bob');
    expect(server.savedNames()).toEqual([[1, 'Ann 2']]);
  });

  it('should keep the editor open on the record when the second validation rejects the typed value', async() => {
    const server = createServer();

    await createGrid(server, { allowInvalid: false });
    await saveFirstEdit();

    server.gate('Bob 2');
    confirmInEditor(1, 1, 'Bob 2');
    await settle();
    server.records.splice(0, 0, { id: 4, name: 'Dee' });
    await server.releaseFetches();
    server.verdicts.set('Bob 2', false);
    await server.answer('Bob 2', true);

    const editor = hot.getActiveEditor();

    expect(editor.isOpened()).toBe(true);
    expect(editor.getValue()).toBe('Bob 2');
    expect([editor.row, editor.col]).toEqual([2, 1]);
    expect(server.savedNames()).toEqual([[1, 'Ann 2']]);
  });

  it('should save the typed value through the editor when the second validation accepts it', async() => {
    const server = createServer();

    await createGrid(server, { allowInvalid: false });
    await saveFirstEdit();

    server.gate('Bob 2');
    confirmInEditor(1, 1, 'Bob 2');
    await settle();
    await server.releaseFetches();
    await server.answer('Bob 2', true);

    expect(hot.getActiveEditor().isOpened()).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe('Bob 2');
    expect(server.savedNames()).toEqual([[1, 'Ann 2'], [2, 'Bob 2']]);
  });

  it('should save the typed value without the editor when the record\'s cell is not rendered', async() => {
    const server = createServer();

    await createGrid(server, { allowInvalid: false }, { renderAllRows: false });
    await saveFirstEdit();

    server.gate('Bob 2');
    confirmInEditor(1, 1, 'Bob 2');
    await settle();
    server.records.splice(0, 0, { id: 4, name: 'Dee' }, { id: 5, name: 'Eve' });
    await server.releaseFetches();
    await server.answer('Bob 2', true);

    expect(hot.getActiveEditor()?.isOpened() ?? false).toBe(false);
    expect(hot.getDataAtRowProp(3, 'name')).toBe('Bob 2');
    expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
    expect(server.savedNames()).toEqual([[1, 'Ann 2'], [2, 'Bob 2']]);
  });

  it('should save the typed value without the editor when beforeBeginEditing declines to open it', async() => {
    const server = createServer();

    await createGrid(server, { allowInvalid: false });
    await saveFirstEdit();

    server.gate('Bob 2');
    confirmInEditor(1, 1, 'Bob 2');
    await settle();
    hot.addHook('beforeBeginEditing', () => false);
    server.records.splice(0, 0, { id: 4, name: 'Dee' });
    await server.releaseFetches();
    await server.answer('Bob 2', true);

    expect(hot.getActiveEditor()?.isOpened() ?? false).toBe(false);
    expect(hot.getDataAtRowProp(2, 'name')).toBe('Bob 2');
    expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
    expect(server.savedNames()).toEqual([[1, 'Ann 2'], [2, 'Bob 2']]);
  });

  it('should write the typed value without the editor when the record\'s cell is read-only', async() => {
    const server = createServer();

    await createGrid(server, { allowInvalid: false }, {
      cells(row, col) {
        return this.instance.getDataAtRowProp(row, 'id') === 2 && row !== 1 && col === 1 ? { readOnly: true } : {};
      },
    });
    await saveFirstEdit();

    server.gate('Bob 2');
    confirmInEditor(1, 1, 'Bob 2');
    await settle();
    server.records.splice(0, 0, { id: 4, name: 'Dee' });
    await server.releaseFetches();
    await server.answer('Bob 2', true);

    expect(hot.getActiveEditor()?.isOpened() ?? false).toBe(false);
    expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);
    expect(hot.getDataAtRowProp(2, 'name')).toBe('Bob 2');
  });

  it('should not open the editor again while a dialog holds the keyboard', async() => {
    const server = createServer();

    await createGrid(server, { allowInvalid: false }, { dialog: true });
    await saveFirstEdit();

    server.gate('Bob 2');
    confirmInEditor(1, 1, 'Bob 2');
    await settle();
    await server.releaseFetches();
    hot.getPlugin('dialog').show({ content: 'Saving' });
    await server.answer('Bob 2', false);

    expect(hot.getActiveEditor()?.isOpened() ?? false).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe('Bob');
  });

  it('should not open the editor again while the loading overlay covers the grid', async() => {
    const server = createServer();

    await createGrid(server, { allowInvalid: false }, { emptyDataState: true });
    await saveFirstEdit();

    server.gate('Bob 2');
    confirmInEditor(1, 1, 'Bob 2');
    await settle();
    await server.releaseFetches();

    const fetch = hot.getPlugin('dataProvider').fetchData({ page: 1 });

    await settle();
    await server.answer('Bob 2', false);

    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
    expect(hot.getActiveEditor()?.isOpened() ?? false).toBe(false);

    await server.releaseFetches();
    await fetch;
  });

  it('should not open the editor again for an editor whose value is not text', async() => {
    const server = createServer();

    class ListEditor extends TextEditor {
      getValue() {
        return [super.getValue()];
      }
    }

    server.verdicts.set('Bob 2', true);
    await createGrid(server, {
      allowInvalid: false,
      editor: ListEditor,
      validator: (value, callback) => server.validator(Array.isArray(value) ? value[0] : value, callback),
    });
    await saveFirstEdit();

    server.gate('Bob 2');
    confirmInEditor(1, 1, 'Bob 2');
    await settle();
    await server.releaseFetches();
    server.verdicts.set('Bob 2', false);
    await server.answer('Bob 2', true);

    expect(hot.getActiveEditor()?.isOpened() ?? false).toBe(false);
  });

  it('should save the other edits when the rowId function throws for the row of a waiting edit', async() => {
    const server = createServer();
    const logError = jest.spyOn(console, 'error').mockImplementation(() => {});

    server.records = [
      { meta: { id: 1 }, id: 1, name: 'Ann' },
      { id: 2, name: 'Bob' },
      { meta: { id: 3 }, id: 3, name: 'Cid' },
    ];
    server.config.rowId = row => row.meta.id;
    server.config.onRowsUpdate.mockImplementation((rows) => {
      rows.forEach(({ id, changes }) => {
        Object.assign(server.records.find(record => record.meta?.id === id), changes);
      });

      return Promise.resolve();
    });
    await createGrid(server);
    await saveFirstEdit();

    server.gate('Bob 2');
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();
    await server.releaseFetches();
    await server.answer('Bob 2');

    expect(hot.getDataAtCol(1)).toEqual(['Ann 2', 'Bob', 'Cid']);
    expect(server.savedNames()).toEqual([[1, 'Ann 2']]);
    expect(logError).not.toHaveBeenCalledWith('Data reload failed:', expect.anything());

    logError.mockRestore();
  });

  it('should write an edit again when its validator writes a correction after the load', async() => {
    const server = createServer();
    let correct = null;

    await createGrid(server, {
      validator(value, callback) {
        if (value !== 'bob 2') {
          callback(true);

          return;
        }

        const answer = () => {
          hot.setDataAtCell(this.visualRow, this.visualCol, 'Bob 2', 'nameValidator');
          callback(true);
        };

        if (correct === null) {
          correct = answer;
        } else {
          answer();
        }
      },
    });
    await saveFirstEdit();

    hot.setDataAtCell(1, 1, 'bob 2', 'edit');
    await settle();
    await server.releaseFetches();
    correct();
    await settle();
    await server.releaseFetches();

    expect(server.savedNames()).toEqual([[1, 'Ann 2'], [2, 'bob 2']]);
  });

  it('should not read row ids for later edits once every waiting set has settled', async() => {
    const server = createServer();

    server.verdicts.set('rejected', false);
    await createGrid(server, { allowInvalid: false });

    hot.setDataAtCell(1, 1, 'rejected', 'edit');
    await settle();
    await saveFirstEdit();
    await server.releaseFetches();

    const readRowId = jest.spyOn(hot, 'getRowIdAtPhysicalRow');

    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');

    expect(readRowId).not.toHaveBeenCalled();

    await settle();
    await server.releaseFetches();

    expect(hot.getDataAtCell(1, 1)).toBe('Bob 2');
  });

  it('should save an edit the refetch of a removal dropped', async() => {
    const server = createServer();

    await createGrid(server);

    server.gate('Bob 2');
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();

    const remove = hot.getPlugin('dataProvider').removeRows([3]);

    await settle();
    server.records.splice(2, 1);
    await server.releaseFetches();
    await remove;

    expect(hot.getDataAtCol(1)).toEqual(['Ann', 'Bob']);

    await server.answer('Bob 2');

    expect(hot.getDataAtCol(1)).toEqual(['Ann', 'Bob 2']);
    expect(server.savedNames()).toEqual([[2, 'Bob 2']]);
  });

  it('should not open an editor for a rejected value written from code', async() => {
    const server = createServer();

    await createGrid(server, { allowInvalid: false });
    await saveFirstEdit();

    server.gate('Bob 2');
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();
    await server.releaseFetches();
    await server.answer('Bob 2', false);

    expect(hot.getActiveEditor()?.isOpened() ?? false).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe('Bob');
  });

  it('should not open the editor again when the user selected another cell in the meantime', async() => {
    const server = createServer();

    await createGrid(server, { allowInvalid: false });
    await saveFirstEdit();

    server.gate('Bob 2');
    confirmInEditor(1, 1, 'Bob 2');
    await settle();
    await server.releaseFetches();
    hot.selectCell(2, 0);
    await server.answer('Bob 2', false);

    expect(hot.getActiveEditor()?.isOpened() ?? false).toBe(false);
    expect(hot.getSelectedLast()).toEqual([2, 0, 2, 0]);
  });

  it('should not overwrite a newer edit of the same cell made after the load, whichever answers first', async() => {
    const server = createServer();

    await createGrid(server);
    await saveFirstEdit();

    server.gate('Bob 2');
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();
    await server.releaseFetches();
    server.gate('Bob 3');
    hot.setDataAtCell(1, 1, 'Bob 3', 'edit');
    await settle();
    await server.answer('Bob 2');
    await server.answer('Bob 3');
    await server.releaseFetches();

    expect(hot.getDataAtCell(1, 1)).toBe('Bob 3');
    expect(server.savedNames()).toEqual([[1, 'Ann 2'], [2, 'Bob 3']]);
  });

  it('should leave the edit dropped when a fetch that does not follow a save loads before the answer', async() => {
    const server = createServer();

    await createGrid(server);
    await saveFirstEdit();

    server.gate('Bob 2');
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();
    await server.releaseFetches();

    const fetch = hot.getPlugin('dataProvider').fetchData({ page: 1 });

    await settle();
    await server.releaseFetches();
    await fetch;
    await server.answer('Bob 2');

    expect(hot.getDataAtCell(1, 1)).toBe('Bob');
    expect(server.savedNames()).toEqual([[1, 'Ann 2']]);
  });

  it('should leave the edit dropped when the application loads data before the answer', async() => {
    const server = createServer();

    await createGrid(server);
    await saveFirstEdit();

    server.gate('Bob 2');
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();
    await server.releaseFetches();
    hot.loadData([{ id: 1, name: 'Ann' }, { id: 2, name: 'Bob' }]);
    await server.answer('Bob 2');

    expect(hot.getDataAtCell(1, 1)).toBe('Bob');
    expect(server.savedNames()).toEqual([[1, 'Ann 2']]);
  });

  it('should leave the edit dropped when the plugin is disabled before the answer', async() => {
    const server = createServer();

    await createGrid(server);
    await saveFirstEdit();

    server.gate('Bob 2');
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();
    await server.releaseFetches();
    hot.updateSettings({ dataProvider: false });
    await server.answer('Bob 2');

    expect(hot.getDataAtCell(1, 1)).toBe('Bob');
    expect(server.savedNames()).toEqual([[1, 'Ann 2']]);
  });

  it('should do nothing when the grid is destroyed before the answer', async() => {
    const server = createServer();

    await createGrid(server);
    await saveFirstEdit();

    server.gate('Bob 2');
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();
    await server.releaseFetches();
    hot.destroy();

    await expect(server.answer('Bob 2')).resolves.toBeUndefined();
    expect(server.savedNames()).toEqual([[1, 'Ann 2']]);
  });

  it('should resolve a save once its refetch is loaded, while an edit still waits for its validator', async() => {
    const server = createServer();

    await createGrid(server);

    server.gate('Bob 2');
    hot.setDataAtCell(1, 1, 'Bob 2', 'edit');
    await settle();

    const save = hot.getPlugin('dataProvider').updateRows([{ id: 3, changes: { name: 'Cid 2' } }]);
    let rowsWhenSettled = null;

    save.then(() => {
      rowsWhenSettled = hot.getDataAtCol(1);
    });
    await settle();
    await server.releaseFetches();

    expect(rowsWhenSettled).toEqual(['Ann', 'Bob', 'Cid 2']);

    await server.answer('Bob 2');
    await server.releaseFetches();

    expect(hot.getDataAtCol(1)).toEqual(['Ann', 'Bob 2', 'Cid 2']);
    expect(server.savedNames()).toEqual([[3, 'Cid 2'], [2, 'Bob 2']]);
  });
});
