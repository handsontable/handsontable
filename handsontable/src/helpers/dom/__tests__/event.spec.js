describe('DOM helpers', () => {
  //
  // Handsontable.dom.offsetRelativeTo
  //
  describe('offsetRelativeTo', () => {
    it('should return offset directly from the event object', () => {
      const eventMock = {
        offsetX: 11,
        offsetY: 22,
        target: document.createElement('div'),
      };

      expect(Handsontable.dom.offsetRelativeTo(eventMock)).toEqual({
        x: 11,
        y: 22,
      });
    });

    it('should return offset directly from the event object when the "untilElement" is the same as event target', () => {
      const target = document.createElement('div');
      const eventMock = {
        offsetX: 11,
        offsetY: 22,
        target,
      };

      expect(Handsontable.dom.offsetRelativeTo(eventMock, target)).toEqual({
        x: 11,
        y: 22,
      });
    });

    it('should return offset directly from the event object when the "untilElement" is a child of the event target', () => {
      const target = document.createElement('div');
      const targetChild = document.createElement('div');

      target.appendChild(targetChild);

      const eventMock = {
        offsetX: 11,
        offsetY: 22,
        target,
      };

      expect(Handsontable.dom.offsetRelativeTo(eventMock, targetChild)).toEqual({
        x: 11,
        y: 22,
      });
    });

    it('should return offset calculated until hit the parent element', () => {
      const target = document.createElement('div');
      const parent = document.createElement('div');

      // center the target element in the parent element to create some offsets
      parent.style.position = 'relative';
      parent.style.width = '50px';
      parent.style.height = '50px';
      parent.style.display = 'flex';
      parent.style.alignItems = 'center';
      parent.style.justifyContent = 'center';

      target.innerText = 'x';
      target.style.width = '15px';
      target.style.height = '15px';

      parent.appendChild(target);
      document.body.appendChild(parent);

      const eventMock = {
        offsetX: 11,
        offsetY: 22,
        target,
      };

      expect(Handsontable.dom.offsetRelativeTo(eventMock, parent)).toEqual({
        x: 29,
        y: 40,
      });

      parent.remove();
    });
  });
});
