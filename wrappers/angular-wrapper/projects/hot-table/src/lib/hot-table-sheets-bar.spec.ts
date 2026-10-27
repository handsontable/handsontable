import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ComponentRef, CUSTOM_ELEMENTS_SCHEMA, NgZone, SimpleChange } from '@angular/core';
import Handsontable from 'handsontable/base';
import { registerPlugin, SheetsBar } from 'handsontable/plugins';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { NON_COMMERCIAL_LICENSE } from './services/hot-global-config.service';
import { HotCellRendererComponent } from './renderer/hot-cell-renderer.component';
import { HotCellEditorComponent } from './editor/hot-cell-editor.component';
import { GridSettings } from './models/grid-settings';

registerPlugin(SheetsBar);

/**
 * A renderer component a sheet declares in its own `settings`.
 */
@Component({
  selector: 'hot-test-sheet-renderer',
  template: 'Sheet renderer: {{ value }}',
  standalone: true,
})
class SheetRendererComponent extends HotCellRendererComponent<string> {}

/**
 * An editor component a sheet declares in its own `settings`.
 */
@Component({
  selector: 'hot-test-sheet-editor',
  template: '<input />',
  standalone: true,
})
class SheetEditorComponent extends HotCellEditorComponent<string> {
  onFocus(): void {}
}

/**
 * An editor component the grid-level `columns` declare.
 */
@Component({
  selector: 'hot-test-grid-editor',
  template: '<input />',
  standalone: true,
})
class GridEditorComponent extends HotCellEditorComponent<string> {
  onFocus(): void {}
}

/**
 * An editor component that counts how many times it was created.
 */
@Component({
  selector: 'hot-test-counted-editor',
  template: '<input />',
  standalone: true,
})
class CountedEditorComponent extends HotCellEditorComponent<string> {
  static created = 0;

  constructor() {
    super();
    CountedEditorComponent.created += 1;
  }

  onFocus(): void {}
}

/**
 * Returns the grid's SheetsBar plugin, narrowed to its class.
 *
 * @param hot The grid.
 * @returns The plugin.
 */
function sheetsBarOf(hot: Handsontable): SheetsBar {
  const plugin = hot.getPlugin('sheetsBar');

  if (!(plugin instanceof SheetsBar)) {
    throw new Error('The SheetsBar plugin is not registered.');
  }

  return plugin;
}

/**
 * Returns the editor component the visible sheet's first column holds.
 *
 * @param hot The grid.
 * @returns The component ref, if any.
 */
function firstColumnEditorRef(hot: Handsontable): ComponentRef<unknown> | undefined {
  const columns = hot.getSettings().columns;

  return Array.isArray(columns) ? columns[0]?._editorComponentReference : undefined;
}

/**
 * Creates the component with the settings given and runs the first change detection.
 *
 * @param settings The `settings` input.
 * @returns The fixture.
 */
function createGrid(settings: GridSettings): ComponentFixture<HotTableComponent> {
  const fixture = TestBed.createComponent(HotTableComponent);

  fixture.componentInstance.settings = { licenseKey: NON_COMMERCIAL_LICENSE, ...settings };
  fixture.detectChanges();

  return fixture;
}

/**
 * The sheets bar through the Angular wrapper: a change of the `settings` input sends every key again, and
 * the visible sheet keeps the settings it declares.
 */
