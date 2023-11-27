import Core from 'handsontable/core';
import {
  RENDERER_TYPE,
  checkboxRenderer,
} from '..';
import {
  getRegisteredRendererNames,
  getRenderer,
  registerRenderer,
} from '../../registry';
import {
  registerCellType,
  TextCellType,
} from '../../../cellTypes';

registerCellType(TextCellType);

describe('checkboxRenderer', () => {
  const toMatchHTMLConfig = ['class', 'noValue', 'type', 'autocomplete', 'tabindex', 'data-row', 'data-col', 'style'];

  describe('registering', () => {
    it('should throw an error if renderer is not registered', () => {
      expect(getRegisteredRendererNames()).toEqual(['text']);
      expect(() => {
        getRenderer(RENDERER_TYPE);
      }).toThrowError();
    });

    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, checkboxRenderer);

      expect(getRegisteredRendererNames()).toEqual(['text', RENDERER_TYPE]);
      expect(getRenderer(RENDERER_TYPE)).toBeInstanceOf(Function);
    });
  });

  describe('rendering', () => {
    function getInstance() {
      return new Core(document.createElement('div'), {});
    }

    it('should render checkbox with a proper classname if value is null', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {};

      checkboxRenderer(instance, TD, 0, 0, undefined, null, cellMeta);

      expect(TD.outerHTML).toMatchHTML([
        '<td><input class="htCheckboxRendererInput noValue" type="checkbox" ',
        'tabindex="-1" data-row="0" data-col="0"></td>'
      ].join(''), toMatchHTMLConfig);
    });

    it('should render checkbox with its coords as data-attr', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {};

      checkboxRenderer(instance, TD, 100, 50, undefined, null, cellMeta);

      expect(TD.outerHTML).toMatchHTML([
        '<td><input class="htCheckboxRendererInput noValue" type="checkbox" ',
        'tabindex="-1" data-row="100" data-col="50"></td>'
      ].join(''), toMatchHTMLConfig);
    });

    it('should hide checkbox if value cannot be matched to any template', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {};

      checkboxRenderer(instance, TD, 100, 50, undefined, 'yes', cellMeta);

      expect(TD.outerHTML).toMatchHTML([
        '<td><input class="htCheckboxRendererInput htBadValue" type="checkbox" ',
        'tabindex="-1" style="display: none;" data-row="100" data-col="50">#bad-value#</td>'
      ].join(''), toMatchHTMLConfig);
    });
  });
});
