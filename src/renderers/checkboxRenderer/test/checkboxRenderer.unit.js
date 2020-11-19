import Core from 'handsontable/core';
import {
  getRegisteredRendererNames,
  getRenderer,
} from '../../renderers';
import checkboxRenderer from '../index';

describe('checkboxRenderer', () => {
  describe('registering', () => {
    it('should auto-register renderer after import', () => {
      expect(getRegisteredRendererNames()).toEqual(['base', 'checkbox']);
      expect(getRenderer('checkbox')).toBeInstanceOf(Function);
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
