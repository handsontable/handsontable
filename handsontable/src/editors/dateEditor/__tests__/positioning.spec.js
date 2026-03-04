describe('DateEditor', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  // all other E2E tests are moved to visual tests. See ./visual-tests/tests/js-only/editors/date/
});
