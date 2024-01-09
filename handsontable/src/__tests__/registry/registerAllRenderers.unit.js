// eslint-disable-next-line no-unused-vars
import Handsontable from 'handsontable/base';
import { getRegisteredCellTypeNames } from '../../cellTypes/registry';
import { getRegisteredEditorNames } from '../../editors/registry';
import { getPluginsNames } from '../../plugins/registry';
import { getRegisteredRendererNames } from '../../renderers/registry';
import { getRegisteredValidatorNames } from '../../validators/registry';
import { registerAllRenderers } from '../../registry';

describe('`registerAllRenderers`', () => {
  it('should register all built-in renderers', () => {
    registerAllRenderers();

    expect(getRegisteredCellTypeNames()).toEqual([
      'text',
    ]);
    expect(getRegisteredEditorNames()).toEqual([
      'text',
    ]);
    expect(getPluginsNames()).toEqual([]);
    expect(getRegisteredRendererNames()).toEqual([
      'text',
      'autocomplete',
      'base',
      'checkbox',
      'dropdown',
      'handsontable',
      'html',
      'numeric',
      'password',
      'select',
      'time',
    ]);
    expect(getRegisteredValidatorNames()).toEqual([]);
  });
});
