const id = 'testContainer';

describe('Focusing', () => {
  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('#rootWrapper');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });
});
