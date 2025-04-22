describe('settings', () => {
  describe('copyable', () => {
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

    it('by default, CTRL+C should NOT copy the password value', () => {
      handsontable({
        data: [
          ['Joe', 'Secret', 'Jack']
        ],
        columns: [
          {},
          {
            type: 'password'
          },
          {}
        ]
      });

      expect(getCopyableText(0, 0, 0, 2)).toMatch('Joe\t\tJack');
    });

    it('with copyable=true, CTRL+C should copy the password value', () => {
      handsontable({
        data: [
          ['Joe', 'Secret', 'Jack']
        ],
        columns: [
          {},
          {
            type: 'password',
            copyable: true
          },
          {}
        ]
      });

      expect(getCopyableText(0, 0, 0, 2)).toMatch('Joe\tSecret\tJack');
    });

    it('with copyable=false, CTRL+C should NOT copy the password value', () => {
      handsontable({
        data: [
          ['Joe', 'Secret', 'Jack']
        ],
        columns: [
          {},
          {
            type: 'password',
            copyable: false
          },
          {}
        ]
      });

      expect(getCopyableText(0, 0, 0, 2)).toMatch('Joe\t\tJack');
    });
  });
});
