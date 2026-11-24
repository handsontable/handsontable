import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

describe('Formulas: a NestedRows detach keeps the source formulas in step', () => {
  let container;
  let hot;
  let data;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  const build = () => {
    data = [
      { a: 1, b: 2, __children: [{ a: 2, b: 6 }] },
      { a: 3, b: '=A3*2' },
      { a: 4, b: '=A4*2' },
    ];
    hot = new Handsontable(container, {
      data,
      columns: [{ data: 'a' }, { data: 'b' }],
      nestedRows: true,
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      licenseKey: TEST_LICENSE_KEY,
    });
  };

  const detachFirstChild = () => {
    const { dataManager } = hot.getPlugin('nestedRows');

    dataManager.detachFromParent(dataManager.getDataObject(1));
  };

  const rawSourceData = () => JSON.parse(JSON.stringify(data));

  const engineSheet = () => {
    const { engine, sheetId } = hot.getPlugin('formulas');

    return engine.getSheetSerialized(sheetId);
  };

  it('writes the formulas the detach rewrote into the source data', async() => {
    build();
    detachFirstChild();

    expect(hot.getData()).toEqual([[1, 2], [3, 6], [4, 8], [2, 6]]);
    expect(rawSourceData()).toEqual([
      { a: 1, b: 2, __children: [] },
      { a: 3, b: '=A2*2' },
      { a: 4, b: '=A3*2' },
      { a: 2, b: 6 },
    ]);
  });

  it('keeps the values on a settings update after the detach', async() => {
    build();
    detachFirstChild();
    hot.updateSettings({});

    expect(hot.getData()).toEqual([[1, 2], [3, 6], [4, 8], [2, 6]]);
    expect(engineSheet()).toEqual([[1, 2], [3, '=A2*2'], [4, '=A3*2'], [2, 6]]);
  });

  it('undoes the detach and its formula text in one step', async() => {
    build();
    detachFirstChild();

    const undoRedo = hot.getPlugin('undoRedo');

    expect(undoRedo.doneActions.length).toBe(1);

    undoRedo.undo();

    expect(hot.getData()).toEqual([[1, 2], [2, 6], [3, 6], [4, 8]]);
    expect(rawSourceData()).toEqual([
      { a: 1, b: 2, __children: [{ a: 2, b: 6 }] },
      { a: 3, b: '=A3*2' },
      { a: 4, b: '=A4*2' },
    ]);
    expect(engineSheet()).toEqual([[1, 2], [2, 6], [3, '=A3*2'], [4, '=A4*2']]);
  });

  it('redoes the detach with the values the detach showed', async() => {
    build();
    detachFirstChild();

    const undoRedo = hot.getPlugin('undoRedo');

    undoRedo.undo();
    undoRedo.redo();

    expect(hot.getData()).toEqual([[1, 2], [3, 6], [4, 8], [2, 6]]);
    expect(rawSourceData()).toEqual([
      { a: 1, b: 2, __children: [] },
      { a: 3, b: '=A2*2' },
      { a: 4, b: '=A3*2' },
      { a: 2, b: 6 },
    ]);
    expect(engineSheet()).toEqual([[1, 2], [3, '=A2*2'], [4, '=A3*2'], [2, 6]]);
  });

  it('keeps the values over repeated undo and redo cycles', async() => {
    build();
    detachFirstChild();

    const undoRedo = hot.getPlugin('undoRedo');

    for (let cycle = 0; cycle < 3; cycle++) {
      undoRedo.undo();

      expect(hot.getData()).toEqual([[1, 2], [2, 6], [3, 6], [4, 8]]);

      undoRedo.redo();

      expect(hot.getData()).toEqual([[1, 2], [3, 6], [4, 8], [2, 6]]);
    }
  });
});
