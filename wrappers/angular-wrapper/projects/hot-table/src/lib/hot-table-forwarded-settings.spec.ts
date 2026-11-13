import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { registerPlugin, MergeCells, UndoRedo } from 'handsontable/plugins';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { GridSettings } from './models/grid-settings';
import { TEST_LICENSE_KEY } from './test-helpers/license-key';

registerPlugin(MergeCells);
registerPlugin(UndoRedo);

/**
 * A new `settings` object reaches `ngOnChanges` with every key, and the component passes only the keys
 * whose value differs from the copy it kept of the value it passed last.
 */
describe('HotTableComponent settings passed again on a change', () => {
  let fixture: ComponentFixture<HotTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HotTableModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  /**
   * Renders the component with the given settings.
   */
  function render(settings: GridSettings) {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = { licenseKey: TEST_LICENSE_KEY, ...settings };
    fixture.detectChanges();

    return fixture.componentInstance;
  }

  it('should apply a setting the app changed in place before passing a new settings object', () => {
    const mergeCells = [{ row: 0, col: 0, rowspan: 2, colspan: 2 }];
    const settings: GridSettings = {
      mergeCells,
      height: 200,
    };
    const component = render(settings);
    const updateSettingsSpy = jest.spyOn(component.hotInstance, 'updateSettings');

    mergeCells.push({ row: 2, col: 2, rowspan: 2, colspan: 2 });
    component.ngOnChanges({
      settings: new SimpleChange(settings, { ...settings }, false),
    });

    expect(updateSettingsSpy.mock.calls[0][0]).toEqual({ mergeCells });
    expect(component.hotInstance.getPlugin('mergeCells').mergedCellsCollection.get(2, 2)).toEqual(
      expect.objectContaining({ row: 2, col: 2, rowspan: 2, colspan: 2 })
    );
  });

  it('should leave out a setting passed again with the same content', () => {
    const settings: GridSettings = {
      mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
      height: 200,
    };
    const component = render(settings);
    const updateSettingsSpy = jest.spyOn(component.hotInstance, 'updateSettings');

    component.ngOnChanges({
      settings: new SimpleChange(settings, {
        ...settings,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
        height: 300,
      }, false),
    });

    expect(updateSettingsSpy.mock.calls[0][0]).toEqual({ height: 300 });
  });

  it('should always pass `data`, so rows added in place show', () => {
    const data = [['A1', 'B1']];
    const settings = { data, height: 200 } as GridSettings;
    const component = render(settings);

    data.push(['A2', 'B2']);
    component.ngOnChanges({
      settings: new SimpleChange(settings, { ...settings }, false),
    });

    expect(component.hotInstance.countRows()).toBe(2);
  });

  it('should compare a value with a cycle without overflowing the stack', () => {
    const makeTree = () => {
      const parent: Record<string, unknown> = { id: 1 };

      parent.__children = [{ id: 2, parent }];

      return { rows: [parent] };
    };
    const settings = { treeOption: makeTree(), height: 200 } as GridSettings;
    const component = render(settings);
    const updateSettingsSpy = jest.spyOn(component.hotInstance, 'updateSettings');

    expect(() => {
      component.ngOnChanges({
        settings: new SimpleChange(settings, { ...settings, treeOption: makeTree() }, false),
      });
    }).not.toThrow();
    expect(updateSettingsSpy.mock.calls[0][0]).toEqual({});
  });

  it('should keep the undo history when the new settings object passes the same data again', () => {
    const data = [['A1', 'B1'], ['A2', 'B2']];
    const settings: GridSettings = { data, height: 200 };
    const component = render(settings);
    const hot = component.hotInstance;
    const undoRedo = hot.getPlugin('undoRedo');

    hot.setDataAtCell(0, 0, 'edited');
    component.ngOnChanges({
      settings: new SimpleChange(settings, { ...settings }, false),
    });

    expect(undoRedo.isUndoAvailable()).toBe(true);

    undoRedo.undo();

    expect(hot.getDataAtCell(0, 0)).toBe('A1');
  });

  it('should drop the undo history when the new settings object passes other rows', () => {
    const settings: GridSettings = { data: [['A1', 'B1'], ['A2', 'B2']], height: 200 };
    const component = render(settings);
    const hot = component.hotInstance;

    hot.setDataAtCell(0, 0, 'edited');
    component.ngOnChanges({
      settings: new SimpleChange(settings, { ...settings, data: [['A1', 'B1'], ['A2', 'B2']] }, false),
    });

    expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
  });
});
