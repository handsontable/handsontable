import Handsontable from 'handsontable/base';
import {
  registerCellType,
  CheckboxCellType,
  DropdownCellType,
  NumericCellType,
  PasswordCellType,
  TextCellType,
} from 'handsontable/cellTypes';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

registerCellType(CheckboxCellType);
registerCellType(DropdownCellType);
registerCellType(NumericCellType);
registerCellType(PasswordCellType);
registerCellType(TextCellType);

describe('Core#updateSettings with a grid-level `type`', () => {
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
      data: [['a', 'b'], ['c', 'd']],
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot;
  }

  /**
   * Reads the three type-owned options of a cell.
   *
   * @param {object} instance The Handsontable instance.
   * @returns {object}
   */
  function read(instance) {
    const { editor, renderer, validator } = instance.getCellMeta(0, 0);

    return { editor, renderer, validator };
  }

  /**
   * Builds the expected triple for a cell type.
   *
   * @param {object} cellType The cell type object.
   * @param cellType.editor
   * @param cellType.renderer
   * @param cellType.validator
   * @returns {object}
   */
  function triple({ editor, renderer, validator }) {
    return { editor, renderer, validator };
  }

  it('should apply the editor, renderer and validator of the new type', () => {
    build({ type: 'dropdown' });

    expect(read(hot)).toEqual(triple(DropdownCellType));

    hot.updateSettings({ type: 'checkbox' });

    expect(read(hot)).toEqual(triple(CheckboxCellType));
    expect(hot.getSettings().type).toBe('checkbox');
  });

  it('should apply the type to a grid created without one', () => {
    build();

    hot.updateSettings({ type: 'dropdown' });

    expect(read(hot)).toEqual(triple(DropdownCellType));
  });

  it('should leave the grid as one created with the new type', () => {
    build({ type: 'dropdown' });
    hot.updateSettings({ type: 'checkbox' });

    const created = new Handsontable(document.createElement('div'), {
      data: [['a']],
      licenseKey: TEST_LICENSE_KEY,
      type: 'checkbox',
    });

    try {
      ['editor', 'renderer', 'validator', 'strict', 'filter', 'textEllipsis', 'valueGetter', 'valueSetter',
        'parsePastedValue'].forEach((key) => {
        expect(hot.getCellMeta(0, 0)[key]).toBe(created.getCellMeta(0, 0)[key]);
      });
      expect(hot.getCellMeta(0, 0).textEllipsis).toBe(false);
    } finally {
      created.destroy();
    }
  });

  it('should switch back to the first type', () => {
    build({ type: 'dropdown' });

    hot.updateSettings({ type: 'checkbox' });
    hot.updateSettings({ type: 'dropdown' });

    expect(read(hot)).toEqual(triple(DropdownCellType));
    expect(hot.getCellMeta(0, 0).strict).toBe(true);
  });

  it('should keep a grid-level option set earlier over the new type', () => {
    const renderer = () => {};

    build({ renderer });

    hot.updateSettings({ type: 'checkbox' });

    const { editor, renderer: appliedRenderer, validator } = read(hot);

    expect(appliedRenderer).toBe(renderer);
    expect(editor).toBe(CheckboxCellType.editor);
    expect(validator).toBe(CheckboxCellType.validator);
  });

  it('should keep a grid-level editor set in an earlier update over the new type', () => {
    build();

    hot.updateSettings({ editor: PasswordCellType.editor });
    hot.updateSettings({ type: 'checkbox' });

    expect(read(hot).editor).toBe(PasswordCellType.editor);
    expect(read(hot).renderer).toBe(CheckboxCellType.renderer);
  });

  it('should keep a grid-level option passed in the same call over the new type', () => {
    const renderer = () => {};

    build({ type: 'dropdown' });

    hot.updateSettings({ type: 'checkbox', renderer });

    expect(read(hot).renderer).toBe(renderer);
    expect(read(hot).editor).toBe(CheckboxCellType.editor);
  });

  it('should not touch a column that declares its own type', () => {
    build({
      type: 'dropdown',
      columns: [{ type: 'numeric' }, {}],
    });

    hot.updateSettings({ type: 'checkbox' });

    expect(hot.getCellMeta(0, 0).editor).toBe(NumericCellType.editor);
    expect(hot.getCellMeta(0, 1).editor).toBe(CheckboxCellType.editor);
  });

  it('should treat `editor: undefined` as unset and apply the type editor again', () => {
    build({ type: 'checkbox' });

    hot.updateSettings({ editor: PasswordCellType.editor });

    expect(read(hot).editor).toBe(PasswordCellType.editor);

    hot.updateSettings({ editor: undefined });

    expect(read(hot).editor).toBe(CheckboxCellType.editor);
  });

  it('should leave a user option alone when the same type is restated', () => {
    const renderer = () => {};

    build({ type: 'checkbox', renderer });

    hot.updateSettings({ type: 'checkbox' });
    hot.updateSettings({ type: 'checkbox' });

    expect(read(hot).renderer).toBe(renderer);
    expect(read(hot).editor).toBe(CheckboxCellType.editor);
  });

  it('should apply the type editor for `editor: true` even under a grid-level `editor: false`', () => {
    build({ editor: false });

    hot.updateSettings({ type: 'checkbox', editor: true });

    expect(read(hot).editor).toBe(CheckboxCellType.editor);
  });

  it('should keep editing disabled by `editor: false` when the type changes', () => {
    build({ editor: false });

    hot.updateSettings({ type: 'checkbox' });

    expect(read(hot).editor).toBe(false);
    expect(read(hot).renderer).toBe(CheckboxCellType.renderer);
  });

  it('should not change anything for an update without `type`', () => {
    build({ type: 'dropdown' });

    hot.updateSettings({ colHeaders: true });

    expect(read(hot)).toEqual(triple(DropdownCellType));
  });

  it('should keep a type-owned option the user set over a type change', () => {
    build({ type: 'dropdown', strict: false });

    hot.updateSettings({ type: 'checkbox' });

    expect(hot.getCellMeta(0, 0).strict).toBe(false);
    expect(read(hot)).toEqual(triple(CheckboxCellType));
  });

  it('should apply the type when `editor: undefined` comes in the same payload', () => {
    build({ type: 'dropdown' });

    hot.updateSettings({ type: 'checkbox', editor: undefined });

    expect(read(hot)).toEqual(triple(CheckboxCellType));
  });

  it('should keep a key created as `undefined` set when an update restates `undefined`', () => {
    build({ type: 'checkbox', editor: undefined });

    expect(read(hot).editor).toBeUndefined();

    hot.updateSettings({ editor: PasswordCellType.editor });
    hot.updateSettings({ type: 'checkbox', editor: undefined });

    expect(read(hot).editor).toBeUndefined();
    expect(read(hot).renderer).toBe(CheckboxCellType.renderer);
  });

  it('should restore a type key the same payload unsets', () => {
    build({ type: 'dropdown' });
    hot.updateSettings({ type: 'checkbox', filter: undefined });

    const created = new Handsontable(document.createElement('div'), {
      data: [['a']],
      licenseKey: TEST_LICENSE_KEY,
      type: 'checkbox',
    });

    try {
      expect(hot.getCellMeta(0, 0).filter).toBe(created.getCellMeta(0, 0).filter);
    } finally {
      created.destroy();
    }
  });

  it('should leave an earlier editor alone when `editor: true` comes with an unregistered type', () => {
    build({ type: 'dropdown', editor: PasswordCellType.editor });

    hot.updateSettings({ type: 'notRegisteredType', editor: true });

    expect(hot.getSettings().type).toBe('dropdown');
    expect(read(hot).editor).toBe(PasswordCellType.editor);

    hot.updateSettings({ type: 'checkbox' });

    expect(read(hot).editor).toBe(PasswordCellType.editor);
    expect(read(hot).renderer).toBe(CheckboxCellType.renderer);
  });

  it('should apply a type given as an object and drop its keys when the type changes', () => {
    const renderer = () => {};
    const customType = { editor: PasswordCellType.editor, renderer, marker: 'custom' };

    build();
    hot.updateSettings({ type: customType });

    expect(read(hot).editor).toBe(PasswordCellType.editor);
    expect(read(hot).renderer).toBe(renderer);
    expect(hot.getCellMeta(0, 0).marker).toBe('custom');

    hot.updateSettings({ type: 'checkbox' });

    expect(read(hot)).toEqual(triple(CheckboxCellType));
    expect(hot.getCellMeta(0, 0).marker).toBeUndefined();
  });

  it('should ignore a type name no cell type is registered under and keep updating', () => {
    build({ type: 'dropdown' });

    expect(() => hot.updateSettings({ type: 'notRegisteredType', colHeaders: true })).not.toThrow();
    expect(hot.getSettings().colHeaders).toBe(true);
    expect(hot.getSettings().type).toBe('dropdown');
    expect(read(hot)).toEqual(triple(DropdownCellType));
    expect(() => hot.updateSettings({ editor: undefined })).not.toThrow();
    expect(() => hot.updateSettings({ type: 'checkbox' })).not.toThrow();
    expect(read(hot)).toEqual(triple(CheckboxCellType));
  });

  it('should keep a user option over the type when a registered hook is in the payload', () => {
    const renderer = () => {};

    build({ renderer });

    hot.updateSettings({ type: 'checkbox', afterChange() {} });

    expect(read(hot).renderer).toBe(renderer);
  });
});
