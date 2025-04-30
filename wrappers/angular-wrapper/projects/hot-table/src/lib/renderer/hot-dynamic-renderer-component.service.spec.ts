import {ApplicationRef, Component, CUSTOM_ELEMENTS_SCHEMA, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicComponentService } from './hot-dynamic-renderer-component.service';
import Handsontable from 'handsontable';
import {HotCellRendererComponent} from './hot-cell-renderer.component';

// Dummy component to be used as a dynamic renderer.
@Component({
  selector: 'hot-dummy-renderer',
  template: `<div>Component Renderer: {{ value }}</div>`,
})
class DummyRendererComponent extends HotCellRendererComponent {

}

// Dummy host component to provide a TemplateRef.
@Component({
  selector: 'hot-dummy-template-host',
  template: `
    <ng-template #dummyTemplate let-value="value" let-row="row" let-col="col">
      <div>Template Renderer: {{ value }} (Row: {{ row }}, Col: {{ col }})</div>
    </ng-template>

    <ng-template #dummyContainer></ng-template>
  `,
})
class DummyTemplateHostComponent {
  @ViewChild('dummyTemplate', { static: true }) dummyTemplate!: TemplateRef<any>;

  @ViewChild('dummyContainer', { read: ViewContainerRef, static: true }) dummyContainer!: ViewContainerRef;
}

// Create a minimal dummy Handsontable instance (stub).
const dummyHTInstance = {} as Handsontable.Core;

// Helper function to create a dummy TD element.
function createDummyTD(): HTMLTableCellElement {
  return document.createElement('td');
}

describe('DynamicComponentService - createRendererFromComponent', () => {
  let service: DynamicComponentService;
  let fixtureTemplate: ComponentFixture<DummyTemplateHostComponent>;
  let templateHost: DummyTemplateHostComponent;
  let appRef: ApplicationRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DummyRendererComponent, DummyTemplateHostComponent],
      providers: [DynamicComponentService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    appRef = TestBed.inject(ApplicationRef);
    service = TestBed.inject(DynamicComponentService);
    fixtureTemplate = TestBed.createComponent(DummyTemplateHostComponent);
    templateHost = fixtureTemplate.componentInstance;
    fixtureTemplate.detectChanges();
  });

  describe('when using a component as renderer', () => {
    it('should create a renderer function that attaches a component to the TD element', () => {
      const rendererFn = service.createRendererFromComponent(DummyRendererComponent, { custom: 'dummy' }, false);

      const td = createDummyTD();

      const row = 1;
      const col = 2;
      const prop = 'testProp';
      const value = 'Component Test';
      const cellProperties: Handsontable.CellProperties = {} as any;

      rendererFn(dummyHTInstance, td, row, col, prop, value, cellProperties);
      appRef.tick();

      expect(td.innerHTML).toContain('<hot-dummy-renderer><div>Component Renderer: Component Test</div></hot-dummy-renderer>');
    });
  });

  describe('when using a TemplateRef as renderer', () => {
    it('should create a renderer function that attaches an embedded view to the TD element', () => {
      const rendererFn = service.createRendererFromComponent(templateHost.dummyTemplate, {}, false);

      const td = createDummyTD();

      const row = 3;
      const col = 4;
      const prop = 'testProp';
      const value = 'Template Test';
      const cellProperties: Handsontable.CellProperties = {} as any;

      rendererFn(dummyHTInstance, td, row, col, prop, value, cellProperties);
      appRef.tick();

      expect(td.innerHTML).toContain('Template Renderer: Template Test');
      expect(td.innerHTML).toContain('(Row: 3, Col: 4)');
    });
  });
});
