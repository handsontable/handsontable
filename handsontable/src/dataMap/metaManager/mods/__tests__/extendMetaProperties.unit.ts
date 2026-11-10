import Handsontable from 'handsontable';
import MetaManager from '../../index';
import { ExtendMetaPropertiesMod } from '../extendMetaProperties';
import { registerAllCellTypes } from '../../../../cellTypes';

registerAllCellTypes();

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

      it('when set `fixedColumnsLeft` = 0 and then `fixedColumnsStart` = 0 should equal 0', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        metaManager.getTableMeta().fixedColumnsLeft = 0;
        metaManager.getTableMeta().fixedColumnsStart = 0;

        expect(metaManager.getTableMeta().fixedColumnsLeft).toEqual(0);
        expect(metaManager.getTableMeta().fixedColumnsStart).toEqual(0);
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

      it('when set `fixedColumnsLeft` = 1 and then `fixedColumnsStart` = 2 the later value wins', () => {
        const hotMock = new Handsontable();
        const metaManager = new MetaManager(hotMock, {}, [ExtendMetaPropertiesMod]);

        metaManager.getTableMeta().fixedColumnsLeft = 1;
        metaManager.getTableMeta().fixedColumnsStart = 2;

        expect(metaManager.getTableMeta().fixedColumnsLeft).toEqual(2);
        expect(metaManager.getTableMeta().fixedColumnsStart).toEqual(2);

        metaManager.getTableMeta().fixedColumnsLeft = 3;

        expect(metaManager.getTableMeta().fixedColumnsLeft).toEqual(3);
        expect(metaManager.getTableMeta().fixedColumnsStart).toEqual(3);
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

  describe('init-only options that the initial settings did not define', () => {
    const initOnlyOptions: Array<[string, unknown]> = [
      ['layoutDirection', 'rtl'],
      ['renderAllRows', true],
      ['renderAllColumns', true],
      ['ariaTags', false],
    ];

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

    it.each(initOnlyOptions)('should throw on the first update of `%s`', (option, value) => {
      const metaManager = new MetaManager(new Handsontable(), {}, [ExtendMetaPropertiesMod]);

      metaManager.finishInitialization();

      expect(() => {
        metaManager.updateGlobalMeta({ [option]: value });
      }).toThrow(`The \`${option}\` option can not be updated after the Handsontable is initialized.`);
    });

    it.each(initOnlyOptions)('should keep throwing on the second update of `%s`', (option, value) => {
      const metaManager = new MetaManager(new Handsontable(), {}, [ExtendMetaPropertiesMod]);

      metaManager.finishInitialization();

      const message = `The \`${option}\` option can not be updated after the Handsontable is initialized.`;

      expect(() => metaManager.updateGlobalMeta({ [option]: value })).toThrow(message);
      expect(() => metaManager.updateGlobalMeta({ [option]: value })).toThrow(message);
    });

    it.each(initOnlyOptions)('should accept the first write of `%s` until the initialization is finished', (option, value) => {
      const metaManager = new MetaManager(new Handsontable(), {}, [ExtendMetaPropertiesMod]);

      expect(() => metaManager.updateGlobalMeta({ [option]: value })).not.toThrow();
      expect(metaManager.getGlobalMeta()[option]).toBe(value);
    });

    it('should accept a column meta write while the grid is initializing', () => {
      const metaManager = new MetaManager(new Handsontable(), {}, [ExtendMetaPropertiesMod]);

      expect(() => metaManager.updateColumnMeta(0, { ariaTags: false })).not.toThrow();
    });

    it('should refuse the first column meta write once the initialization is finished', () => {
      const metaManager = new MetaManager(new Handsontable(), {}, [ExtendMetaPropertiesMod]);

      metaManager.finishInitialization();

      expect(() => {
        metaManager.updateColumnMeta(0, { ariaTags: false });
      }).toThrow('The `ariaTags` option can not be updated after the Handsontable is initialized.');
    });

    describe('assertNoInitOnlyUpdates()', () => {
      it('should refuse a payload that names an init-only option once the initialization is finished', () => {
        const metaManager = new MetaManager(new Handsontable(), {}, [ExtendMetaPropertiesMod]);

        metaManager.finishInitialization();

        expect(() => {
          metaManager.assertNoInitOnlyUpdates({ colHeaders: true, renderAllRows: true });
        }).toThrow('The `renderAllRows` option can not be updated after the Handsontable is initialized.');
      });

      it('should refuse a payload that names an init-only option with `undefined`', () => {
        const metaManager = new MetaManager(new Handsontable(), {}, [ExtendMetaPropertiesMod]);

        metaManager.finishInitialization();

        expect(() => {
          metaManager.assertNoInitOnlyUpdates({ ariaTags: undefined });
        }).toThrow('The `ariaTags` option can not be updated after the Handsontable is initialized.');
      });

      it('should accept the payload while the grid is initializing', () => {
        const metaManager = new MetaManager(new Handsontable(), {}, [ExtendMetaPropertiesMod]);

        expect(() => metaManager.assertNoInitOnlyUpdates({ renderAllRows: true })).not.toThrow();
      });

      it('should accept a payload with no init-only option', () => {
        const metaManager = new MetaManager(new Handsontable(), {}, [ExtendMetaPropertiesMod]);

        metaManager.finishInitialization();

        expect(() => metaManager.assertNoInitOnlyUpdates({ colHeaders: true, fixedColumnsStart: 1 })).not.toThrow();
      });

      it('should accept any payload when the manager has no init-only options registered', () => {
        const metaManager = new MetaManager(new Handsontable(), {}, []);

        metaManager.finishInitialization();

        expect(() => metaManager.assertNoInitOnlyUpdates({ renderAllRows: true })).not.toThrow();
      });
    });

    it('should not throw for an option that the initial settings did define, set in the constructor', () => {
      expect(() => {
        const metaManager = new MetaManager(new Handsontable(), {
          layoutDirection: 'rtl',
          renderAllRows: true,
        }, [ExtendMetaPropertiesMod]);

        expect(metaManager.getTableMeta().layoutDirection).toBe('rtl');
        expect(metaManager.getTableMeta().renderAllRows).toBe(true);
      }).not.toThrow();
    });

    it('should not affect an option that is not init-only', () => {
      const metaManager = new MetaManager(new Handsontable(), {}, [ExtendMetaPropertiesMod]);

      expect(() => {
        metaManager.updateGlobalMeta({ fixedColumnsStart: 1 });
        metaManager.updateGlobalMeta({ fixedColumnsStart: 2 });
      }).not.toThrow();
    });
  });
});
