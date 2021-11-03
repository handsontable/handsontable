// eslint-disable-next-line no-unused-vars
import Handsontable from 'handsontable/base';
import { getRegisteredCellTypeNames } from '../../cellTypes/registry';
import { getRegisteredEditorNames } from '../../editors/registry';
import { getPluginsNames } from '../../plugins/registry';
import { getRegisteredRendererNames } from '../../renderers/registry';
import { getRegisteredValidatorNames } from '../../validators/registry';
import { registerAllEditors } from '../../registry';

describe('`registerAllEditors`', () => {
  it('should register all built-in editors', () => {
    registerAllEditors();

    expect(getRegisteredCellTypeNames()).toEqual([
      'text',
    ]);
    expect(getRegisteredEditorNames()).toEqual([
      'text',
      'base',
      'autocomplete',
      'checkbox',
      'date',
      'dropdown',
      'handsontable',
      'numeric',
      'password',
      'select',
    ]);
    expect(getPluginsNames()).toEqual([]);
    expect(getRegisteredRendererNames()).toEqual([
      'text',
    ]);
    expect(getRegisteredValidatorNames()).toEqual([]);
  });
});
