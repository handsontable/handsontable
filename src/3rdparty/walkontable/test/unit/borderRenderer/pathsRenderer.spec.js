import { compareStrokePriority } from 'walkontable/borderRenderer/svg/pathsRenderer';

describe('borderRenderer', () => {
  describe('pathsRenderer', () => {
    describe('compareStrokePriority', () => {
      it('should return 0 when given 2 borders that are the same', () => {
        expect(compareStrokePriority('1px black horizontal', '1px black horizontal')).toBe(0);
      });

      it('should give priority to a wider border', () => {
        expect(compareStrokePriority('2px black horizontal', '1px black horizontal')).toBe(1);
        expect(compareStrokePriority('1px black horizontal', '2px black horizontal')).toBe(-1);

        expect(compareStrokePriority('10px black horizontal', '2px black horizontal')).toBe(1);
        expect(compareStrokePriority('2px black horizontal', '10px black horizontal')).toBe(-1);
      });

      it('should give priority to horizontal border', () => {
        expect(compareStrokePriority('2px black horizontal', '2px black vertical')).toBe(1);
        expect(compareStrokePriority('2px black vertical', '2px black horizontal')).toBe(-1);
      });

      it('should give priority to a darker border', () => {
        expect(compareStrokePriority('1px black horizontal', '1px beige horizontal')).toBe(1);
        expect(compareStrokePriority('1px beige horizontal', '1px black horizontal')).toBe(-1);

        expect(compareStrokePriority('1px darkred horizontal', '1px red horizontal')).toBe(1);
        expect(compareStrokePriority('1px red horizontal', '1px darkred horizontal')).toBe(-1);

        expect(compareStrokePriority('1px darkred horizontal', '1px RED horizontal')).toBe(1);
        expect(compareStrokePriority('1px RED horizontal', '1px darkred horizontal')).toBe(-1);

        expect(compareStrokePriority('1px #000000 horizontal', '1px #FFFFFF horizontal')).toBe(1);
        expect(compareStrokePriority('1px #FFFFFF horizontal', '1px #000000 horizontal')).toBe(-1);

        expect(compareStrokePriority('1px rgb(0, 0, 0) horizontal', '1px rgb(255, 255, 255) horizontal')).toBe(1);
        expect(compareStrokePriority('1px rgb(255, 255, 255) horizontal', '1px rgb(0, 0, 0) horizontal')).toBe(-1);

        expect(compareStrokePriority('1px rgba(0, 0, 0, 1) horizontal', '1px rgba(255, 255, 255, 1) horizontal')).toBe(1);
        expect(compareStrokePriority('1px rgba(255, 255, 255, 1) horizontal', '1px rgba(0, 0, 0, 1) horizontal')).toBe(-1);

        expect(compareStrokePriority('1px black horizontal', '1px white horizontal')).toBe(1);
        expect(compareStrokePriority('1px white horizontal', '1px black horizontal')).toBe(-1);
      });
    });
  });

});
