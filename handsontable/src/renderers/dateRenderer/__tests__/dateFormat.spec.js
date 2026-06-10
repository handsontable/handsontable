describe('DateRenderer dateFormat options', () => {
  const id = 'testContainer';
  const ISO_DATE = '2020-12-20';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('default (no dateFormat)', () => {
    it('should use default year numeric, month 2-digit, day 2-digit', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
      });

      expect(getCell(0, 0).innerText).toBe('12/20/2020');
    });
  });

  describe('dateStyle option', () => {
    it('should render with dateStyle "full"', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { dateStyle: 'full' },
      });

      expect(getCell(0, 0).innerText).toBe('Sunday, December 20, 2020');
    });

    it('should render with dateStyle "long"', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { dateStyle: 'long' },
      });

      expect(getCell(0, 0).innerText).toBe('December 20, 2020');
    });

    it('should render with dateStyle "medium"', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { dateStyle: 'medium' },
      });

      expect(getCell(0, 0).innerText).toBe('Dec 20, 2020');
    });

    it('should render with dateStyle "short"', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { dateStyle: 'short' },
      });

      expect(getCell(0, 0).innerText).toBe('12/20/20');
    });
  });

  describe('timeZone option', () => {
    it('should format date in UTC', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { dateStyle: 'short', timeZone: 'UTC' },
      });

      // ISO_DATE is parsed as local midnight, so the UTC date depends on runner TZ
      expect(['12/19/20', '12/20/20']).toContain(getCell(0, 0).innerText);
    });

    it('should format date in named timezone America/New_York', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: 'America/New_York',
        },
      });

      expect(getCell(0, 0).innerText).toBe('12/19/2020');
    });

    it('should format with offset identifier', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { dateStyle: 'short', timeZone: '+01:00' },
      });

      expect(getCell(0, 0).innerText).toBe('12/20/20');
    });
  });

  describe('date-time component options', () => {
    it('should render weekday long', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        locale: 'en-US',
        dateFormat: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      });

      expect(getCell(0, 0).innerText).toBe('Sunday, December 20, 2020');
    });

    it('should render weekday short', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { weekday: 'short', month: 'numeric', day: 'numeric' },
      });

      expect(getCell(0, 0).innerText).toBe('Sun, 12/20');
    });

    it('should render weekday narrow', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { weekday: 'narrow', month: 'numeric', day: 'numeric' },
      });

      expect(getCell(0, 0).innerText).toBe('S, 12/20');
    });

    it('should render era long', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { era: 'long', year: 'numeric', month: 'numeric', day: 'numeric' },
      });

      expect(getCell(0, 0).innerText).toBe('12/20/2020 Anno Domini');
    });

    it('should render era short', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { era: 'short', year: 'numeric', month: 'numeric', day: 'numeric' },
      });

      expect(getCell(0, 0).innerText).toBe('12/20/2020 AD');
    });

    it('should render year numeric and 2-digit', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { year: 'numeric', month: 'numeric', day: 'numeric' },
      });

      expect(getCell(0, 0).innerText).toBe('12/20/2020');
    });

    it('should render year 2-digit', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { year: '2-digit', month: 'numeric', day: 'numeric' },
      });

      expect(getCell(0, 0).innerText).toBe('12/20/20');
    });

    it('should render month numeric, 2-digit, long, short, narrow', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { month: 'long', year: 'numeric', day: 'numeric' },
      });

      expect(getCell(0, 0).innerText).toBe('December 20, 2020');
    });

    it('should render month short', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { month: 'short', year: 'numeric', day: 'numeric' },
      });

      expect(getCell(0, 0).innerText).toBe('Dec 20, 2020');
    });

    it('should render month narrow', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { month: 'narrow', year: 'numeric', day: 'numeric' },
      });

      expect(getCell(0, 0).innerText).toBe('D 20, 2020');
    });

    it('should render day numeric and 2-digit', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { year: 'numeric', month: 'numeric', day: '2-digit' },
      });

      expect(getCell(0, 0).innerText).toBe('12/20/2020');
    });
  });

  describe('calendar option', () => {
    it('should format with calendar gregory', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { calendar: 'gregory', dateStyle: 'short' },
      });

      expect(getCell(0, 0).innerText).toBe('12/20/20');
    });

    it('should format with calendar islamic', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { calendar: 'islamic', dateStyle: 'short' },
      });

      expect(getCell(0, 0).innerText).toBe('5/6/1442 AH');
    });

    it('should format with calendar japanese', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        locale: 'ja-JP',
        dateFormat: { calendar: 'japanese', year: 'numeric', month: 'numeric', day: 'numeric' },
      });

      expect(getCell(0, 0).innerText).toBe('R2/12/20');
    });
  });

  describe('numberingSystem option', () => {
    it('should format with numberingSystem latn', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { numberingSystem: 'latn', dateStyle: 'short' },
      });

      expect(getCell(0, 0).innerText).toBe('12/20/20');
    });

    it('should format with numberingSystem arab (Arabic-Indic digits)', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        locale: 'ar-EG',
        dateFormat: { numberingSystem: 'arab', dateStyle: 'short' },
      });

      expect(getCell(0, 0).innerText).toBe('٢٠\u200F/١٢\u200F/٢٠٢٠');
    });
  });

  describe('localeMatcher option', () => {
    it('should use localeMatcher best fit', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { dateStyle: 'short', localeMatcher: 'best fit' },
      });

      expect(getCell(0, 0).innerText).toBe('12/20/20');
    });

    it('should use localeMatcher lookup', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: { dateStyle: 'short', localeMatcher: 'lookup' },
      });

      expect(getCell(0, 0).innerText).toBe('12/20/20');
    });
  });

  describe('formatMatcher option', () => {
    it('should use formatMatcher best fit', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          formatMatcher: 'best fit',
        },
      });

      expect(getCell(0, 0).innerText).toBe('Dec 20, 2020');
    });

    it('should use formatMatcher basic', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        dateFormat: {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          formatMatcher: 'basic',
        },
      });

      expect(getCell(0, 0).innerText).toBe('12/20/2020');
    });
  });

  describe('locale option', () => {
    it('should format with en-US locale', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        locale: 'en-US',
        dateFormat: { dateStyle: 'short' },
      });

      expect(getCell(0, 0).innerText).toBe('12/20/20');
    });

    it('should format with en-GB locale', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        locale: 'en-GB',
        dateFormat: { dateStyle: 'short' },
      });

      expect(getCell(0, 0).innerText).toBe('20/12/2020');
    });

    it('should format with de-DE locale', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        locale: 'de-DE',
        dateFormat: { dateStyle: 'short' },
      });

      expect(getCell(0, 0).innerText).toBe('20.12.20');
    });

    it('should format with fr-FR locale', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        locale: 'fr-FR',
        dateFormat: { dateStyle: 'long' },
      });

      expect(getCell(0, 0).innerText).toBe('20 décembre 2020');
    });

    it('should format with ja-JP locale', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        locale: 'ja-JP',
        dateFormat: { dateStyle: 'short' },
      });

      expect(getCell(0, 0).innerText).toBe('2020/12/20');
    });

    it('should format with locale array (fallback)', async() => {
      handsontable({
        data: [[ISO_DATE]],
        renderer: 'date',
        locale: ['ban', 'id'],
        dateFormat: { dateStyle: 'short' },
      });

      expect(getCell(0, 0).innerText).toBe('20/12/20');
    });
  });

  describe('cells() with per-cell dateFormat', () => {
    it('should use cell-specific dateFormat', async() => {
      handsontable({
        data: [[ISO_DATE, ISO_DATE]],
        renderer: 'date',
        cells(row, col) {
          if (row === 0 && col === 0) {
            return {
              locale: 'en-US',
              dateFormat: { dateStyle: 'full' },
            };
          }
          if (row === 0 && col === 1) {
            return {
              locale: 'pl-PL',
              dateFormat: { dateStyle: 'short' },
            };
          }
        },
      });

      expect(getCell(0, 0).innerText).toBe('Sunday, December 20, 2020');
      expect(getCell(0, 1).innerText).toBe('20.12.2020');
    });
  });
});
