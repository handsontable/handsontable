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

      await sleep(20);
      hot.rootElement.style.width = '200px';

      expect(afterRefreshDimensions.calls.count()).toBe(1);
    });

    it('should be fired with proper arguments (when root element is size changed)', async() => {
      const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');

      const hot = handsontable({
        width: 120,
        height: 100,
        afterRefreshDimensions,
      });

      hot.rootElement.style.width = '200px';
      await sleep(20);

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
      await sleep(20);

      expect(afterRefreshDimensions).toHaveBeenCalledWith(
        { width: 120, height: 100 },
        { width: 120, height: 100 },
        false,
      );
    });

    describe('running in iframe', () => {
      beforeEach(function() {
        this.$iframe = $('<iframe width="500px" height="60px"/>').appendTo(this.$container);

        const doc = this.$iframe[0].contentDocument;

        doc.open('text/html', 'replace');
        doc.write(`
          <!doctype html>
          <head>
            <link type="text/css" rel="stylesheet" href="../dist/handsontable.full.min.css">
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
