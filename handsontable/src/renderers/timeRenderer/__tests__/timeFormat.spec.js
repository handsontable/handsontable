describe('TimeRenderer timeFormat options', () => {
  const id = 'testContainer';
  const TIME_HH_MM = '14:30';
  const TIME_HH_MM_SS = '14:30:45';
  const TIME_HH_MM_SS_MS = '14:30:45.123';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('default (no timeFormat)', () => {
    it('should use default hour numeric, minute 2-digit', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
      });

      // en-US default is 12h; Chrome 148+ ICU outputs zero-padded hour with hour:'numeric'
      expect(getCell(0, 0).innerText).toBe('02:30 PM');
    });
  });

  describe('timeStyle option', () => {
    it('should render with timeStyle "full"', async() => {
      handsontable({
        data: [[TIME_HH_MM_SS]],
        type: 'time',
        timeFormat: { timeStyle: 'full' },
      });

      // full includes timezone name
      expect(getCell(0, 0).innerText).toMatch(/2:30:45 PM/);
    });

    it('should render with timeStyle "long"', async() => {
      handsontable({
        data: [[TIME_HH_MM_SS]],
        type: 'time',
        timeFormat: { timeStyle: 'long' },
      });

      expect(getCell(0, 0).innerText).toMatch(/2:30:45 PM/);
    });

    it('should render with timeStyle "medium"', async() => {
      handsontable({
        data: [[TIME_HH_MM_SS]],
        type: 'time',
        timeFormat: { timeStyle: 'medium' },
      });

      expect(getCell(0, 0).innerText).toBe('2:30:45 PM');
    });

    it('should render with timeStyle "short"', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: { timeStyle: 'short' },
      });

      expect(getCell(0, 0).innerText).toBe('2:30 PM');
    });
  });

  describe('hour and minute options', () => {
    it('should render hour numeric, minute 2-digit (24h)', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: { hour: 'numeric', minute: '2-digit', hour12: false },
      });

      expect(getCell(0, 0).innerText).toBe('14:30');
    });

    it('should render hour 2-digit, minute 2-digit (24h)', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      });

      expect(getCell(0, 0).innerText).toBe('14:30');
    });

    it('should render hour and minute numeric (12h)', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: { hour: 'numeric', minute: 'numeric', hour12: true },
      });

      expect(getCell(0, 0).innerText).toBe('2:30 PM');
    });
  });

  describe('second option', () => {
    it('should render with second 2-digit', async() => {
      handsontable({
        data: [[TIME_HH_MM_SS]],
        type: 'time',
        timeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        },
      });

      expect(getCell(0, 0).innerText).toBe('14:30:45');
    });
  });

  describe('fractionalSecondDigits option', () => {
    it('should render with fractionalSecondDigits 1', async() => {
      handsontable({
        data: [[TIME_HH_MM_SS_MS]],
        type: 'time',
        timeFormat: {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 1,
          hour12: false,
        },
      });

      expect(getCell(0, 0).innerText).toBe('14:30:45.1');
    });

    it('should render with fractionalSecondDigits 2', async() => {
      handsontable({
        data: [[TIME_HH_MM_SS_MS]],
        type: 'time',
        timeFormat: {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 2,
          hour12: false,
        },
      });

      expect(getCell(0, 0).innerText).toBe('14:30:45.12');
    });

    it('should render with fractionalSecondDigits 3', async() => {
      handsontable({
        data: [[TIME_HH_MM_SS_MS]],
        type: 'time',
        timeFormat: {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3,
          hour12: false,
        },
      });

      expect(getCell(0, 0).innerText).toBe('14:30:45.123');
    });
  });

  describe('hour12 option', () => {
    it('should render 24-hour when hour12 is false', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      });

      expect(getCell(0, 0).innerText).toBe('14:30');
    });

    it('should render 12-hour when hour12 is true', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: { hour: 'numeric', minute: '2-digit', hour12: true },
      });

      expect(getCell(0, 0).innerText).toBe('2:30 PM');
    });
  });

  describe('hourCycle option', () => {
    it('should render with hourCycle h23 (0-23)', async() => {
      handsontable({
        data: [['00:30']],
        type: 'time',
        timeFormat: { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
      });

      expect(getCell(0, 0).innerText).toBe('00:30');
    });

    it('should render with hourCycle h12 (1-12)', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: { hour: 'numeric', minute: '2-digit', hourCycle: 'h12' },
      });

      expect(getCell(0, 0).innerText).toBe('2:30 PM');
    });

    it('should render with hourCycle h24 (1-24 for midnight)', async() => {
      handsontable({
        data: [['00:00']],
        type: 'time',
        locale: 'en-GB',
        timeFormat: { hour: '2-digit', minute: '2-digit', hourCycle: 'h24' },
      });

      // h24: midnight can display as 24:00 or 00:00 depending on implementation
      expect(['24:00', '00:00']).toContain(getCell(0, 0).innerText);
    });
  });

  describe('dayPeriod option', () => {
    it('should render with dayPeriod short (12h)', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          dayPeriod: 'short',
        },
      });

      expect(getCell(0, 0).innerText).toBe('2:30 in the afternoon');
    });

    it('should render with dayPeriod long (12h)', async() => {
      handsontable({
        data: [['09:30']],
        type: 'time',
        timeFormat: {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          dayPeriod: 'long',
        },
      });

      expect(getCell(0, 0).innerText).toBe('9:30 in the morning');
    });
  });

  describe('timeZone option', () => {
    it('should format time in UTC', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'UTC',
        },
      });

      // Local 14:30 displayed in UTC depends on runner TZ
      expect(['13:30', '14:30', '15:30', '09:30']).toContain(getCell(0, 0).innerText);
    });

    it('should format time in named timezone America/New_York', async() => {
      handsontable({
        data: [['12:00']],
        type: 'time',
        locale: 'en-US',
        timeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'America/New_York',
        },
      });

      // 12:00 local interpreted as runner local, then shown in NY
      expect(getCell(0, 0).innerText).toMatch(/^\d{1,2}:\d{2}$/);
    });
  });

  describe('timeZoneName option', () => {
    it('should include short timeZoneName', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: {
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        },
      });

      expect(getCell(0, 0).innerText).toMatch(/2:30 PM/);
      expect(getCell(0, 0).innerText.length).toBeGreaterThan(7);
    });

    it('should include longOffset timeZoneName', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZoneName: 'longOffset',
        },
      });

      expect(getCell(0, 0).innerText).toMatch(/14:30/);
      expect(getCell(0, 0).innerText).toMatch(/GMT/);
    });
  });

  describe('locale option', () => {
    it('should format with en-US locale', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        locale: 'en-US',
        timeFormat: { timeStyle: 'short' },
      });

      expect(getCell(0, 0).innerText).toBe('2:30 PM');
    });

    it('should format with en-GB locale (often 24h)', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        locale: 'en-GB',
        timeFormat: { timeStyle: 'short' },
      });

      expect(getCell(0, 0).innerText).toBe('14:30');
    });

    it('should format with de-DE locale', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        locale: 'de-DE',
        timeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      });

      expect(getCell(0, 0).innerText).toBe('14:30');
    });
  });

  describe('numberingSystem option', () => {
    it('should format with numberingSystem latn', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          numberingSystem: 'latn',
        },
      });

      expect(getCell(0, 0).innerText).toBe('14:30');
    });

    it('should format with numberingSystem arab (Arabic-Indic digits)', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        locale: 'ar-EG',
        timeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          numberingSystem: 'arab',
        },
      });

      expect(getCell(0, 0).innerText).toBe('١٤:٣٠');
    });
  });

  describe('localeMatcher option', () => {
    it('should use localeMatcher best fit', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          localeMatcher: 'best fit',
        },
      });

      expect(getCell(0, 0).innerText).toBe('14:30');
    });

    it('should use localeMatcher lookup', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          localeMatcher: 'lookup',
        },
      });

      expect(getCell(0, 0).innerText).toBe('14:30');
    });
  });

  describe('formatMatcher option', () => {
    it('should use formatMatcher best fit', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
          formatMatcher: 'best fit',
        },
      });

      expect(getCell(0, 0).innerText).toBe('14:30');
    });

    it('should use formatMatcher basic', async() => {
      handsontable({
        data: [[TIME_HH_MM]],
        type: 'time',
        timeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          formatMatcher: 'basic',
        },
      });

      expect(getCell(0, 0).innerText).toBe('14:30');
    });
  });
});
