// eslint-disable-next-line no-unused-vars
import Handsontable from 'handsontable/base';
import { getRegisteredCellTypeNames } from '../../cellTypes/registry';
import { getRegisteredEditorNames } from '../../editors/registry';
import { getPluginsNames } from '../../plugins/registry';
import { getRegisteredRendererNames } from '../../renderers/registry';
import { getRegisteredValidatorNames } from '../../validators/registry';
import { registerAllCellTypes } from '../../registry';

describe('`registerAllCellTypes`', () => {
  it('should register all built-in cell types', () => {
    registerAllCellTypes();

    expect(getRegisteredCellTypeNames()).toEqual([
      'text',
      'autocomplete',
      'checkbox',
      'date',
      'dropdown',
      'handsontable',
      'numeric',
      'password',
      'select',
      'time',
    ]);
    expect(getRegisteredEditorNames()).toEqual([
      'text',
      'autocomplete',
      'checkbox',
      'date',
      'dropdown',
      'handsontable',
      'numeric',
      'password',
      'select',
      'time',
    ]);
    expect(getPluginsNames()).toEqual([]);
    expect(getRegisteredRendererNames()).toEqual([
      'text',
      'autocomplete',
      'checkbox',
      'date',
      'dropdown',
      'handsontable',
      'numeric',
      'password',
      'select',
      'time',
    ]);
    expect(getRegisteredValidatorNames()).toEqual([
      'autocomplete',
      'date',
      'dropdown',
      'numeric',
      'time',
    ]);
  });
});
