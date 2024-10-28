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

  describe('beforeRefreshDimensions', () => {
    it('should be fired after root element size change', async() => {
      const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');

      const hot = handsontable({
        width: 120,
        height: 100,
        beforeRefreshDimensions,
      });

      await sleep(50);
      hot.rootElement.style.width = '200px';

      expect(beforeRefreshDimensions.calls.count()).toBe(1);
    });

    it('should be possible to block dimensions refresh after returning `false`', async() => {
      const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');
      const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');

      beforeRefreshDimensions.and.callFake(() => false);

      const hot = handsontable({
        width: 120,
        height: 100,
        beforeRefreshDimensions,
        afterRefreshDimensions,
      });

      hot.rootElement.style.width = '200px';

      await sleep(50);

      expect(beforeRefreshDimensions.calls.count()).toBe(1);
      expect(afterRefreshDimensions.calls.count()).toBe(0);
    });

    it('should be fired with proper arguments (when root element is size changed)', async() => {
      const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');

      const hot = handsontable({
        width: 120,
        height: 100,
        beforeRefreshDimensions,
      });

      hot.rootElement.style.width = '200px';
      await sleep(50);

      expect(beforeRefreshDimensions).toHaveBeenCalledWith(
        { width: 120, height: 100 },
        { width: 200, height: 100 },
        true,
      );
    });

    it('should be fired with proper arguments (when root element size does not changed)', async() => {
      const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');

      const hot = handsontable({
        width: 120,
        height: 100,
        beforeRefreshDimensions,
      });

      hot.rootElement.style.width = '120px';
      await sleep(50);

      expect(beforeRefreshDimensions).toHaveBeenCalledWith(
        { width: 120, height: 100 },
        { width: 120, height: 100 },
        false,
      );
    });

    it('should not be fired when the table\'s root element is hidden', async() => {
      const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');
      const hot = handsontable({
        width: 120,
        height: 100,
        beforeRefreshDimensions,
      });

      hot.rootElement.style.display = 'none';
      await sleep(50);

      expect(beforeRefreshDimensions).not.toHaveBeenCalled();
    });

    it('should not be fired when the document body element is hidden', async() => {
      const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');

      handsontable({
        width: 120,
        height: 100,
        beforeRefreshDimensions,
      });

      document.body.style.display = 'none';
      await sleep(50);

      expect(beforeRefreshDimensions).not.toHaveBeenCalled();

      document.body.style.display = '';
    });

    it('should be synced with `requestAnimationFrame` call', async() => {
      const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');

      spyOn(window, 'requestAnimationFrame');

      const hot = handsontable({
        width: 120,
        height: 100,
        beforeRefreshDimensions,
      });

      await sleep(50);
      hot.rootElement.style.width = '200px';

      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
      expect(beforeRefreshDimensions.calls.count()).toBe(0);
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
        const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');

        spec().$iframeContainer.handsontable({
          beforeRefreshDimensions,
        });

        spec().$iframe[0].style.width = '50px';

        await sleep(300);

        expect(beforeRefreshDimensions.calls.count()).toBe(1);
      });

      it('should be possible to block dimensions refresh after returning `false`', async() => {
        const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');
        const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');

        beforeRefreshDimensions.and.callFake(() => false);

        spec().$iframeContainer.handsontable({
          beforeRefreshDimensions,
          afterRefreshDimensions,
        });

        spec().$iframe[0].style.width = '50px';

        await sleep(300);

        expect(beforeRefreshDimensions.calls.count()).toBe(1);
        expect(afterRefreshDimensions.calls.count()).toBe(0);
      });

      it('should be fired with proper arguments (when window size changed)', async() => {
        const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');

        spec().$iframeContainer.handsontable({
          beforeRefreshDimensions,
        });

        spec().$iframe[0].style.width = '50px';

        await sleep(500);

        expect(beforeRefreshDimensions).toHaveBeenCalledWith(
          { width: 469, height: 0 },
          { width: 19, height: 116 },
          true,
        );
      });

      it('should be fired with proper arguments (when window size does not changed)', async() => {
        const beforeRefreshDimensions = jasmine.createSpy('beforeRefreshDimensions');

        spec().$iframeContainer.handsontable({
          beforeRefreshDimensions,
          width: 300,
          height: 300,
        });

        spec().$iframe[0].style.width = '50px';

        await sleep(500);

        expect(beforeRefreshDimensions).toHaveBeenCalledWith(
          { width: 300, height: 300 },
          { width: 300, height: 300 },
          false,
        );
      });
    });
  });
});
