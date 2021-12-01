import Handsontable from 'handsontable';
import MetaManager from '../../index';
import { FixedColumnsPropertiesMod } from '../fixedColumnsProperties';

jest.mock('handsontable');

describe('fixedColumnsProperties', () => {

  let rtl = false;

  beforeEach(() => {
    Handsontable.mockImplementation(() => {
      return {
        colToProp: visualCol => `prop_${visualCol}`,
        runHooks: () => {},
        hasHook: () => {},
        isRtl: () => rtl,
      };
    });
  });

  const dataProvider = [
    {
      label: 'when set nothing',
      inRtl: false,
      inLeft: undefined,
      inStart: undefined,
      throws: false,
      expected: 0
    },
    {
      label: 'when set `fixedColumnsLeft` = 0 ',
      inRtl: false,
      inLeft: 0,
      inStart: undefined,
      throws: false,
      expected: 0
    },
    {
      label: 'when set `fixedColumnsLeft` = 0 and `fixedColumnsStart` = 0 ',
      inRtl: false,
      inLeft: 0,
      inStart: 0,
      throws: true,
      expected: undefined
    },
    {
      label: 'when set `fixedColumnsStart` = 0 ',
      inRtl: false,
      inLeft: undefined,
      inStart: 0,
      throws: false,
      expected: 0
    },
    {
      label: 'when set `fixedColumnsLeft` = 1 ',
      inRtl: false,
      inLeft: 1,
      inStart: undefined,
      throws: false,
      expected: 1
    },
    {
      label: 'when set `fixedColumnsLeft` = 1 and `fixedColumnsStart` = 2 ',
      inRtl: false,
      inLeft: 1,
      inStart: 2,
      throws: true,
      expected: undefined
    },
    {
      label: 'when set `fixedColumnsStart` = 2 ',
      inRtl: false,
      inLeft: undefined,
      inStart: 2,
      throws: false,
      expected: 2
    },
    {
      label: 'when RTL, set nothing',
      inRtl: true,
      inLeft: undefined,
      inStart: undefined,
      throws: false,
      expected: 0
    },
    {
      label: 'when RTL, set `fixedColumnsLeft` = 0 ',
      inRtl: true,
      inLeft: 0,
      inStart: undefined,
      throws: true,
      expected: undefined
    },
    {
      label: 'when RTL, set `fixedColumnsLeft` = 0 and `fixedColumnsStart` = 0 ',
      inRtl: true,
      inLeft: 0,
      inStart: 0,
      throws: true,
      expected: undefined
    },
    {
      label: 'when RTL, set `fixedColumnsStart` = 0 ',
      inRtl: true,
      inLeft: undefined,
      inStart: 0,
      throws: false,
      expected: 0
    },
    {
      label: 'when RTL, set `fixedColumnsLeft` = 1 ',
      inRtl: true,
      inLeft: 1,
      inStart: undefined,
      throws: true,
      expected: undefined
    },
    {
      label: 'when RTL, set `fixedColumnsLeft` = 1 and `fixedColumnsStart` = 2 ',
      inRtl: true,
      inLeft: 1,
      inStart: 2,
      throws: true,
      expected: undefined
    },
    {
      label: 'when RTL, set `fixedColumnsStart` = 2 ',
      inRtl: true,
      inLeft: undefined,
      inStart: 2,
      throws: false,
      expected: 2
    },
  ];

  dataProvider.forEach(({ label, inRtl, inLeft, inStart, throws, expected }) => {
    describe(label, () => {
      if (inRtl) {
        beforeEach(() => { rtl = true; });
        afterEach(() => { rtl = false; });
      }
      it(throws ? 'should throws' : ` option \`fixedColumnsStart\` should equal \`${expected}\``, () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [FixedColumnsPropertiesMod]);

        const action = expect(() => {
          if (inLeft !== undefined) {
            metaManager.getTableMeta().fixedColumnsLeft = inLeft;
          }

          if (inStart !== undefined) {
            metaManager.getTableMeta().fixedColumnsStart = inStart;
          }
        });

        if (throws) {
          action.toThrow();

        } else {
          action.not.toThrow();

          expect(metaManager.getTableMeta().fixedColumnsLeft).toEqual(expected);
          expect(metaManager.getTableMeta().fixedColumnsStart).toEqual(expected);
        }
      });
    });
  });
});
