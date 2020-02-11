describe('dateValidator', () => {
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

  const arrayOfObjects = function() {
    return [
      { date: '01/01/2015', name: 'Ted', lastName: 'Right' },
      { date: '01/01/15', name: 'Frank', lastName: 'Honest' },
      { date: '41/01/2015', name: 'Joan', lastName: 'Well' },
      { date: '01/51/2015', name: 'Sid', lastName: 'Strong' }
    ];
  };

  it('should validate an empty string (default behavior)', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, '');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(true, '', 0, 'date', undefined, undefined);
      done();
    }, 100);
  });

  it('should rewrite an ISO 8601 string to the correct format if a date-string in different format is provided', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date', dateFormat: 'MM/DD/YYYY', correctFormat: true },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '2016-03-18');
    await sleep(200);

    expect(onAfterValidate).toHaveBeenCalledWith(true, '2016-03-18', 1, 'date', undefined, undefined);
    expect(getDataAtCell(1, 0)).toEqual('03/18/2016');
  });

  it('should not positively validate a non-date string', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, 'wat');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(false, 'wat', 0, 'date', undefined, undefined);
      done();
    }, 100);
  });

  it('should not positively validate a non-date string and rewrite to the correct format when `allowInvalid` is false', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date', dateFormat: 'MM/DD/YYYY', correctFormat: true, allowInvalid: false },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, '01/01/2015 ops');
    await sleep(200);

    expect(onAfterValidate).toHaveBeenCalledWith(false, '01/01/2015 ops', 0, 'date', undefined, undefined);
    expect(getDataAtCell(0, 0)).toEqual('01/01/2015');
  });

  it('should not positively validate a incorrect date string', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(0, 0, '33/01/2014');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(false, '33/01/2014', 0, 'date', undefined, undefined);
      done();
    }, 100);
  });

  it('should not positively validate a date string in wrong format', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '01/01/15');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(false, '01/01/15', 1, 'date', undefined, undefined);
      done();
    }, 100);
  });

  it('should not positively validate a date string in wrong format (if custom format is provided)', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date', dateFormat: 'DD/MM/YY' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '01/01/2015');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(false, '01/01/2015', 1, 'date', undefined, undefined);
      done();
    }, 100);
  });

  it('should positively validate a date string in correct format', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '01/01/2015');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(true, '01/01/2015', 1, 'date', undefined, undefined);
      done();
    }, 100);
  });

  it('should positively validate a date string in correct format (if custom format is provided)', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'date', type: 'date', dateFormat: 'DD/MM/YY' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      afterValidate: onAfterValidate
    });

    setDataAtCell(1, 0, '23/03/15');

    setTimeout(() => {
      expect(onAfterValidate).toHaveBeenCalledWith(true, '23/03/15', 1, 'date', undefined, undefined);
      done();
    }, 100);
  });

  describe('allowEmpty', () => {
    it('should not validate an empty string when allowEmpty is set as `false`', (done) => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'DD/MM/YY', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '');

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalledWith(false, '', 1, 'date', undefined, undefined);
        done();
      }, 100);
    });

    it('should not validate `null` when allowEmpty is set as `false`', (done) => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'DD/MM/YY', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, null);

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalledWith(false, null, 1, 'date', undefined, undefined);
        done();
      }, 100);
    });

    it('should not validate `undefined` when allowEmpty is set as `false`', (done) => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'DD/MM/YY', allowEmpty: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, void 0);

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalledWith(false, void 0, 1, 'date', undefined, undefined);
        done();
      }, 100);
    });
  });

  describe('correctFormat', () => {
    it('should not make any changes to entered string if correctFormat is not set', (done) => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'MM/DD/YY' },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '11/23/2013');

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalledWith(false, '11/23/2013', 1, 'date', undefined, undefined);
        done();
      }, 100);
    });

    it('should not make any changes to entered string if correctFormat is set to false', (done) => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'MM/DD/YY', correctFormat: false },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '11/23/2013');

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalledWith(false, '11/23/2013', 1, 'date', undefined, undefined);
        done();
      }, 100);
    });

    it('should rewrite the string to the correct format if a date-string in different format is provided', (done) => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'MM/DD/YYYY', correctFormat: true },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '1/10/15');

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalledWith(true, '1/10/15', 1, 'date', undefined, undefined);
      }, 100);

      setTimeout(() => {
        expect(getDataAtCell(1, 0)).toEqual('01/10/2015');
        done();
      }, 130);
    });

    xit('should rewrite the string to the correct format if a date-string in different format is provided (for non-default format)', (done) => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'DD.MM.YYYY', correctFormat: true },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, '5.3.2016');

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalledWith(true, '5.3.2016', 1, 'date', undefined, undefined);
      }, 100);

      setTimeout(() => {
        expect(getDataAtCell(1, 0)).toEqual('05.03.2016');
        done();
      }, 130);
    }).pend('Re-enable after fixing #6085');

    it('should not try to correct format of non-date strings', (done) => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: arrayOfObjects(),
        columns: [
          { data: 'date', type: 'date', dateFormat: 'DD/MM/YY', correctFormat: true },
          { data: 'name' },
          { data: 'lastName' }
        ],
        afterValidate: onAfterValidate
      });

      setDataAtCell(1, 0, 'test non-date string');

      setTimeout(() => {
        expect(onAfterValidate).toHaveBeenCalledWith(false, 'test non-date string', 1, 'date', undefined, undefined);
        done();
      }, 100);
    });
  });
});
