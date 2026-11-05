import { registerPlugin, UndoRedo } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';
import { setUpUndoGrid } from './grid';

registerAllCellTypes();
registerPlugin(UndoRedo);

/**
 * After an undo or a redo the plugin validates the cells it restored. It validates the value the cell
 * stores, the same value an edit validates. A cell type's `valueGetter` turns that value into the text
 * the cell shows (a key/value entry into its label, a multiselect array into a joined string), and the
 * validators of those types check the stored form, so validating the shown text marked a valid cell
 * invalid after every undo and redo.
 */
describe('UndoRedo validation of restored cells', () => {
  const { create } = setUpUndoGrid();
  const KEY_VALUE_SOURCE = [{ key: 'a', value: 'Alpha' }, { key: 'b', value: 'Beta' }];

  /**
   * Resolves once the next validation of cell (0, 0) has answered, with the `valid` flag it left.
   *
   * @param {Handsontable} hot The grid.
   * @param {Function} action The call that starts the validation.
   * @returns {Promise<boolean | undefined>}
   */
  function validityAfter(hot, action) {
    return new Promise((resolve) => {
      hot.addHookOnce('postAfterValidate', () => {
        // The validator writes `valid` right after this hook; read it a task later.
        setTimeout(() => resolve(hot.getCellMeta(0, 0).valid), 0);
      });
      action();
    });
  }

  const CASES = [
    {
      name: 'a key/value entry in a strict autocomplete column',
      settings: {
        data: [[{ key: 'a', value: 'Alpha' }]],
        columns: [{ type: 'autocomplete', source: KEY_VALUE_SOURCE, strict: true }],
      },
      edit: { key: 'b', value: 'Beta' },
    },
    {
      name: 'a key/value entry in a dropdown column',
      settings: {
        data: [[{ key: 'a', value: 'Alpha' }]],
        columns: [{ type: 'dropdown', source: KEY_VALUE_SOURCE }],
      },
      edit: { key: 'b', value: 'Beta' },
    },
    {
      name: 'a multiselect value',
      settings: {
        data: [[['Alpha']]],
        columns: [{ type: 'multiselect', source: ['Alpha', 'Beta'] }],
      },
      edit: ['Beta'],
    },
  ];

  CASES.forEach(({ name, settings, edit }) => {
    it(`keeps ${name} valid after an undo and a redo`, async() => {
      const hot = create(settings);
      const undoRedo = hot.getPlugin('undoRedo');

      await expect(validityAfter(hot, () => hot.setDataAtCell(0, 0, edit))).resolves.toBe(true);
      await expect(validityAfter(hot, () => undoRedo.undo())).resolves.toBe(true);
      await expect(validityAfter(hot, () => undoRedo.redo())).resolves.toBe(true);
    });
  });

  it('still marks a restored value the strict source does not hold as invalid', async() => {
    const hot = create({
      data: [[{ key: 'z', value: 'Zeta' }]],
      columns: [{ type: 'autocomplete', source: KEY_VALUE_SOURCE, strict: true }],
    });
    const undoRedo = hot.getPlugin('undoRedo');

    await validityAfter(hot, () => hot.setDataAtCell(0, 0, { key: 'a', value: 'Alpha' }));

    await expect(validityAfter(hot, () => undoRedo.undo())).resolves.toBe(false);
  });
});
