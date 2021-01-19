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

describe('checkboxRenderer', () => {
  describe('registering', () => {
    it('should throw an error if renderer is not registered', () => {
      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer(RENDERER_TYPE);
      }).toThrowError();
    });

    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, checkboxRenderer);

      expect(getRegisteredRendererNames()).toEqual([RENDERER_TYPE]);
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

      checkboxRenderer(instance, TD, 0, 0, void 0, null, cellMeta);

      expect(TD.outerHTML).toBe([
        '<td><input class="htCheckboxRendererInput noValue" type="checkbox" ',
        'autocomplete="off" tabindex="-1" data-row="0" data-col="0"></td>'
      ].join(''));
    });

    it('should render checkbox with its coords as data-attr', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {};

      checkboxRenderer(instance, TD, 100, 50, void 0, null, cellMeta);

      expect(TD.outerHTML).toBe([
        '<td><input class="htCheckboxRendererInput noValue" type="checkbox" ',
        'autocomplete="off" tabindex="-1" data-row="100" data-col="50"></td>'
      ].join(''));
    });

    it('should hide checkbox if value cannot be matched to any template', () => {
      const TD = document.createElement('td');
      const instance = getInstance();
      const cellMeta = {};

      checkboxRenderer(instance, TD, 100, 50, void 0, 'yes', cellMeta);

      expect(TD.outerHTML).toBe([
        '<td><input class="htCheckboxRendererInput htBadValue" type="checkbox" autocomplete="off" ',
        'tabindex="-1" style="display: none;" data-row="100" data-col="50">#bad-value#</td>'
      ].join(''));
    });
  });
});
