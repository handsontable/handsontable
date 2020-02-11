import { applySpanProperties } from '../utils';

describe('MergeCells: DOM manipulation', () => {
  describe('applySpanProperties', () => {
    it('should apply the rowspan/colspan properties to the provided DOM element', () => {
      const TDmock = document.createElement('TD');
      const mergedCellInfoMock = {
        row: 0,
        col: 0,
        rowspan: 3,
        colspan: 3
      };

      applySpanProperties(TDmock, mergedCellInfoMock, 0, 0);

      expect(TDmock.getAttribute('rowspan')).toEqual('3');
      expect(TDmock.getAttribute('colspan')).toEqual('3');
    });

    it('should hide the TD element, if it\'s the hidden part of a merged cell', () => {
      const TDmock = document.createElement('TD');
      const mergedCellInfoMock = {
        row: 0,
        col: 0,
        rowspan: 3,
        colspan: 3
      };

      applySpanProperties(TDmock, mergedCellInfoMock, 1, 1);

      expect(TDmock.getAttribute('rowspan')).toEqual(null);
      expect(TDmock.getAttribute('colspan')).toEqual(null);
      expect(TDmock.style.display).toEqual('none');
    });

    it('should remove the colspan/rowspan attributes, as well as make visible the TD, if the merged cell info object isn\'t defined', () => {
      const TDmock = document.createElement('TD');

      TDmock.setAttribute('rowspan', '3');
      TDmock.setAttribute('colspan', '3');
      TDmock.style.display = 'none';

      applySpanProperties(TDmock, null, 1, 1);

      expect(TDmock.getAttribute('rowspan')).toEqual(null);
      expect(TDmock.getAttribute('colspan')).toEqual(null);
      expect(TDmock.style.display).toEqual('');
    });
  });
});
