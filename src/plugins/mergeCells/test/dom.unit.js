import DOMManipulation from '../dom/domManipulation';

describe('MergeCells: DOM manipulation', () => {
  describe('applySpanProperties', () => {
    it('should apply the rowspan/colspan properties to the provided DOM element', () => {
      const instance = new DOMManipulation({});
      const TDmock = document.createElement('TD');
      const collectionInfoMock = {
        row: 0,
        col: 0,
        rowspan: 3,
        colspan: 3
      };

      instance.applySpanProperties(TDmock, collectionInfoMock, 0, 0);

      expect(TDmock.getAttribute('rowspan')).toEqual('3');
      expect(TDmock.getAttribute('colspan')).toEqual('3');
    });

    it('should hide the TD element, if it\'s the hidden part of a merged collection', () => {
      const instance = new DOMManipulation({});
      const TDmock = document.createElement('TD');
      const collectionInfoMock = {
        row: 0,
        col: 0,
        rowspan: 3,
        colspan: 3
      };

      instance.applySpanProperties(TDmock, collectionInfoMock, 1, 1);

      expect(TDmock.getAttribute('rowspan')).toEqual(null);
      expect(TDmock.getAttribute('colspan')).toEqual(null);
      expect(TDmock.style.display).toEqual('none');
    });

    it('should remove the colspan/rowspan attributes, as well as make visible the TD, if the collection info object isn\'t defined', () => {
      const instance = new DOMManipulation({});
      const TDmock = document.createElement('TD');

      TDmock.setAttribute('rowspan', '3');
      TDmock.setAttribute('colspan', '3');
      TDmock.style.display = 'none';

      instance.applySpanProperties(TDmock, null, 1, 1);

      expect(TDmock.getAttribute('rowspan')).toEqual(null);
      expect(TDmock.getAttribute('colspan')).toEqual(null);
      expect(TDmock.style.display).toEqual('');
    });
  });
});
