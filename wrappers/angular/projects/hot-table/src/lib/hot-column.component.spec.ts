import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotTableModule, HotTableRegisterer } from '@handsontable/angular';

@Component({
  selector: 'hot-test-component',
  template: ''
})
export class TestComponent {
  public prop: object = {};
  id = 'hot';

  constructor (private _registerer: HotTableRegisterer) { }

  getHotInstance(instance: string) {
    return this._registerer.getInstance(instance);
  }
}

describe('HotColumnComponent', () => {
  let fixture: ComponentFixture<TestComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      imports: [ HotTableModule.forRoot() ],
      declarations: [ TestComponent ],
    });
  }));

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it(`should be possible to render static hot-column element inside hot-table`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot">
            <hot-column></hot-column>
            <hot-column></hot-column>
            <hot-column></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;

      fixture.detectChanges();
      expect(app.getHotInstance(app.id).countCols()).toBe(3);
    });
  });

  it(`should be possible to change dynamically the number of columns`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot">
            <hot-column *ngFor="let column of prop.columns; let i = index"></hot-column>
          </hot-table>
        `
      }
    });
    await await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;

      app.prop['columns'] = [ {}, {}, {} ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).countCols()).toBe(3);

      app.prop['columns'].push({});
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).countCols()).toBe(4);
    });
  });

  it(`should set allowEmpty defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [allowEmpty]="column.allowEmpty"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        allowEmpty: false
      };
      app.prop['columns'] = [
        {},
        {
          allowEmpty: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['allowEmpty']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['allowEmpty']).toBe(true);
    });
  });

  it(`should set allowHtml defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [allowHtml]="column.allowHtml"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        allowHtml: false
      };
      app.prop['columns'] = [
        {},
        {
          allowHtml: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['allowHtml']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['allowHtml']).toBe(true);
    });
  });

  it(`should set allowInvalid defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [allowInvalid]="column.allowInvalid"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        allowInvalid: false
      };
      app.prop['columns'] = [
        {},
        {
          allowInvalid: true
        }
      ];

      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['allowInvalid']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['allowInvalid']).toBe(true);
    });
  });

  it(`should set checkedTemplate defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [checkedTemplate]="column.checkedTemplate"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        checkedTemplate: false
      };
      app.prop['columns'] = [
        {},
        {
          checkedTemplate: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['checkedTemplate']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['checkedTemplate']).toBe(true);
    });
  });

  it(`should set className defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [className]="column.className"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        className: 'test'
      };
      app.prop['columns'] = [
        {},
        {
          className: 'testtest'
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['className']).toBe('test');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['className']).toBe('testtest');
    });
  });

  it(`should set columnSorting defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [columnSorting]="column.columnSorting"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        columnSorting: false
      };
      app.prop['columns'] = [
        {},
        {
          columnSorting: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['columnSorting']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['columnSorting']).toBe(true);
    });
  });

  it(`should set colWidths defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [colWidths]="column.colWidths"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        colWidths: 100
      };
      app.prop['columns'] = [
        {},
        {
          colWidths: 200
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['colWidths']).toBe(100);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['colWidths']).toBe(200);
    });
  });

  it(`should set commentedCellClassName defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [commentedCellClassName]="column.commentedCellClassName"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        commentedCellClassName: 'test'
      };
      app.prop['columns'] = [
        {},
        {
          commentedCellClassName: 'testtest'
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['commentedCellClassName']).toBe('test');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['commentedCellClassName']).toBe('testtest');
    });
  });

  it(`should set copyable defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [copyable]="column.copyable"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        copyable: false
      };
      app.prop['columns'] = [
        {},
        {
          copyable: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['copyable']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['copyable']).toBe(true);
    });
  });

  it(`should set correctFormat defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [correctFormat]="column.correctFormat"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        correctFormat: false
      };
      app.prop['columns'] = [
        {},
        {
          correctFormat: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['correctFormat']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['correctFormat']).toBe(true);
    });
  });

  it(`should set data defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [data]="column.data"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        data: [[1, 2]]
      };
      app.prop['columns'] = [
        {},
        {
          data: 0
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['data']).toBe(void 0);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['data']).toBe(0);
    });
  });

  it(`should set dateFormat defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [dateFormat]="column.dateFormat"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        dateFormat: 'DD/MM/YYYY'
      };
      app.prop['columns'] = [
        {},
        {
          dateFormat: 'YYYY/DD/MM'
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['dateFormat']).toBe('DD/MM/YYYY');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['dateFormat']).toBe('YYYY/DD/MM');
    });
  });

  it(`should set defaultDate defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [defaultDate]="column.defaultDate"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        defaultDate: 'DD/MM/YYYY'
      };
      app.prop['columns'] = [
        {},
        {
          defaultDate: 'YYYY/DD/MM'
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['defaultDate']).toBe('DD/MM/YYYY');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['defaultDate']).toBe('YYYY/DD/MM');
    });
  });

  it(`should set editor defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [editor]="column.editor"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        editor: false
      };
      app.prop['columns'] = [
        {},
        {
          editor: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['editor']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['editor']).toBe(true);
    });
  });

  it(`should set filteringCaseSensitive defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [filteringCaseSensitive]="column.filteringCaseSensitive"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        filteringCaseSensitive: false
      };
      app.prop['columns'] = [
        {},
        {
          filteringCaseSensitive: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['filteringCaseSensitive']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['filteringCaseSensitive']).toBe(true);
    });
  });

  it(`should set invalidCellClassName defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [invalidCellClassName]="column.invalidCellClassName"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        invalidCellClassName: 'test'
      };
      app.prop['columns'] = [
        {},
        {
          invalidCellClassName: 'testtest'
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['invalidCellClassName']).toBe('test');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['invalidCellClassName']).toBe('testtest');
    });
  });

  it(`should set label defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [label]="column.label"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        label: {position: 'after', value: 'test'}
      };
      app.prop['columns'] = [
        {},
        {
          label: {position: 'before', value: 'testtest'}
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['label']['position']).toBe('after');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['label']['position']).toBe('before');
    });
  });
  it(`should set language defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [language]="column.language"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        language: 'en-US'
      };
      app.prop['columns'] = [
        {},
        { language: 'pt-BR' },
        { language: 'it-IT' },
        {},
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['language']).toBe('en-US');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['language']).toBe('pt-BR');
      expect(app.getHotInstance(app.id).getCellMeta(0, 2)['language']).toBe('it-IT');
      expect(app.getHotInstance(app.id).getCellMeta(0, 3)['language']).toBe('en-US');
    });
  });

  it(`should set noWordWrapClassName defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [noWordWrapClassName]="column.noWordWrapClassName"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        noWordWrapClassName: 'test'
      };
      app.prop['columns'] = [
        {},
        {
          noWordWrapClassName: 'testtest'
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['noWordWrapClassName']).toBe('test');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['noWordWrapClassName']).toBe('testtest');
    });
  });

  it(`should set placeholder defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [placeholder]="column.placeholder"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        placeholder: 'from GridSettings'
      };
      app.prop['columns'] = [
        {},
        {
          placeholder: 'from ColumnSettings'
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['placeholder']).toBe('from GridSettings');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['placeholder']).toBe('from ColumnSettings');
    });
  });

  it(`should set placeholderCellClassName defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [placeholderCellClassName]="column.placeholderCellClassName"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        placeholderCellClassName: 'test'
      };
      app.prop['columns'] = [
        {},
        {
          placeholderCellClassName: 'testtest'
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['placeholderCellClassName']).toBe('test');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['placeholderCellClassName']).toBe('testtest');
    });
  });

  it(`should set readOnly defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [readOnly]="column.readOnly"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        readOnly: false
      };
      app.prop['columns'] = [
        {},
        {
          readOnly: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['readOnly']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['readOnly']).toBe(true);
    });
  });

  it(`should set readOnlyCellClassName defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [readOnlyCellClassName]="column.readOnlyCellClassName"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        readOnlyCellClassName: 'test'
      };
      app.prop['columns'] = [
        {},
        {
          readOnlyCellClassName: 'testtest'
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['readOnlyCellClassName']).toBe('test');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['readOnlyCellClassName']).toBe('testtest');
    });
  });

  it(`should set renderer defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [renderer]="column.renderer"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        renderer: 'date'
      };
      app.prop['columns'] = [
        {},
        {
          renderer: 'text'
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['renderer']).toBe('date');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['renderer']).toBe('text');
    });
  });

  it(`should set selectOptions defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [selectOptions]="column.selectOptions"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        selectOptions: ['A']
      };
      app.prop['columns'] = [
        {},
        {
          selectOptions: ['B']
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['selectOptions'][0]).toBe('A');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['selectOptions'][0]).toBe('B');
    });
  });

  it(`should set skipColumnOnPaste defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [skipColumnOnPaste]="column.skipColumnOnPaste"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        skipColumnOnPaste: false
      };
      app.prop['columns'] = [
        {},
        {
          skipColumnOnPaste: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['skipColumnOnPaste']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['skipColumnOnPaste']).toBe(true);
    });
  });

  it(`should set sortByRelevance defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [sortByRelevance]="column.sortByRelevance"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        sortByRelevance: false
      };
      app.prop['columns'] = [
        {},
        {
          sortByRelevance: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['sortByRelevance']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['sortByRelevance']).toBe(true);
    });
  });

  it(`should set source defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [source]="column.source"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        source: ['A']
      };
      app.prop['columns'] = [
        {},
        {
          source: ['B']
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['source'][0]).toBe('A');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['source'][0]).toBe('B');
    });
  });

  it(`should set strict defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [strict]="column.strict"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        strict: false
      };
      app.prop['columns'] = [
        {},
        {
          strict: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['strict']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['strict']).toBe(true);
    });
  });

  it(`should set title defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [title]="column.title"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        title: 'test'
      };
      app.prop['columns'] = [
        {},
        {
          title: 'testtest'
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['title']).toBe('test');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['title']).toBe('testtest');
    });
  });

  it(`should set trimDropdown defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [trimDropdown]="column.trimDropdown"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        trimDropdown: false
      };
      app.prop['columns'] = [
        {},
        {
          trimDropdown: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['trimDropdown']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['trimDropdown']).toBe(true);
    });
  });

  it(`should set type defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [type]="column.type"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        type: 'date'
      };
      app.prop['columns'] = [
        {},
        {
          type: 'text'
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['type']).toBe('date');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['type']).toBe('text');
    });
  });

  it(`should set uncheckedTemplate defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [uncheckedTemplate]="column.uncheckedTemplate"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        uncheckedTemplate: false
      };
      app.prop['columns'] = [
        {},
        {
          uncheckedTemplate: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['uncheckedTemplate']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['uncheckedTemplate']).toBe(true);
    });
  });

  it(`should set validator defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [validator]="column.validator"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      const newValidator = function() {};
      app.prop['settings'] = {
        validator: 'numeric'
      };
      app.prop['columns'] = [
        {},
        { validator: /^[0-9]$/ },
        { validator: newValidator },
        { validator: void 0 },
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['validator']).toBe('numeric');
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['validator'].toString()).toBe('/^[0-9]$/');
      expect(app.getHotInstance(app.id).getCellMeta(0, 2)['validator']).toBe(newValidator);
    });
  });

  it(`should set visibleRows defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [visibleRows]="column.visibleRows"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        visibleRows: 1
      };
      app.prop['columns'] = [
        {},
        {
          visibleRows: 2
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['visibleRows']).toBe(1);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['visibleRows']).toBe(2);
    });
  });

  it(`should set width defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [width]="column.width"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        width: 100
      };
      app.prop['columns'] = [
        {},
        {
          width: 10
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['width']).toBe(void 0);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['width']).toBe(10);
    });
  });

  it(`should set wordWrap defined as bindings`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table hotId="hot" [settings]="prop.settings">
            <hot-column *ngFor="let column of prop.columns; let i = index"
                        [wordWrap]="column.wordWrap"></hot-column>
          </hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;
      app.prop['settings'] = {
        wordWrap: false
      };
      app.prop['columns'] = [
        {},
        {
          wordWrap: true
        }
      ];
      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getCellMeta(0, 0)['wordWrap']).toBe(false);
      expect(app.getHotInstance(app.id).getCellMeta(0, 1)['wordWrap']).toBe(true);
    });
  });
});
