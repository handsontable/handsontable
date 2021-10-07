// eslint-disable-next-line no-unused-vars
import Handsontable from 'handsontable/base';
import { getRegisteredCellTypeNames } from '../cellTypes/registry';
import { getRegisteredEditorNames } from '../editors/registry';
import { getPluginsNames } from '../plugins/registry';
import { getRegisteredRendererNames } from '../renderers/registry';
import { getRegisteredValidatorNames } from '../validators/registry';

describe('`handsontable/base` entry point', () => {
  it('should by default contain only text cell meta module', () => {
    expect(getRegisteredCellTypeNames()).toEqual(['text']);
    expect(getRegisteredEditorNames()).toEqual(['text']);
    expect(getPluginsNames()).toEqual([]);
    expect(getRegisteredRendererNames()).toEqual(['text']);
    expect(getRegisteredValidatorNames()).toEqual([]);
  });
});
