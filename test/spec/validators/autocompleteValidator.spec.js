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
    it('should validate empty cells positively (by default)', function(done) {
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

      setTimeout(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(true, '', 0, 0, undefined, undefined);
        done();
      }, 100);
    });

    it('should validate empty cells positively when allowEmpty is set to true', function(done) {
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

      setTimeout(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(true, '', 0, 0, undefined, undefined);
        done();
      }, 100);
    });

    it('should validate empty cells negatively when allowEmpty is set to false', function(done) {
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

      setTimeout(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, '', 0, 0, undefined, undefined);
        done();
      }, 100);
    });

    it('should respect the allowEmpty property for a single column', function(done) {
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

      setTimeout(function () {
        expect(onAfterValidate.calls.argsFor(0)).toEqual([true, '', 0, 0, undefined, undefined]);
        expect(onAfterValidate.calls.argsFor(1)).toEqual([false, '', 0, 1, undefined, undefined]);
        expect(onAfterValidate.calls.argsFor(2)).toEqual([true, '', 0, 2, undefined, undefined]);
        done();
      }, 100);
    });

    it('should work for null and undefined values in cells', function(done) {
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

      setTimeout(function () {
        expect(onAfterValidate.calls.argsFor(0)).toEqual([false, null, 0, 0, undefined, undefined]);
        expect(onAfterValidate.calls.argsFor(1)).toEqual([false, void 0, 0, 1, undefined, undefined]);
        expect(onAfterValidate.calls.argsFor(2)).toEqual([false, '', 0, 2, undefined, undefined]);
        done();
      }, 100);
    });
  });
  describe('strict mode', function() {
    it('sshould validate negatively when chars have different size', function(done) {
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
          }
        ],
        afterValidate : onAfterValidate
      });

      setDataAtCell(0, 0, 'Some');

      setTimeout(function () {
        expect(onAfterValidate).toHaveBeenCalledWith(false, 'Some', 0, 0, undefined, undefined);
        done();
      }, 100);
    });
  });
});
