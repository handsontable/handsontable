import Handsontable from 'handsontable/base';
import BaseEditorComponent from '../src/BaseEditorComponent.vue';

describe('BaseEditorComponent', () => {
  it('should have all of the Base Editor\'s method defined', () => {
    Object.getOwnPropertyNames(Handsontable.editors.BaseEditor.prototype).forEach((propName) => {
      // _hooksStorage is an internal container, not needed on the vue base editor
      if (propName === 'constructor' || propName === '_hooksStorage') {
        return;
      }

      expect(BaseEditorComponent.methods[propName]).not.toBeUndefined();
    });
  });
});
