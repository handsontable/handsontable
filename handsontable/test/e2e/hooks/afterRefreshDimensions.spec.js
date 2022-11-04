describe('Hook', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
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
    if (this.$iframe) {
      this.$iframeContainer.handsontable('destroy');
      this.$iframe.remove();
    }

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('afterRefreshDimensions', () => {
    it('should be fired after window resize', async() => {
      const afterRefreshDimensions = jasmine.createSpy('afterRefreshDimensions');

      spec().$iframeContainer.handsontable({
        afterRefreshDimensions,
      });

      spec().$iframe[0].style.width = '50px';

      await sleep(300);

      expect(afterRefreshDimensions.calls.count()).toBe(1);
    });

    it('should be called with proper arguments (when window size changed)', async() => {
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

    it('should be called with proper arguments (when window size does not changed)', async() => {
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
