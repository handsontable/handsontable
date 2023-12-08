// eslint-disable-next-line no-unused-vars
import Handsontable from 'handsontable/base';
import { HOT_PACKAGE_NAME, HOT_VERSION } from '../../../../hot.config.js';
import { getRegisteredCellTypeNames } from '../../cellTypes/registry';
import { getRegisteredEditorNames } from '../../editors/registry';
import { getPluginsNames } from '../../plugins/registry';
import { getRegisteredRendererNames } from '../../renderers/registry';
import { getRegisteredValidatorNames } from '../../validators/registry';

describe('`handsontable/base` entry point', () => {
  it('should by default contain only text cell meta module', () => {
    expect(getRegisteredCellTypeNames()).toEqual(['text']);
    expect(getRegisteredEditorNames()).toEqual(['text']);
    expect(getPluginsNames()).toEqual([]);
    expect(getRegisteredRendererNames()).toEqual(['text']);
    expect(getRegisteredValidatorNames()).toEqual([]);
  });

  it('should define package meta data properties', () => {
    expect(Handsontable.packageName).toBe(HOT_PACKAGE_NAME);
    expect(Handsontable.version).toBe(HOT_VERSION);
    expect(Handsontable.buildDate).toBeDefined();
  });

  it('should export some modules as static properties', () => {
    expect(Handsontable.Core).toBeDefined();
    expect(Handsontable.editors.BaseEditor).toBeDefined();
    expect(Handsontable.DefaultSettings).toBeDefined();
    expect(Handsontable.hooks).toBeDefined();
  });
});