describe('HotTableComponent with a sheets bar', () => {
  let fixture: ComponentFixture<HotTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HotTableModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  it('should keep the visible sheet\'s own headers when the `settings` input changes', () => {
    const sheets = [
      { name: 'Plain', data: [[1, 2]] },
      { name: 'Own', data: [[3, 4]], settings: { colHeaders: ['X', 'Y'] } },
    ];
    const settings = () => ({
      licenseKey: NON_COMMERCIAL_LICENSE,
      colHeaders: ['a', 'b'],
      sheetsBar: { sheets },
    });

    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = settings();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const hot = component.hotInstance;
    const plugin = sheetsBarOf(hot);

    plugin.setActiveSheet('Own');

    const next = { ...settings(), height: 300 };

    component.settings = next;
    component.ngOnChanges({ settings: new SimpleChange(null, next, false) });

    expect(hot.getColHeader(0)).toBe('X');

    plugin.setActiveSheet('Plain');

    expect(hot.getColHeader(0)).toBe('a');
  });

  describe('a sheet\'s own `settings`', () => {
    it('should render a renderer component the opening sheet declares', () => {
      fixture = createGrid({
        sheetsBar: {
          activeSheet: 1,
          sheets: [
            { name: 'Plain', data: [['a']] },
            { name: 'Own', data: [['b']], settings: { columns: [{ renderer: SheetRendererComponent }] } },
          ],
        },
      });

      const hot = fixture.componentInstance.hotInstance;

      expect(hot.getCell(0, 0)?.textContent).toContain('Sheet renderer: b');
    });

    it('should render a renderer component of a sheet the user switches to', () => {
      fixture = createGrid({
        sheetsBar: {
          sheets: [
            { name: 'Plain', data: [['a']] },
            { name: 'Own', data: [['b']], settings: { columns: [{ renderer: SheetRendererComponent }] } },
          ],
        },
      });

      const hot = fixture.componentInstance.hotInstance;

      sheetsBarOf(hot).setActiveSheet('Own');

      expect(hot.getCell(0, 0)?.textContent).toContain('Sheet renderer: b');
    });

    it('should open an editor component the sheet declares', () => {
      fixture = createGrid({
        sheetsBar: {
          activeSheet: 1,
          sheets: [
            { name: 'Plain', data: [['a']] },
            { name: 'Own', data: [['b']], settings: { columns: [{ editor: SheetEditorComponent }] } },
          ],
        },
      });

      const hot = fixture.componentInstance.hotInstance;

      hot.selectCell(0, 0);

      const editor = hot.getActiveEditor();

      if (!editor) {
        throw new Error('No editor was prepared for the selected cell.');
      }

      editor.beginEditing();

      const editorRef = firstColumnEditorRef(hot);

      expect(editor.isOpened()).toBe(true);
      expect(editorRef?.instance).toBeInstanceOf(SheetEditorComponent);

      editor.setValue('typed');
      editor.finishEditing();

      expect(hot.getDataAtCell(0, 0)).toBe('typed');
    });

    it('should answer a validator that returns a boolean', async () => {
      fixture = createGrid({
        sheetsBar: {
          activeSheet: 1,
          sheets: [
            { name: 'Plain', data: [[1]] },
            { name: 'Own', data: [[1], [1]], settings: { columns: [{ validator: (value: number) => value > 0 }] } },
          ],
        },
      });

      const hot = fixture.componentInstance.hotInstance;
      const written = (row: number, value: number) => new Promise<void>((resolve) => {
        hot.addHookOnce('afterValidate', () => {
          setTimeout(resolve);
        });
        hot.setDataAtCell(row, 0, value);
      });

      await written(0, -1);
      await written(1, 5);

      expect(hot.getDataAtCol(0)).toEqual([-1, 5]);
      expect(hot.getCellMeta(0, 0).valid).toBe(false);
      expect(hot.getCellMeta(1, 0).valid).toBe(true);
    });

    it('should run a hook the sheet declares inside the Angular zone', () => {
      const zones: boolean[] = [];

      fixture = createGrid({
        sheetsBar: {
          activeSheet: 1,
          sheets: [
            { name: 'Plain', data: [['a']] },
            {
              name: 'Own',
              data: [['b']],
              settings: { afterSelection: () => zones.push(NgZone.isInAngularZone()) },
            },
          ],
        },
      });

      const hot = fixture.componentInstance.hotInstance;

      fixture.componentInstance.ngZone.runOutsideAngular(() => hot.selectCell(0, 0));

      expect(zones).toEqual([true]);
    });

    it('should run a hook of a sheet the user switches to inside the Angular zone', () => {
      const zones: boolean[] = [];

      fixture = createGrid({
        sheetsBar: {
          sheets: [
            { name: 'Plain', data: [['a']] },
            {
              name: 'Own',
              data: [['b']],
              settings: { afterSelection: () => zones.push(NgZone.isInAngularZone()) },
            },
          ],
        },
      });

      const hot = fixture.componentInstance.hotInstance;

      sheetsBarOf(hot).setActiveSheet('Own');
      fixture.componentInstance.ngZone.runOutsideAngular(() => hot.selectCell(0, 0));

      expect(zones).toEqual([true]);
    });

    it('should render a renderer component in a duplicated sheet', () => {
      fixture = createGrid({
        sheetsBar: {
          sheets: [
            { name: 'Plain', data: [['a']] },
            { name: 'Own', data: [['b']], settings: { columns: [{ renderer: SheetRendererComponent }] } },
          ],
        },
      });

      const hot = fixture.componentInstance.hotInstance;
      const plugin = sheetsBarOf(hot);
      const own = plugin.getSheets().find(sheet => sheet.name === 'Own');
      const copy = own ? plugin.duplicateSheet(own.id) : null;

      if (!copy) {
        throw new Error('The sheet was not duplicated.');
      }

      plugin.setActiveSheet(copy.id);

      expect(hot.getCell(0, 0)?.textContent).toContain('Sheet renderer: b');
    });

    it('should render a renderer component set through `updateSheetSettings()`', () => {
      fixture = createGrid({
        sheetsBar: {
          activeSheet: 1,
          sheets: [
            { name: 'Plain', data: [['a']] },
            { name: 'Own', data: [['b']] },
          ],
        },
      });

      const hot = fixture.componentInstance.hotInstance;

      sheetsBarOf(hot).updateSheetSettings('Own', { columns: [{ renderer: SheetRendererComponent }] });

      expect(hot.getCell(0, 0)?.textContent).toContain('Sheet renderer: b');
    });

    it('should keep the renderer and the editor component of a sheet the user returns to', () => {
      fixture = createGrid({
        sheetsBar: {
          sheets: [
            { name: 'Plain', data: [['a']] },
            {
              name: 'Own',
              data: [['b', 'c']],
              settings: { columns: [{ renderer: SheetRendererComponent }, { editor: SheetEditorComponent }] },
            },
          ],
        },
      });

      const hot = fixture.componentInstance.hotInstance;
      const plugin = sheetsBarOf(hot);
      const editorRefOfColumn = (column: number) => {
        const columns = hot.getSettings().columns;

        return Array.isArray(columns) ? columns[column]?._editorComponentReference : undefined;
      };

      plugin.setActiveSheet('Own');

      const editorRef = editorRefOfColumn(1);

      plugin.setActiveSheet('Plain');
      plugin.setActiveSheet('Own');

      expect(editorRef).toBeDefined();
      expect(editorRefOfColumn(1)).toBe(editorRef);
      expect(hot.getCell(0, 0)?.textContent).toContain('Sheet renderer: b');
    });

    it('should create no new editor component when the same sheet columns are declared again', () => {
      fixture = createGrid({
        sheetsBar: {
          activeSheet: 1,
          sheets: [
            { name: 'Plain', data: [['a']] },
            { name: 'Own', data: [['b']], settings: { columns: [{ editor: CountedEditorComponent }] } },
          ],
        },
      });

      const plugin = sheetsBarOf(fixture.componentInstance.hotInstance);
      const own = plugin.getSheets().find(sheet => sheet.name === 'Own');

      plugin.updateSheetSettings('Own', { columns: [{ editor: CountedEditorComponent }] });
      plugin.updateSheetSettings('Own', { columns: [{ editor: CountedEditorComponent }] });

      const copy = own ? plugin.duplicateSheet(own.id) : null;

      if (!copy) {
        throw new Error('The sheet was not duplicated.');
      }

      plugin.setActiveSheet(copy.id);

      expect(CountedEditorComponent.created).toBe(1);
    });

    it('should leave the host\'s `sheets` entries as declared', () => {
      const column = { renderer: SheetRendererComponent, editor: SheetEditorComponent };
      const ownSettings = { columns: [column] };
      const sheets = [
        { name: 'Plain', data: [['a']] },
        { name: 'Own', data: [['b']], settings: ownSettings },
      ];

      fixture = createGrid({ sheetsBar: { activeSheet: 1, sheets } });

      expect(sheets[1].settings).toBe(ownSettings);
      expect(ownSettings.columns[0]).toBe(column);
      expect(column).toEqual({ renderer: SheetRendererComponent, editor: SheetEditorComponent });
    });
  });

  describe('editor components', () => {
    it('should destroy the grid-level editor components when the grid is destroyed on a sheet with its own columns', () => {
      fixture = createGrid({
        columns: [{ editor: GridEditorComponent }],
        sheetsBar: {
          sheets: [
            { name: 'Plain', data: [['a']] },
            { name: 'Own', data: [['b']], settings: { columns: [{ editor: SheetEditorComponent }] } },
          ],
        },
      });

      const hot = fixture.componentInstance.hotInstance;
      const gridEditor = firstColumnEditorRef(hot);

      sheetsBarOf(hot).setActiveSheet('Own');

      const sheetEditor = firstColumnEditorRef(hot);

      if (!gridEditor || !sheetEditor) {
        throw new Error('The editor components were not created.');
      }

      const gridDestroy = jest.spyOn(gridEditor, 'destroy');
      const sheetDestroy = jest.spyOn(sheetEditor, 'destroy');

      fixture.componentInstance.ngOnDestroy();

      expect(gridDestroy).toHaveBeenCalled();
      expect(sheetDestroy).toHaveBeenCalled();
    });

    it('should keep the visible sheet\'s editor component when the `settings` input changes', () => {
      const sheetsBar = {
        sheets: [
          { name: 'Plain', data: [['a']] },
          { name: 'Own', data: [['b']], settings: { columns: [{ editor: SheetEditorComponent }] } },
        ],
      };

      fixture = createGrid({ columns: [{ editor: GridEditorComponent }], sheetsBar });

      const component = fixture.componentInstance;
      const hot = component.hotInstance;

      const gridEditor = firstColumnEditorRef(hot);

      sheetsBarOf(hot).setActiveSheet('Own');

      const sheetEditor = firstColumnEditorRef(hot);

      if (!gridEditor || !sheetEditor) {
        throw new Error('The editor components were not created.');
      }

      const gridEditorDestroy = jest.spyOn(gridEditor, 'destroy');

      const sheetDestroy = jest.spyOn(sheetEditor, 'destroy');
      const next = {
        licenseKey: NON_COMMERCIAL_LICENSE,
        columns: [{ editor: GridEditorComponent, data: 'other' }],
        sheetsBar,
      };

      component.settings = next;
      component.ngOnChanges({ settings: new SimpleChange(null, next, false) });

      expect(sheetDestroy).not.toHaveBeenCalled();
      expect(gridEditorDestroy).toHaveBeenCalledTimes(1);
      expect(firstColumnEditorRef(hot)).toBe(sheetEditor);
    });
  });

  describe('hooks passed to the instance', () => {
    it('should register a hook passed to `hotInstance.updateSettings()` as given', () => {
      const callback = jest.fn();

      fixture = createGrid({ data: [['a']] });

      const hot = fixture.componentInstance.hotInstance;

      hot.updateSettings({ afterSelection: callback });

      expect(hot.getSettings().afterSelection).toBe(callback);

      hot.removeHook('afterSelection', callback);
      hot.selectCell(0, 0);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should run a hook passed to `updateSheetSettings()` as given', () => {
      const zones: boolean[] = [];
      const callback = () => zones.push(NgZone.isInAngularZone());

      fixture = createGrid({
        sheetsBar: {
          activeSheet: 1,
          sheets: [
            { name: 'Plain', data: [['a']] },
            { name: 'Own', data: [['b']] },
          ],
        },
      });

      const component = fixture.componentInstance;
      const hot = component.hotInstance;

      sheetsBarOf(hot).updateSheetSettings('Own', { afterSelection: callback });
      component.ngZone.runOutsideAngular(() => hot.selectCell(0, 0));

      expect(hot.getSettings().afterSelection).toBe(callback);
      expect(zones).toEqual([false]);
    });
  });

  describe('the tab strip', () => {
    it('should not run change detection for a tab event after a sheet was added inside the Angular zone', () => {
      fixture = createGrid({
        sheetsBar: { sheets: [{ name: 'Plain', data: [['a']] }] },
      });

      const component = fixture.componentInstance;
      const hot = component.hotInstance;

      component.ngZone.run(() => sheetsBarOf(hot).addSheet());

      const tab = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab');

      if (!tab) {
        throw new Error('The tab strip has no tab.');
      }

      let turns = 0;
      const subscription = component.ngZone.onUnstable.subscribe(() => {
        turns += 1;
      });

      tab.dispatchEvent(new Event('pointerup', { bubbles: true }));
      tab.dispatchEvent(new Event('pointercancel', { bubbles: true }));
      subscription.unsubscribe();

      expect(turns).toBe(0);
    });
  });
});
