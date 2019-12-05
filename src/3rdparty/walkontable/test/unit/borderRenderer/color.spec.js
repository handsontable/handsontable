import { convertCssColorToRGBA, getLuminance, compareLuminance } from 'walkontable/borderRenderer/svg/color';

describe('borderRenderer', () => {
  describe('svg', () => {
    describe('color', () => {
      describe('convertCssColorToRGBA', () => {
        it('should convert colors to normalized rgb', () => {
          expect(convertCssColorToRGBA('orange'))
            .toEqual({ r: 255, g: 165, b: 0, a: 1 });

          expect(convertCssColorToRGBA('#FFA500'))
            .toEqual({ r: 255, g: 165, b: 0, a: 1 });

          expect(convertCssColorToRGBA('#FA0'))
            .toEqual({ r: 255, g: 170, b: 0, a: 1 });

          expect(convertCssColorToRGBA('rgb(255,165,0)'))
            .toEqual({ r: 255, g: 165, b: 0, a: 1 });

          expect(convertCssColorToRGBA('rgb(255,165,0)'))
            .toEqual({ r: 255, g: 165, b: 0, a: 1 });

          expect(convertCssColorToRGBA('rgba(255,165,0,.2)'))
            .toEqual({ r: 255, g: 165, b: 0, a: 0.2 });
        });
      });

      describe('getLuminance', () => {
        it('should return luminance in range 0-255', () => {
          expect(getLuminance({ r: 0, g: 0, b: 0, a: 1 }))
            .toEqual(0);

          expect(Math.round(getLuminance({ r: 100, g: 50, b: 150, a: 1 })))
            .toEqual(68);

          expect(Math.round(getLuminance({ r: 50, g: 100, b: 150, a: 1 })))
            .toEqual(93);

          expect(getLuminance({ r: 100, g: 100, b: 100, a: 1 }))
            .toEqual(100);

          expect(Math.round(getLuminance({ r: 150, g: 100, b: 50, a: 1 })))
            .toEqual(107);

          expect(Math.round(getLuminance({ r: 255, g: 255, b: 255, a: 1 })))
            .toEqual(255);
        });
      });

      describe('compareLuminance', () => {
        it('should return 0 if both colors are equal', () => {
          expect(compareLuminance({ r: 0, g: 0, b: 0, a: 1 }, { r: 0, g: 0, b: 0, a: 1 }))
            .toEqual(0);
        });

        it('should return 1 if the first parameter is a lighter color', () => {
          expect(compareLuminance({ r: 1, g: 1, b: 1, a: 1 }, { r: 0, g: 0, b: 0, a: 1 }))
            .toEqual(1);
        });

        it('should return -1 if the first parameter is a darker color', () => {
          expect(compareLuminance({ r: 0, g: 0, b: 0, a: 1 }, { r: 1, g: 1, b: 1, a: 1 }))
            .toEqual(-1);
        });
      });
    });
  });

});
