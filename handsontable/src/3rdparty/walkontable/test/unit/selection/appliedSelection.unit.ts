import {
  applySelection,
  buildSelectionSignature,
  clearAppliedSelection,
  expandLayeredClassNames,
  getAppliedSelection,
  removeAppliedSelection,
} from '../../../src/selection/appliedSelection';

describe('appliedSelection', () => {
  describe('expandLayeredClassNames', () => {
    it('should keep a single occurrence as the bare class name', () => {
      expect(expandLayeredClassNames(new Map([['area', 1]]))).toEqual(['area']);
    });

    it('should add one numbered class per extra layer', () => {
      expect(expandLayeredClassNames(new Map([['area', 3], ['current', 1]])))
        .toEqual(['area', 'area-1', 'area-2', 'current']);
    });
  });

  describe('buildSelectionSignature', () => {
    it('should encode class names and attributes into one comparable string', () => {
      expect(buildSelectionSignature(['area', 'current'], [['aria-selected', true]]))
        .toBe('area current|aria-selected=true');
      expect(buildSelectionSignature([], [])).toBe('|');
    });
  });

  describe('apply, read, remove', () => {
    it('should write the classes and attributes and record the signature', () => {
      const td = document.createElement('td');
      const signature = buildSelectionSignature(['area', 'current'], [['aria-selected', true]]);

      applySelection(td, ['area', 'current'], [['aria-selected', true]], signature);

      expect(td.className).toBe('area current');
      expect(td.getAttribute('aria-selected')).toBe('true');
      expect(getAppliedSelection(td)).toBe(signature);
    });

    it('should remove exactly what the signature recorded and keep foreign classes', () => {
      const td = document.createElement('td');

      const attributes: Array<[string, boolean]> = [['aria-selected', true]];

      td.className = 'htDimmed';
      applySelection(td, ['area'], attributes, buildSelectionSignature(['area'], attributes));
      removeAppliedSelection(td);

      expect(td.className).toBe('htDimmed');
      expect(td.hasAttribute('aria-selected')).toBe(false);
      expect(getAppliedSelection(td)).toBeUndefined();
    });

    it('should do nothing for an element that carries nothing', () => {
      const td = document.createElement('td');

      td.className = 'custom';
      removeAppliedSelection(td);

      expect(td.className).toBe('custom');
    });

    it('should forget the record without touching the DOM when cleared', () => {
      const td = document.createElement('td');

      applySelection(td, ['area'], [], buildSelectionSignature(['area'], []));
      clearAppliedSelection(td);

      expect(td.className).toBe('area');
      expect(getAppliedSelection(td)).toBeUndefined();
    });
  });
});
