// This test could be in unit tests but it can't, because convertCssColorToRGBA does not work in unit tests due to poor implementation of getComputedStyle in JSDOM
const { setCurrentWindowContext, compareStrokePriority } = Walkontable;

describe('borderRenderer', () => {
  setCurrentWindowContext(window);

  describe('pathsRenderer', () => {
    describe('compareStrokePriority', () => {
      it('should return 0 when given 2 borders that are the same', () => {
        expect(compareStrokePriority('1px solid black', '1px solid black')).toBe(0);
      });

      it('should give priority to a wider border', () => {
        expect(compareStrokePriority('2px solid black', '1px solid black')).toBe(1);
        expect(compareStrokePriority('1px solid black', '2px solid black')).toBe(-1);

        expect(compareStrokePriority('10px solid black', '2px solid black')).toBe(1);
        expect(compareStrokePriority('2px solid black', '10px solid black')).toBe(-1);
      });

      it('should give priority to a darker border', () => {
        expect(compareStrokePriority('1px solid black', '1px solid beige')).toBe(1);
        expect(compareStrokePriority('1px solid beige', '1px solid black')).toBe(-1);

        expect(compareStrokePriority('1px solid darkred', '1px solid red')).toBe(1);
        expect(compareStrokePriority('1px solid red', '1px solid darkred')).toBe(-1);

        expect(compareStrokePriority('1px solid darkred', '1px solid RED')).toBe(1);
        expect(compareStrokePriority('1px solid RED', '1px solid darkred')).toBe(-1);

        expect(compareStrokePriority('1px solid #000000', '1px solid #FFFFFF')).toBe(1);
        expect(compareStrokePriority('1px solid #FFFFFF', '1px solid #000000')).toBe(-1);

        expect(compareStrokePriority('1px solid rgb(0, 0, 0)', '1px solid rgb(255, 255, 255)')).toBe(1);
        expect(compareStrokePriority('1px solid rgb(255, 255, 255)', '1px solid rgb(0, 0, 0)')).toBe(-1);

        expect(compareStrokePriority('1px solid rgba(0, 0, 0, 1)', '1px solid rgba(255, 255, 255, 1)')).toBe(1);
        expect(compareStrokePriority('1px solid rgba(255, 255, 255, 1)', '1px solid rgba(0, 0, 0, 1)')).toBe(-1);

        expect(compareStrokePriority('1px solid black', '1px solid white')).toBe(1);
        expect(compareStrokePriority('1px solid white', '1px solid black')).toBe(-1);
      });
    });
  });

});
