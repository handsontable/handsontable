describe('manualColumnMove (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('moving by drag', () => {
    describe('should position the cells properly', () => {
      it('when the second column is dropped before the left side of first column', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 10),
          colHeaders: true,
          manualColumnMove: true
        });

        const $columnHeaders = spec().$container.find('thead tr th');

        $columnHeaders.eq(1)
          .simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');
        $columnHeaders.eq(0)
          .simulate('mouseover')
          .simulate('mousemove', {
            clientX: $columnHeaders.eq(0).offset().left + $columnHeaders.eq(0).width()
          })
          .simulate('mouseup');

        expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');
      });

      it('when the second column is dropped before the fourth column', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 10),
          colHeaders: true,
          manualColumnMove: true
        });

        const $columnHeaders = spec().$container.find('thead tr th');

        $columnHeaders.eq(1)
          .simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');
        $columnHeaders.eq(3)
          .simulate('mouseover')
          .simulate('mousemove', {
            clientX: $columnHeaders.eq(3).offset().left + $columnHeaders.eq(3).width()
          })
          .simulate('mouseup');

        expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('B1');
      });

      it('when the first column is dropped after the last column', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 10),
          colHeaders: true,
          manualColumnMove: true
        });

        const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(0)');
        const $lastHeader = spec().$container.find('thead tr:eq(0) th:eq(9)');

        $firstHeader
          .simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');

        $lastHeader
          .simulate('mouseover')
          .simulate('mousemove', {
            clientX: $lastHeader.offset().left
          })
          .simulate('mouseup');

        expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(9)').text()).toEqual('A1');
      });

      it('when the last column is dropped before the first column', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 10),
          colHeaders: true,
          manualColumnMove: true
        });

        const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(0)');
        const $lastHeader = spec().$container.find('thead tr:eq(0) th:eq(9)');

        $lastHeader
          .simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');

        $firstHeader
          .simulate('mouseover')
          .simulate('mousemove', {
            clientX: $firstHeader.offset().left + $firstHeader.width()
          })
          .simulate('mouseup');

        expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('J1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(9)').text()).toEqual('I1');
      });

      it('when multiple columns are dragged from the left to the right', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 10),
          colHeaders: true,
          manualColumnMove: true
        });

        const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(0)');
        const $fourthHeader = spec().$container.find('thead tr:eq(0) th:eq(4)');

        selectColumns(0, 2);

        $firstHeader
          .simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');

        $fourthHeader
          .simulate('mouseover')
          .simulate('mousemove', {
            clientX: $fourthHeader.offset().left + $fourthHeader.width()
          })
          .simulate('mouseup');

        expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('D1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('B1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('C1');
      });

      it('when multiple columns are dragged from the right to the left', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 10),
          colHeaders: true,
          manualColumnMove: true
        });

        const $fourthHeader = spec().$container.find('thead tr:eq(0) th:eq(3)');
        const $secondHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');

        selectColumns(3, 5);

        $fourthHeader
          .simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');

        $secondHeader
          .simulate('mouseover')
          .simulate('mousemove', {
            clientX: $secondHeader.offset().left + $secondHeader.width()
          })
          .simulate('mouseup');

        expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('D1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('E1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('F1');
        expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('B1');
      });
    });
  });
});
