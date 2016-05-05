describe('autocompleteValidator', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('allowEmpty', function() {
    it('should validate empty cells positively (by default)', function() {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var hot = handsontable({
        data: [
          ['some', 'sample', 'data'],
        ],
        columns: [
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          }
        ],
        afterValidate : onAfterValidate
      });

      setDataAtCell(0, 0, '');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(true, '', 0, 0, undefined, undefined);
      });

    });

    it('should validate empty cells positively when allowEmpty is set to true', function() {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var hot = handsontable({
        data: [
          ['some', 'sample', 'data'],
        ],
        columns: [
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          }
        ],
        allowEmpty: true,
        afterValidate : onAfterValidate
      });

      setDataAtCell(0, 0, '');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(true, '', 0, 0, undefined, undefined);
      });
    });

    it('should validate empty cells negatively when allowEmpty is set to false', function() {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var hot = handsontable({
        data: [
          ['some', 'sample', 'data'],
        ],
        columns: [
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          }
        ],
        allowEmpty: false,
        afterValidate : onAfterValidate
      });

      setDataAtCell(0, 0, '');

      waitsFor(function () {
        return onAfterValidate.calls.length > 0;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, '', 0, 0, undefined, undefined);
      });
    });

    it('should respect the allowEmpty property for a single column', function() {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var hot = handsontable({
        data: [
          ['some', 'sample', 'data']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true,
            allowEmpty: false
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          }
        ],
        afterValidate : onAfterValidate
      });

      setDataAtCell(0, 0, '');
      setDataAtCell(0, 1, '');
      setDataAtCell(0, 2, '');

      waitsFor(function () {
        return onAfterValidate.calls.length > 2;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate.calls[0].args).toEqual([true, '', 0, 0, undefined, undefined]);
        expect(onAfterValidate.calls[1].args).toEqual([false, '', 0, 1, undefined, undefined]);
        expect(onAfterValidate.calls[2].args).toEqual([true, '', 0, 2, undefined, undefined]);
      });

    });

    it('should work for null and undefined values in cells', function() {
      var onAfterValidate = jasmine.createSpy('onAfterValidate');
      var hot = handsontable({
        data: [
          ['some', 'sample', 'data']
        ],
        columns: [
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true,
          },
          {
            type: 'autocomplete',
            source: ['some', 'sample', 'data'],
            strict: true
          }
        ],
        allowEmpty: false,
        afterValidate : onAfterValidate
      });

      setDataAtCell(0, 0, null);
      setDataAtCell(0, 1, void 0);
      setDataAtCell(0, 2, '');

      waitsFor(function () {
        return onAfterValidate.calls.length > 2;
      }, 'Cell validation', 1000);

      runs(function () {
        expect(onAfterValidate.calls[0].args).toEqual([false, null, 0, 0, undefined, undefined]);
        expect(onAfterValidate.calls[1].args).toEqual([false, void 0, 0, 1, undefined, undefined]);
        expect(onAfterValidate.calls[2].args).toEqual([false, '', 0, 2, undefined, undefined]);
      });

    });

  });
});
