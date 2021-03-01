describe('settings', () => {
  describe('trimWhitespace', () => {
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

    it('should trim whitespaces from the beginning and the end of the cell when trimWhitespace options is true', () => {
      handsontable({
        trimWhitespace: true,
        data: [
          ['    text    with    spaces  ']
        ],
      });

      const innerTextOfCell = getCell(0, 0).innerText;

      expect(innerTextOfCell).toEqual('text    with    spaces');
    });

    it('should preserve whitespaces when trimWhitespace options is false', () => {
      handsontable({
        trimWhitespace: false,
        data: [
          ['    text    with    spaces  ']
        ],
      });

      const innerTextOfCell = getCell(0, 0).innerText;

      expect(innerTextOfCell).toEqual('    text    with    spaces  ');
    });
  });
});
