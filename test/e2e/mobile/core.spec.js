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

  it('should apply "mobile" class to the HOT container', () => {
    const hot = handsontable({
      columns: [
        {
          type: 'text',
        }
      ]
    });

    const hasMobileClass = hot.container.classList.value.includes('mobile');

    expect(hasMobileClass).toBeTruthy();
  });

});
