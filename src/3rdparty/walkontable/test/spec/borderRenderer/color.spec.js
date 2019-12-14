// This test could be in unit tests but it can't, because convertCssColorToRGBA does not work in unit tests due to poor implementation of getComputedStyle in JSDOM
const { setCurrentWindowContext, convertCssColorToRGBA, getLuminance, compareLuminance } = Walkontable;

describe('borderRenderer', () => {
  setCurrentWindowContext(window);

  describe('svg', () => {
    describe('color', () => {
      describe('convertCssColorToRGBA', () => {
        it('should convert colors to normalized rgb', () => {
          expect(convertCssColorToRGBA('orange'))
            .toEqual([255, 165, 0, 1]);

          expect(convertCssColorToRGBA('oRaNgE'))
            .toEqual([255, 165, 0, 1]);

          expect(convertCssColorToRGBA('#FFA500'))
            .toEqual([255, 165, 0, 1]);

          expect(convertCssColorToRGBA('#ffa500'))
            .toEqual([255, 165, 0, 1]);

          expect(convertCssColorToRGBA('#FA0'))
            .toEqual([255, 170, 0, 1]);

          expect(convertCssColorToRGBA('#fa0'))
            .toEqual([255, 170, 0, 1]);

          expect(convertCssColorToRGBA('rgb(255,165,0)'))
            .toEqual([255, 165, 0, 1]);

          expect(convertCssColorToRGBA('rgba(255,165,0,.2)'))
            .toEqual([255, 165, 0, 0.2]);

          expect(convertCssColorToRGBA('hsl(39,100%,50%)'))
            .toEqual([255, 166, 0, 1]);

          expect(convertCssColorToRGBA('hsla(39,100%,50%,.2)'))
            .toEqual([255, 166, 0, 0.2]);
        });
      });

      describe('getLuminance', () => {
        it('should return luminance in range 0-255', () => {
          expect(getLuminance([0, 0, 0, 1]))
            .toEqual(0);

          expect(Math.round(getLuminance([100, 50, 150, 1])))
            .toEqual(68);

          expect(Math.round(getLuminance([50, 100, 150, 1])))
            .toEqual(93);

          expect(getLuminance([100, 100, 100, 1]))
            .toEqual(100);

          expect(Math.round(getLuminance([150, 100, 50, 1])))
            .toEqual(107);

          expect(Math.round(getLuminance([255, 255, 255, 1])))
            .toEqual(255);
        });
      });

      describe('compareLuminance', () => {
        it('should return 0 if both colors are equal', () => {
          expect(compareLuminance([0, 0, 0, 1], [0, 0, 0, 1]))
            .toEqual(0);
        });

        it('should return 1 if the first parameter is a lighter color', () => {
          expect(compareLuminance([1, 1, 1, 1], [0, 0, 0, 1]))
            .toEqual(1);
        });

        it('should return -1 if the first parameter is a darker color', () => {
          expect(compareLuminance([0, 0, 0, 1], [1, 1, 1, 1]))
            .toEqual(-1);
        });
      });
    });
  });

});
