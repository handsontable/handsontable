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
});
