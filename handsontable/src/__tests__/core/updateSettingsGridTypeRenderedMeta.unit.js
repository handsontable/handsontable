import Handsontable from 'handsontable/base';
import {
  registerCellType,
  CheckboxCellType,
  DropdownCellType,
  NumericCellType,
  TextCellType,
} from 'handsontable/cellTypes';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

registerCellType(CheckboxCellType);
registerCellType(DropdownCellType);
registerCellType(NumericCellType);
registerCellType(TextCellType);

describe('Core#updateSettings with a grid-level `type` on cells that were already drawn', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a grid with the given settings.
   *
   * @param {object} settings Extra settings.
   * @returns {object} The Handsontable instance.
   */
  function build(settings = {}) {
    hot = new Handsontable(container, {
      data: [[1, 2], [3, 4]],
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  it('should drop the numeric renderer class of a drawn cell when the type changes to text', () => {
    build({ type: 'numeric' });

    expect(hot.getCell(0, 0).className).toContain('htNumeric');
    expect(hot.getCell(0, 0).className).toContain('htRight');

    hot.updateSettings({ type: 'text' });

    expect(hot.getCell(0, 0).className).not.toContain('htNumeric');
    expect(hot.getCell(0, 0).className).not.toContain('htRight');
    expect(hot.getCellMeta(0, 0).className).toBeUndefined();
  });

  it('should drop the checkbox templates stored on a drawn cell when the type changes to text', () => {
    build({ type: 'checkbox', data: [[true, false], [false, true]] });

    expect(hot.getCellMeta(0, 0).checkedTemplate).toBe(true);

    hot.updateSettings({ type: 'text' });

    expect(hot.getCell(0, 0).querySelector('input[type="checkbox"]')).toBeNull();
    expect(hot.getCellMeta(0, 0).checkedTemplate).toBeUndefined();
    expect(hot.getCellMeta(0, 0).uncheckedTemplate).toBeUndefined();
  });

  it('should keep every drawn cell free of the numeric classes through numeric, text and dropdown', () => {
    build({ type: 'numeric', source: ['1', '2'] });

    hot.updateSettings({ type: 'text' });

    expect(hot.getCell(0, 0).className).not.toContain('htRight');

    hot.updateSettings({ type: 'dropdown' });

    expect(hot.getCell(0, 0).className).not.toContain('htRight');
    expect(hot.getCell(0, 0).className).not.toContain('htNumeric');
  });

  it('should keep a class set through `setCellMeta()` when the type changes', () => {
    build({ type: 'numeric' });
    hot.setCellMeta(1, 1, 'className', 'myMarker');
    hot.render();

    hot.updateSettings({ type: 'text' });

    expect(hot.getCell(1, 1).className).toContain('myMarker');
  });

  it('should not clear the cell meta cache when the same type is restated', () => {
    build({ type: 'numeric' });

    const meta = hot.getCellMeta(0, 0);

    meta.directMarker = 'kept';

    hot.updateSettings({ type: 'numeric' });

    expect(hot.getCellMeta(0, 0).directMarker).toBe('kept');
    expect(hot.getCell(0, 0).className).toContain('htNumeric');
  });

  it('should clear the cell meta cache when the type changes', () => {
    build({ type: 'numeric' });

    hot.getCellMeta(0, 0).directMarker = 'dropped';

    hot.updateSettings({ type: 'text' });

    expect(hot.getCellMeta(0, 0).directMarker).toBeUndefined();
  });

  it('should not clear the cell meta cache when an unknown type name is passed', () => {
    build({ type: 'numeric' });

    hot.getCellMeta(0, 0).directMarker = 'kept';

    hot.updateSettings({ type: 'bogus' });

    expect(hot.getCellMeta(0, 0).directMarker).toBe('kept');
  });

  it('should not clear the cell meta cache when an equal type object is restated', () => {
    const renderer = (instance, td, row, col, prop, value) => {
      td.textContent = value;
    };

    build({ type: { renderer } });

    hot.getCellMeta(0, 0).directMarker = 'kept';

    // A wrapper that writes the type inline sends a new object with the same members on every commit.
    hot.updateSettings({ type: { renderer } });

    expect(hot.getCellMeta(0, 0).directMarker).toBe('kept');

    hot.updateSettings({ type: { renderer: () => {} } });

    expect(hot.getCellMeta(0, 0).directMarker).toBeUndefined();
  });

  it('should keep the meta a `cell` entry declared and a `setCellMeta` value across a type change', () => {
    build({ type: 'numeric', cell: [{ row: 1, col: 1, comment: { value: 'note' } }] });
    hot.setCellMeta(0, 1, 'placeholder', 'type here');

    hot.updateSettings({ type: 'text' });

    expect(hot.getCellMeta(1, 1).comment).toEqual({ value: 'note' });
    expect(hot.getCellMeta(0, 1).placeholder).toBe('type here');
  });

  it('should apply the type of a payload that also carries `data`', () => {
    build({ type: 'numeric' });

    hot.updateSettings({ type: 'text', data: [['a', 'b'], ['c', 'd']] });

    expect(hot.getCell(0, 0).className).not.toContain('htRight');
    expect(hot.getCell(0, 0).className).not.toContain('htNumeric');
  });

  it('should drop the numeric classes of a payload that also carries `columns`', () => {
    build({ type: 'numeric' });

    hot.updateSettings({ type: 'text', columns: [{}, {}] });

    expect(hot.getCell(0, 0).className).not.toContain('htNumeric');
    expect(hot.getCell(1, 1).className).not.toContain('htNumeric');
  });
});
