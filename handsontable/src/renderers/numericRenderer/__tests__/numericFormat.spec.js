describe('NumericRenderer numericFormat options', () => {
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

  describe('style option', () => {
    it('should render number with style "decimal" (default)', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          style: 'decimal',
        },
      });

      await setDataAtCell(0, 0, '1234.567');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('1,234.567');
    });

    it('should render number with style "percent"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          style: 'percent',
        },
      });

      await setDataAtCell(0, 0, '0.75');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('75%');
    });

    it('should render number with style "percent" with fraction digits', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          style: 'percent',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      });

      await setDataAtCell(0, 0, '0.7534');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('75.34%');
    });
  });

  describe('currencyDisplay option', () => {
    it('should render currency with currencyDisplay "symbol" (default)', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          currencyDisplay: 'symbol',
        },
      });

      await setDataAtCell(0, 0, '1000');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('$1,000.00');
    });

    it('should render currency with currencyDisplay "narrowSymbol"', async() => {
      handsontable({
        renderer: 'numeric',
        locale: 'en-CA',
        numericFormat: {
          style: 'currency',
          currency: 'CAD',
          currencyDisplay: 'narrowSymbol',
        },
      });

      await setDataAtCell(0, 0, '1000');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('$1,000.00');
    });

    it('should render currency with currencyDisplay "code"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          currencyDisplay: 'code',
        },
      });

      await setDataAtCell(0, 0, '1000');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('USD\u00A01,000.00');
    });

    it('should render currency with currencyDisplay "name"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          currencyDisplay: 'name',
        },
      });

      await setDataAtCell(0, 0, '1000');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('1,000.00 US dollars');
    });
  });

  describe('currencySign option', () => {
    it('should render negative currency with currencySign "standard" (default)', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          currencySign: 'standard',
        },
      });

      await setDataAtCell(0, 0, '-1000');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('-$1,000.00');
    });

    it('should render negative currency with currencySign "accounting"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          currencySign: 'accounting',
        },
      });

      await setDataAtCell(0, 0, '-1000');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('($1,000.00)');
    });
  });

  describe('unitDisplay option', () => {
    it('should render unit with unitDisplay "short" (default)', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          style: 'unit',
          unit: 'meter',
          unitDisplay: 'short',
        },
      });

      await setDataAtCell(0, 0, '100');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('100 m');
    });

    it('should render unit with unitDisplay "narrow"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          style: 'unit',
          unit: 'meter',
          unitDisplay: 'narrow',
        },
      });

      await setDataAtCell(0, 0, '100');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('100m');
    });

    it('should render unit with unitDisplay "long"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          style: 'unit',
          unit: 'meter',
          unitDisplay: 'long',
        },
      });

      await setDataAtCell(0, 0, '100');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('100 meters');
    });
  });

  describe('notation option', () => {
    it('should render number with notation "standard" (default)', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          notation: 'standard',
        },
      });

      await setDataAtCell(0, 0, '123456');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('123,456');
    });

    it('should render number with notation "scientific"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          notation: 'scientific',
        },
      });

      await setDataAtCell(0, 0, '123456');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('1.235E5');
    });

    it('should render number with notation "engineering"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          notation: 'engineering',
        },
      });

      await setDataAtCell(0, 0, '123456');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('123.456E3');
    });

    it('should render number with notation "compact" and compactDisplay "short"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          notation: 'compact',
          compactDisplay: 'short',
        },
      });

      await setDataAtCell(0, 0, '1500000');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('1.5M');
    });

    it('should render number with notation "compact" and compactDisplay "long"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          notation: 'compact',
          compactDisplay: 'long',
        },
      });

      await setDataAtCell(0, 0, '1500000');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('1.5 million');
    });
  });

  describe('signDisplay option', () => {
    it('should render number with signDisplay "auto" (default)', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          signDisplay: 'auto',
        },
      });

      await setDataAtCell(0, 0, '100');
      await setDataAtCell(0, 1, '-100');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('100');
      expect(getCell(0, 1).innerText).toEqual('-100');
    });

    it('should render number with signDisplay "always"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          signDisplay: 'always',
        },
      });

      await setDataAtCell(0, 0, '100');
      await setDataAtCell(0, 1, '-100');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('+100');
      expect(getCell(0, 1).innerText).toEqual('-100');
    });

    it('should render number with signDisplay "never"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          signDisplay: 'never',
        },
      });

      await setDataAtCell(0, 0, '100');
      await setDataAtCell(0, 1, '-100');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('100');
      expect(getCell(0, 1).innerText).toEqual('100');
    });

    it('should render number with signDisplay "exceptZero"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          signDisplay: 'exceptZero',
        },
      });

      await setDataAtCell(0, 0, '100');
      await setDataAtCell(0, 1, '0');
      await setDataAtCell(0, 2, '-100');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('+100');
      expect(getCell(0, 1).innerText).toEqual('0');
      expect(getCell(0, 2).innerText).toEqual('-100');
    });

    it('should render number with signDisplay "negative"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          signDisplay: 'negative',
        },
      });

      await setDataAtCell(0, 0, '100');
      await setDataAtCell(0, 1, '-100');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('100');
      expect(getCell(0, 1).innerText).toEqual('-100');
    });
  });

  describe('useGrouping option', () => {
    it('should render number with useGrouping true', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          useGrouping: true,
        },
      });

      await setDataAtCell(0, 0, '1234567');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('1,234,567');
    });

    it('should render number with useGrouping false', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          useGrouping: false,
        },
      });

      await setDataAtCell(0, 0, '1234567');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('1234567');
    });
  });

  describe('digit options', () => {
    it('should render number with minimumIntegerDigits', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          minimumIntegerDigits: 5,
        },
      });

      await setDataAtCell(0, 0, '42');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('00,042');
    });

    it('should render number with minimumFractionDigits', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          minimumFractionDigits: 3,
        },
      });

      await setDataAtCell(0, 0, '42.5');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('42.500');
    });

    it('should render number with maximumFractionDigits', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          maximumFractionDigits: 2,
        },
      });

      await setDataAtCell(0, 0, '42.56789');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('42.57');
    });

    it('should render number with minimumSignificantDigits', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          minimumSignificantDigits: 4,
        },
      });

      await setDataAtCell(0, 0, '42');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('42.00');
    });

    it('should render number with maximumSignificantDigits', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          maximumSignificantDigits: 3,
        },
      });

      await setDataAtCell(0, 0, '12345');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('12,300');
    });
  });

  describe('roundingMode option', () => {
    it('should render number with roundingMode "halfExpand" (default)', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          maximumFractionDigits: 1,
          roundingMode: 'halfExpand',
        },
      });

      await setDataAtCell(0, 0, '2.25');
      await setDataAtCell(0, 1, '2.35');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('2.3');
      expect(getCell(0, 1).innerText).toEqual('2.4');
    });

    it('should render number with roundingMode "ceil"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          maximumFractionDigits: 1,
          roundingMode: 'ceil',
        },
      });

      await setDataAtCell(0, 0, '2.21');
      await setDataAtCell(0, 1, '-2.21');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('2.3');
      expect(getCell(0, 1).innerText).toEqual('-2.2');
    });

    it('should render number with roundingMode "floor"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          maximumFractionDigits: 1,
          roundingMode: 'floor',
        },
      });

      await setDataAtCell(0, 0, '2.29');
      await setDataAtCell(0, 1, '-2.21');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('2.2');
      expect(getCell(0, 1).innerText).toEqual('-2.3');
    });

    it('should render number with roundingMode "trunc"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          maximumFractionDigits: 1,
          roundingMode: 'trunc',
        },
      });

      await setDataAtCell(0, 0, '2.29');
      await setDataAtCell(0, 1, '-2.29');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('2.2');
      expect(getCell(0, 1).innerText).toEqual('-2.2');
    });
  });

  describe('trailingZeroDisplay option', () => {
    it('should render number with trailingZeroDisplay "auto" (default)', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          minimumFractionDigits: 2,
          trailingZeroDisplay: 'auto',
        },
      });

      await setDataAtCell(0, 0, '5');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('5.00');
    });

    it('should render number with trailingZeroDisplay "stripIfInteger"', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          minimumFractionDigits: 2,
          trailingZeroDisplay: 'stripIfInteger',
        },
      });

      await setDataAtCell(0, 0, '5');
      await setDataAtCell(0, 1, '5.5');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('5');
      expect(getCell(0, 1).innerText).toEqual('5.50');
    });
  });

  describe('combined options', () => {
    it('should render currency with compact notation', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          notation: 'compact',
          compactDisplay: 'short',
        },
      });

      await setDataAtCell(0, 0, '1500000');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('$1.5M');
    });

    it('should render percent with always sign and custom fraction digits', async() => {
      handsontable({
        renderer: 'numeric',
        numericFormat: {
          style: 'percent',
          signDisplay: 'always',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        },
      });

      await setDataAtCell(0, 0, '0.125');
      await setDataAtCell(0, 1, '-0.05');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('+12.5%');
      expect(getCell(0, 1).innerText).toEqual('-5.0%');
    });

    it('should render unit with custom culture and long display', async() => {
      handsontable({
        renderer: 'numeric',
        locale: 'fr-FR',
        numericFormat: {
          style: 'unit',
          unit: 'kilogram',
          unitDisplay: 'long',
        },
      });

      await setDataAtCell(0, 0, '5');
      await waitForNextAnimationFrames(1);

      expect(getCell(0, 0).innerText).toEqual('5\u00A0kilogrammes');
    });
  });

  describe('locale option', () => {
    describe('decimal number formatting', () => {
      it('should format decimal with de-DE locale (dot grouping, comma decimal)', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'de-DE',
          numericFormat: {
            minimumFractionDigits: 2,
          },
        });

        await setDataAtCell(0, 0, '1234567.89');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('1.234.567,89');
      });

      it('should format decimal with fr-FR locale (space grouping, comma decimal)', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'fr-FR',
          numericFormat: {
            minimumFractionDigits: 2,
          },
        });

        await setDataAtCell(0, 0, '1234567.89');
        await waitForNextAnimationFrames(1);

        // French uses narrow no-break space (U+202F) as grouping separator
        expect(getCell(0, 0).innerText).toEqual('1\u202F234\u202F567,89');
      });

      it('should format decimal with hi-IN locale (Indian numbering system)', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'en-IN',
          numericFormat: {
            minimumFractionDigits: 2,
          },
        });

        await setDataAtCell(0, 0, '12345678.9');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('1,23,45,678.90');
      });

      it('should format decimal with ar-EG locale (Arabic numerals)', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'ar-EG',
          numericFormat: {
            minimumFractionDigits: 2,
          },
        });

        await setDataAtCell(0, 0, '1234.56');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('١٬٢٣٤٫٥٦');
      });

      it('should format decimal with ja-JP locale', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'ja-JP',
          numericFormat: {
            minimumFractionDigits: 2,
          },
        });

        await setDataAtCell(0, 0, '1234567.89');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('1,234,567.89');
      });
    });

    describe('currency formatting', () => {
      it('should format USD with en-US locale ($ before number)', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'en-US',
          numericFormat: {
            style: 'currency',
            currency: 'USD',
          },
        });

        await setDataAtCell(0, 0, '1234.56');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('$1,234.56');
      });

      it('should format EUR with fr-FR locale (€ after number with space)', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'fr-FR',
          numericFormat: {
            style: 'currency',
            currency: 'EUR',
          },
        });

        await setDataAtCell(0, 0, '1234.56');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('1\u202F234,56\u00A0€');
      });

      it('should format GBP with en-GB locale', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'en-GB',
          numericFormat: {
            style: 'currency',
            currency: 'GBP',
          },
        });

        await setDataAtCell(0, 0, '1234.56');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('£1,234.56');
      });

      it('should format JPY with ja-JP locale (¥ before, no decimals)', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'ja-JP',
          numericFormat: {
            style: 'currency',
            currency: 'JPY',
          },
        });

        await setDataAtCell(0, 0, '1234');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('￥1,234');
      });
    });

    describe('percent formatting', () => {
      it('should format percent with de-DE locale (space before %)', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'de-DE',
          numericFormat: {
            style: 'percent',
            minimumFractionDigits: 2,
          },
        });

        await setDataAtCell(0, 0, '0.1234');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('12,34\u00A0%');
      });

      it('should format percent with fr-FR locale', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'fr-FR',
          numericFormat: {
            style: 'percent',
            minimumFractionDigits: 2,
          },
        });

        await setDataAtCell(0, 0, '0.1234');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('12,34\u00A0%');
      });

      it('should format percent with tr-TR locale', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'tr-TR',
          numericFormat: {
            style: 'percent',
          },
        });

        await setDataAtCell(0, 0, '0.75');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('%75');
      });
    });

    describe('unit formatting', () => {
      it('should format kilometers with de-DE locale', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'de-DE',
          numericFormat: {
            style: 'unit',
            unit: 'kilometer',
            unitDisplay: 'long',
          },
        });

        await setDataAtCell(0, 0, '5');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('5 Kilometer');
      });

      it('should format celsius with es-ES locale', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'es-ES',
          numericFormat: {
            style: 'unit',
            unit: 'celsius',
            unitDisplay: 'long',
          },
        });

        await setDataAtCell(0, 0, '25');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('25 grados Celsius');
      });

      it('should format speed with ja-JP locale', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'ja-JP',
          numericFormat: {
            style: 'unit',
            unit: 'kilometer-per-hour',
            unitDisplay: 'short',
          },
        });

        await setDataAtCell(0, 0, '120');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('120 km/h');
      });
    });

    describe('compact notation', () => {
      it('should format compact number with de-DE locale', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'de-DE',
          numericFormat: {
            notation: 'compact',
            compactDisplay: 'long',
          },
        });

        await setDataAtCell(0, 0, '1500000');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('1,5 Millionen');
      });

      it('should format compact number with fr-FR locale', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'fr-FR',
          numericFormat: {
            notation: 'compact',
            compactDisplay: 'long',
          },
        });

        await setDataAtCell(0, 0, '1500000');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('1,5 million');
      });

      it('should format compact number with zh-CN locale', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'zh-CN',
          numericFormat: {
            notation: 'compact',
            compactDisplay: 'long',
          },
        });

        await setDataAtCell(0, 0, '15000000');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('1500万');
      });

      it('should format compact number with ja-JP locale', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'ja-JP',
          numericFormat: {
            notation: 'compact',
            compactDisplay: 'long',
          },
        });

        await setDataAtCell(0, 0, '10000');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('1万');
      });
    });

    describe('numbering systems', () => {
      it('should format with Arabic-Indic numerals (ar-EG)', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'ar-EG',
          numericFormat: {
            useGrouping: true,
          },
        });

        await setDataAtCell(0, 0, '0123456789');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('١٢٣٬٤٥٦٬٧٨٩');
      });

      it('should format with Devanagari numerals (hi-IN with numberingSystem)', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'hi-IN',
          numericFormat: {
            useGrouping: true,
            numberingSystem: 'deva',
          },
        });

        await setDataAtCell(0, 0, '12345');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('१२,३४५');
      });

      it('should format with Thai numerals (th-TH with numberingSystem)', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'th-TH',
          numericFormat: {
            useGrouping: true,
            numberingSystem: 'thai',
          },
        });

        await setDataAtCell(0, 0, '12345');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('๑๒,๓๔๕');
      });

      it('should format with Bengali numerals (bn-BD with numberingSystem)', async() => {
        handsontable({
          renderer: 'numeric',
          locale: 'bn-BD',
          numericFormat: {
            useGrouping: true,
            numberingSystem: 'beng',
          },
        });

        await setDataAtCell(0, 0, '12345');
        await waitForNextAnimationFrames(1);

        expect(getCell(0, 0).innerText).toEqual('১২,৩৪৫');
      });
    });
  });

  describe('numbro.js format', () => {
    it('should render formatted number', async() => {
      handsontable({
        cells() {
          return {
            renderer: 'numeric',
            numericFormat: { pattern: '$0,0.00' }
          };
        },
      });

      await setDataAtCell(2, 2, '1000.234');
      await waitForNextAnimationFrames(2);

      expect(getCell(2, 2).innerText).toEqual('$1,000.23');
    });

    it('should render signed number', async() => {
      handsontable({
        cells() {
          return {
            renderer: 'numeric',
            numericFormat: { pattern: '$0,0.00' }
          };
        },
      });

      await setDataAtCell(2, 2, '-1000.234');
      await waitForNextAnimationFrames(2);

      expect(getCell(2, 2).innerText).toEqual('-$1,000.23');
    });
  });
});
