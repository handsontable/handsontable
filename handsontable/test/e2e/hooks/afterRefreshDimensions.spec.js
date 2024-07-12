describe('Hook', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('afterRefreshDimensions', () => {
    it('should be fired after root element size change', async() => {
      const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');
      const hot = handsontable({
        width: 120,
        height: 100,
        afterRefreshDimensions,
      });

      await sleep(50);
      hot.rootElement.style.width = '200px';

      expect(afterRefreshDimensions.calls.count()).toBe(1);
    });

    it('should be fired with proper arguments (when root element size is changed)', async() => {
      const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');
      const hot = handsontable({
        width: 120,
        height: 100,
        afterRefreshDimensions,
      });

      hot.rootElement.style.width = '200px';
      await sleep(50);

      expect(afterRefreshDimensions).toHaveBeenCalledWith(
        { width: 120, height: 100 },
        { width: 200, height: 100 },
        true,
      );
    });

    it('should be fired with proper arguments (when root element size does not changed)', async() => {
      const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');
      const hot = handsontable({
        width: 120,
        height: 100,
        afterRefreshDimensions,
      });

      hot.rootElement.style.width = '120px';
      await sleep(50);

      expect(afterRefreshDimensions).toHaveBeenCalledWith(
        { width: 120, height: 100 },
        { width: 120, height: 100 },
        false,
      );
    });

    it('should not be fired when the table\'s root element is hidden', async() => {
      const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');
      const hot = handsontable({
        width: 120,
        height: 100,
        afterRefreshDimensions,
      });

      hot.rootElement.style.display = 'none';
      await sleep(50);

      expect(afterRefreshDimensions).not.toHaveBeenCalled();
    });

    it('should not be fired when the document body element is hidden', async() => {
      const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');

      handsontable({
        width: 120,
        height: 100,
        afterRefreshDimensions,
      });

      document.body.style.display = 'none';
      await sleep(50);

      expect(afterRefreshDimensions).not.toHaveBeenCalled();

      document.body.style.display = '';
    });

    it('should be synced with `requestAnimationFrame` call', async() => {
      const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');

      spyOn(window, 'requestAnimationFrame');

      const hot = handsontable({
        width: 120,
        height: 100,
        afterRefreshDimensions,
      });

      await sleep(50);
      hot.rootElement.style.width = '200px';

      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
      expect(afterRefreshDimensions.calls.count()).toBe(0);
    });

    it('should not be stuck in an infinite loop when the parent container is sized with dynamic units (`dvh`) and' +
      ' additional elements were added to the parent container - it should break the cycle and display an' +
      ' appropriate warning message', async() => {
      spyOn(console, 'warn');
      const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');
      const $parentContainer = $('<div id="parentContainer"></div>').appendTo('body');

      spec().$container.detach().appendTo($parentContainer);
      $parentContainer
        .css('width', '100%')
        .css('min-height', '100dvh')
        .css('overflow', 'hidden')
        .append('<div id="additionalElement">Test</div>');

      handsontable({
        data: [[1, 2], [3, 4]],
        afterRefreshDimensions,
      });

      await sleep(2000);

      expect(afterRefreshDimensions).toHaveBeenCalledTimes(100);
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        'The ResizeObserver callback was fired too many times in direct succession.' +
        '\nThis may be due to an infinite loop caused by setting a dynamic height/width (for example, ' +
        'with the `dvh` units) to a Handsontable container\'s parent. ' +
        '\nThe observer will be disconnected.'
      );

      destroy();
      $parentContainer.remove();
    });

    describe('running in iframe', () => {
      beforeEach(function() {
        this.$iframe = $('<iframe width="500px" height="60px"/>').appendTo(this.$container);

        const doc = this.$iframe[0].contentDocument;

        doc.open('text/html', 'replace');
        doc.write(`
          <!doctype html>
          <head>
            <link type="text/css" rel="stylesheet" href="../dist/handsontable.css">
          </head>`);
        doc.close();

        this.$iframeContainer = $('<div/>').appendTo(doc.body);
      });

      afterEach(function() {
        this.$iframeContainer.handsontable('destroy');
        this.$iframe.remove();
      });

      it('should be fired after window resize', async() => {
        const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');

        spec().$iframeContainer.handsontable({
          afterRefreshDimensions,
        });

        spec().$iframe[0].style.width = '50px';

        await sleep(300);

        expect(afterRefreshDimensions.calls.count()).toBe(1);
      });

      it('should be fired with proper arguments (when window size is changed)', async() => {
        const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');

        spec().$iframeContainer.handsontable({
          afterRefreshDimensions,
        });

        spec().$iframe[0].style.width = '50px';

        await sleep(300);

        expect(afterRefreshDimensions).toHaveBeenCalledWith(
          { width: 469, height: 0 },
          { width: 19, height: 116 },
          true,
        );
      });

      it('should be fired with proper arguments (when window size does not changed)', async() => {
        const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');

        spec().$iframeContainer.handsontable({
          afterRefreshDimensions,
          width: 300,
          height: 300,
        });

        spec().$iframe[0].style.width = '50px';

        await sleep(300);

        expect(afterRefreshDimensions).toHaveBeenCalledWith(
          { width: 300, height: 300 },
          { width: 300, height: 300 },
          false,
        );
      });
    });
  });
});
