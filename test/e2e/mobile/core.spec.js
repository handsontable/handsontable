const id = 'testContainer';

describe('Core', () => {
  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should apply "mobile" class to the HOT root element', () => {
    const hot = handsontable({
      columns: [
        {
          type: 'text',
        }
      ]
    });

    const hasMobileClass = hot.rootElement.classList.contains('mobile');

    expect(hasMobileClass).toBeTruthy();
  });
});
