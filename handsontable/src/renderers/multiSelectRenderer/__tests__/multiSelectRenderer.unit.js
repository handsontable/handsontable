import {
  RENDERER_TYPE,
  multiSelectRenderer,
} from '../';
import {
  getRegisteredRendererNames,
  getRenderer,
  registerRenderer,
} from '../../registry';
import {
  registerCellType,
  MultiSelectCellType,
} from '../../../cellTypes';

registerCellType(MultiSelectCellType);

describe('multiSelectRenderer', () => {
  describe('registering', () => {
    it('should register renderer', () => {
      registerRenderer(RENDERER_TYPE, multiSelectRenderer);

      expect(getRegisteredRendererNames()).toEqual([RENDERER_TYPE]);
      expect(getRenderer(RENDERER_TYPE)).toBeInstanceOf(Function);
    });
  });
});
