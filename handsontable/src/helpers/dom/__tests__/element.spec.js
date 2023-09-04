describe('DOM helpers', () => {
  describe('observeVisibilityChangeOnce', () => {
    it('should recognize when an element becomes visible (once) and trigger the provided callback when that happens', async() => {
      const observeVisibilityChangeOnce = Handsontable.dom.observeVisibilityChangeOnce;
      const element = document.createElement('div');
      const callbackSpy = jasmine.createSpy('callbackSpy');

      element.style.display = 'none';

      document.body.appendChild(element);

      observeVisibilityChangeOnce(element, callbackSpy);

      element.style.display = 'block';
      element.style.display = 'none';
      element.style.display = 'block';

      await sleep(100);

      expect(callbackSpy).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });
  });

  describe('offset', () => {
    it('should return correct offset for elements inside a foreign object', () => {
      const wrapper = document.createElement('div');

      wrapper.innerHTML = /* html */`
        <svg xmlns="http://www.w3.org/2000/svg">
          <foreignObject width="50" height="50">
            <div xmlns="http://www.w3.org/1999/xhtml">test</div>
          </foreignObject>
        </svg>
      `;

      document.body.appendChild(wrapper);

      const element = wrapper.querySelector('div');
      const elementOffset = Handsontable.dom.offset(element);

      expect(Number.isFinite(elementOffset.top)).toBe(true);
      expect(Number.isFinite(elementOffset.left)).toBe(true);

      document.body.removeChild(wrapper);
    });
  });
});
