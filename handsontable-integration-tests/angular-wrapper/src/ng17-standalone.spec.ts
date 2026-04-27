/**
 * Angular 17 — standalone components without NgModule
 *
 * Angular 17 made standalone the default authoring style. These tests verify:
 * - Direct import of HotTableComponent (no HotTableModule needed)
 * - Custom standalone renderer extending HotCellRendererComponent
 * - Custom standalone editor extending HotCellEditorComponent
 * - viewChild() signal API to access the HotTableComponent reference
 * - Classic @ViewChild decorator still works alongside the new API
 */

import { Component, ViewChild, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HotTableComponent,
  HotCellRendererComponent,
  HotCellEditorComponent,
  HotCellRendererAdvancedComponent,
  GridSettings,
  NON_COMMERCIAL_LICENSE,
} from '@handsontable/angular-wrapper';

const LICENSE = NON_COMMERCIAL_LICENSE;

// ─── Standalone renderer ────────────────────────────────────────────────────

@Component({
  selector: 'app-badge-renderer',
  template: `<span class="badge">{{ value }}</span>`,
  standalone: true,
})
class BadgeRendererComponent extends HotCellRendererComponent<string> {}

// ─── Standalone advanced renderer ───────────────────────────────────────────

@Component({
  selector: 'app-tag-renderer',
  template: `<span class="tag" [class.active]="value === 'active'">{{ value }}</span>`,
  standalone: true,
})
class TagRendererAdvancedComponent extends HotCellRendererAdvancedComponent<string> {}

// ─── Standalone editor ──────────────────────────────────────────────────────

@Component({
  selector: 'app-text-editor',
  template: `<input #el [value]="getValue()" (input)="setValue($any($event.target).value)" />`,
  standalone: true,
})
class TextEditorComponent extends HotCellEditorComponent<string> {
  onFocus(): void {}
}

// ─── Host using HotTableComponent directly (no NgModule) ────────────────────

@Component({
  selector: 'app-standalone-host',
  template: `<hot-table [data]="data" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class StandaloneHostComponent {
  data: string[][] = [['London'], ['Berlin']];
  settings: GridSettings = { licenseKey: LICENSE };
}

// ─── Host with a standalone renderer ────────────────────────────────────────

@Component({
  selector: 'app-renderer-host',
  template: `<hot-table [data]="data" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class RendererHostComponent {
  data: string[][] = [['active'], ['inactive'], ['active']];
  settings: GridSettings = {
    licenseKey: LICENSE,
    columns: [{ renderer: BadgeRendererComponent }],
  };
}

// ─── Host with a standalone advanced renderer ────────────────────────────────

@Component({
  selector: 'app-advanced-renderer-host',
  template: `<hot-table [data]="data" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class AdvancedRendererHostComponent {
  data: string[][] = [['active'], ['inactive']];
  settings: GridSettings = {
    licenseKey: LICENSE,
    columns: [{ renderer: TagRendererAdvancedComponent }],
  };
}

// ─── Host with a standalone editor ──────────────────────────────────────────

@Component({
  selector: 'app-editor-host',
  template: `<hot-table [data]="data" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class EditorHostComponent {
  data: string[][] = [['editable value']];
  settings: GridSettings = {
    licenseKey: LICENSE,
    columns: [{ editor: TextEditorComponent }],
  };
}

// ─── Host using viewChild() signal (Angular 17+) ────────────────────────────

@Component({
  selector: 'app-view-child-signal-host',
  template: `<hot-table [data]="data" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class ViewChildSignalHostComponent {
  data: string[][] = [['signal', 'works']];
  settings: GridSettings = { licenseKey: LICENSE };

  hotTable = viewChild(HotTableComponent);
}

// ─── Host using classic @ViewChild decorator ─────────────────────────────────

@Component({
  selector: 'app-view-child-host',
  template: `<hot-table [data]="data" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class ViewChildHostComponent {
  data: string[][] = [['first'], ['second']];
  settings: GridSettings = { licenseKey: LICENSE };

  @ViewChild(HotTableComponent) hotTableRef!: HotTableComponent;
}

// ────────────────────────────────────────────────────────────────────────────

describe('Angular 17 — standalone components without NgModule', () => {
  describe('StandaloneHostComponent — direct HotTableComponent import', () => {
    let fixture: ComponentFixture<StandaloneHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [StandaloneHostComponent] });
      fixture = TestBed.createComponent(StandaloneHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('renders hot-table without importing HotTableModule', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('data is accessible on the Handsontable instance', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('London');
      expect(hotInstance.getDataAtCell(1, 0)).toBe('Berlin');
    });
  });

  describe('RendererHostComponent — standalone HotCellRendererComponent', () => {
    let fixture: ComponentFixture<RendererHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [RendererHostComponent] });
      fixture = TestBed.createComponent(RendererHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('renders the table with a standalone renderer', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('Handsontable instance exists and has the correct row count', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance).toBeTruthy();
      expect(hotInstance.countRows()).toBe(3);
    });
  });

  describe('AdvancedRendererHostComponent — standalone HotCellRendererAdvancedComponent', () => {
    let fixture: ComponentFixture<AdvancedRendererHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [AdvancedRendererHostComponent] });
      fixture = TestBed.createComponent(AdvancedRendererHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('renders the table with a standalone advanced renderer', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });
  });

  describe('EditorHostComponent — standalone HotCellEditorComponent', () => {
    let fixture: ComponentFixture<EditorHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [EditorHostComponent] });
      fixture = TestBed.createComponent(EditorHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('renders the table with a standalone editor in the column configuration', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('Handsontable instance is created with the editor configured', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance).toBeTruthy();
    });

    it('editor component reference is cleaned up on component destruction', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      const settings = hotInstance.getSettings();

      if (Array.isArray(settings.columns)) {
        const col = settings.columns[0] as any;
        if (col._editorComponentReference) {
          const destroySpy = jest.spyOn(col._editorComponentReference, 'destroy');
          fixture.destroy();
          expect(destroySpy).toHaveBeenCalled();
          return;
        }
      }
      fixture.destroy();
      expect(hotInstance.isDestroyed).toBe(true);
    });
  });

  describe('viewChild() — Angular 17+ signal API replacing @ViewChild decorator', () => {
    let fixture: ComponentFixture<ViewChildSignalHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ViewChildSignalHostComponent] });
      fixture = TestBed.createComponent(ViewChildSignalHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('viewChild() signal resolves to the HotTableComponent instance', () => {
      expect(fixture.componentInstance.hotTable()).toBeInstanceOf(HotTableComponent);
    });

    it('hotInstance is accessible through the viewChild() signal', () => {
      const hotRef = fixture.componentInstance.hotTable();
      expect(hotRef?.hotInstance).toBeTruthy();
      expect(hotRef?.hotInstance?.getDataAtCell(0, 0)).toBe('signal');
    });
  });

  describe('@ViewChild decorator — backward-compatible classic API', () => {
    let fixture: ComponentFixture<ViewChildHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ViewChildHostComponent] });
      fixture = TestBed.createComponent(ViewChildHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('@ViewChild(HotTableComponent) provides a reference to the component', () => {
      expect(fixture.componentInstance.hotTableRef).toBeInstanceOf(HotTableComponent);
    });

    it('hotInstance from @ViewChild has access to table data', () => {
      const hotInstance = fixture.componentInstance.hotTableRef.hotInstance;
      expect(hotInstance?.getDataAtCell(0, 0)).toBe('first');
    });
  });
});
