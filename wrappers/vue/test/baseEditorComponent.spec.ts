import BaseEditorComponent from '../src/BaseEditorComponent.vue';
import Handsontable from 'handsontable';

describe('BaseEditorComponent', () => {
  it('should have all of the props that the Handsontable Base Editor assigns in its `prepare` method nulled', () => {
    const baseEditorComponentInstance = new BaseEditorComponent();

    expect(baseEditorComponentInstance.TD).toEqual(null);
    expect(baseEditorComponentInstance.row).toEqual(null);
    expect(baseEditorComponentInstance.col).toEqual(null);
    expect(baseEditorComponentInstance.prop).toEqual(null);
    expect(baseEditorComponentInstance.originalValue).toEqual(null);
    expect(baseEditorComponentInstance.cellProperties).toEqual(null);
    expect(baseEditorComponentInstance.state).toEqual(null);
  });

  it('should have all of the Base Editor\'s method defined', () => {
    const baseEditorComponentInstance = new BaseEditorComponent();

    Object.getOwnPropertyNames(Handsontable.editors.BaseEditor.prototype).forEach(propName => {
      // _hooksStorage is an internal container, not needed on the vue base editor
      if (propName === 'constructor' || propName === '_hooksStorage') {
        return;
      }

      expect(baseEditorComponentInstance[propName]).not.toEqual(void 0);
    });
  });
});
