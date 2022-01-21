import Handsontable from 'handsontable';
import MetaManager from '../../index';
import { ExtendMetaPropertiesMod } from '../extendMetaProperties';

jest.mock('handsontable');

describe('ExtendMetaPropertiesMod', () => {
  describe('fixedColumnsLeft/fixedColumnsStart', () => {
    describe('when LTR mode', () => {
      beforeEach(() => {
        Handsontable.mockImplementation(() => {
          return {
            colToProp: visualCol => `prop_${visualCol}`,
            runHooks: () => {},
            hasHook: () => {},
            isRtl: () => false,
          };
        });
      });

      it('when set nothing should equal 0', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        expect(metaManager.getTableMeta().fixedColumnsLeft).toEqual(0);
        expect(metaManager.getTableMeta().fixedColumnsStart).toEqual(0);
      });

      it('when set `fixedColumnsLeft` = 0 should equal 0', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        metaManager.getTableMeta().fixedColumnsLeft = 0;

        expect(metaManager.getTableMeta().fixedColumnsLeft).toEqual(0);
        expect(metaManager.getTableMeta().fixedColumnsStart).toEqual(0);
      });

      it('when set `fixedColumnsLeft` = 0 and `fixedColumnsStart` = 0 should throws', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        expect(() => {
          metaManager.getTableMeta().fixedColumnsLeft = 0;
          metaManager.getTableMeta().fixedColumnsStart = 0;
        }).toThrow();
      });

      it('when set `fixedColumnsStart` = 0 should equal 0', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        metaManager.getTableMeta().fixedColumnsStart = 0;

        expect(metaManager.getTableMeta().fixedColumnsLeft).toEqual(0);
        expect(metaManager.getTableMeta().fixedColumnsStart).toEqual(0);
      });

      it('when set `fixedColumnsLeft` = 1 should equal 1', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        metaManager.getTableMeta().fixedColumnsLeft = 1;

        expect(metaManager.getTableMeta().fixedColumnsLeft).toEqual(1);
        expect(metaManager.getTableMeta().fixedColumnsStart).toEqual(1);
      });

      it('when set `fixedColumnsLeft` = 1 and `fixedColumnsStart` = 2 should throws', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        expect(() => {
          metaManager.getTableMeta().fixedColumnsLeft = 1;
          metaManager.getTableMeta().fixedColumnsStart = 2;
        }).toThrow();
      });

      it('when set `fixedColumnsStart` = 2 should equal 2', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        metaManager.getTableMeta().fixedColumnsStart = 2;

        expect(metaManager.getTableMeta().fixedColumnsLeft).toEqual(2);
        expect(metaManager.getTableMeta().fixedColumnsStart).toEqual(2);
      });
    });

    describe('when RTL mode', () => {
      beforeEach(() => {
        Handsontable.mockImplementation(() => {
          return {
            colToProp: visualCol => `prop_${visualCol}`,
            runHooks: () => {},
            hasHook: () => {},
            isRtl: () => true,
          };
        });
      });

      it('when RTL, set nothing should equal 0', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        expect(metaManager.getTableMeta().fixedColumnsLeft).toEqual(0);
        expect(metaManager.getTableMeta().fixedColumnsStart).toEqual(0);
      });

      it('when RTL, set `fixedColumnsLeft` = 0 and RTL should throws', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        expect(() => {
          metaManager.getTableMeta().fixedColumnsLeft = 0;
        }).toThrow();
      });

      it('when RTL, set `fixedColumnsLeft` = 0 and `fixedColumnsStart` = 0 and RTL should throws', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        expect(() => {
          metaManager.getTableMeta().fixedColumnsLeft = 0;
          metaManager.getTableMeta().fixedColumnsStart = 0;
        }).toThrow();
      });

      it('when RTL, set `fixedColumnsStart` = 0 should equal 0', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        metaManager.getTableMeta().fixedColumnsStart = 0;

        expect(metaManager.getTableMeta().fixedColumnsLeft).toEqual(0);
        expect(metaManager.getTableMeta().fixedColumnsStart).toEqual(0);
      });

      it('when RTL, set `fixedColumnsLeft` = 1 and RTL should throws', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        expect(() => {
          metaManager.getTableMeta().fixedColumnsLeft = 1;
        }).toThrow();
      });

      it('when RTL, set `fixedColumnsLeft` = 1 and `fixedColumnsStart` = 2 and RTL should throws', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        expect(() => {
          metaManager.getTableMeta().fixedColumnsLeft = 1;
          metaManager.getTableMeta().fixedColumnsStart = 2;
        }).toThrow();
      });

      it('when RTL, set `fixedColumnsStart` = 2 should equal 2', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        metaManager.getTableMeta().fixedColumnsStart = 2;

        expect(metaManager.getTableMeta().fixedColumnsLeft).toEqual(2);
        expect(metaManager.getTableMeta().fixedColumnsStart).toEqual(2);
      });
    });
  });

  describe('layoutDirection', () => {
    beforeEach(() => {
      Handsontable.mockImplementation(() => {
        return {
          colToProp: visualCol => `prop_${visualCol}`,
          runHooks: () => {},
          hasHook: () => {},
          isRtl: () => false,
        };
      });
    });

    it('should be possible to set initial value', () => {
      const hotMock = new Handsontable();

      {
        const metaManager = new MetaManager(hotMock, {
          layoutDirection: 'rtl',
        }, [ExtendMetaPropertiesMod]);

        expect(metaManager.getTableMeta().layoutDirection).toBe('rtl');
      }
      {
        const metaManager = new MetaManager(hotMock, {
          layoutDirection: 'ltr',
        }, [ExtendMetaPropertiesMod]);

        expect(metaManager.getTableMeta().layoutDirection).toBe('ltr');
      }
    });

    it('should not be possible to set value after the Handsontable initialization', () => {
      const hotMock = new Handsontable();
      const metaManager = new MetaManager(hotMock, {
        layoutDirection: 'rtl'
      }, [ExtendMetaPropertiesMod]);

      expect(() => {
        metaManager.updateGlobalMeta({ layoutDirection: 'ltr' });
      }).toThrow('The `layoutDirection` option can not be updated after the Handsontable is initialized.');
      expect(() => {
        metaManager.updateTableMeta({ layoutDirection: 'ltr' });
      }).toThrow('The `layoutDirection` option can not be updated after the Handsontable is initialized.');
      expect(() => {
        metaManager.updateColumnMeta(0, { layoutDirection: 'ltr' });
      }).toThrow('The `layoutDirection` option can not be updated after the Handsontable is initialized.');
      expect(metaManager.getTableMeta().layoutDirection).toBe('rtl');
    });
  });
});
