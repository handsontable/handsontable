describe('Pagination `pageList` option', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  // TODO: add tests that checks UI when `pageList` is changed (maybe visual tests would be better)
});
