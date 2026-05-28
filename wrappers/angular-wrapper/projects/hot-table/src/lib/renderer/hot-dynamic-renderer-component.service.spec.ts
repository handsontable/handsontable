import { ApplicationRef, Component, createComponent, CUSTOM_ELEMENTS_SCHEMA, EnvironmentInjector, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DynamicComponentService,
  INVALID_RENDERER_WARNING,
  INVALID_ADVANCED_RENDERER_WARNING,
  isTemplateRef,
  isHotCellRendererComponent,
  isAdvancedHotCellRendererComponent,
} from './hot-dynamic-renderer-component.service';
import Handsontable from 'handsontable';
import { HotCellRendererComponent } from './hot-cell-renderer.component';
import { rendererFactory } from 'handsontable/renderers';
import { HotCellRendererAdvancedComponent } from './hot-cell-renderer-advanced.component';

// Dummy component to be used as a dynamic renderer.
@Component({
  selector: 'hot-dummy-renderer',
  template: `<div>Component Renderer: {{ value }}</div>`,
  standalone: true,
})
class DummyRendererComponent extends HotCellRendererComponent {}

// Dummy advanced component to be used as a dynamic renderer.
@Component({
  selector: 'hot-dummy-renderer-advanced',
  template: `<div>Component Renderer: {{ value }}</div>`,
  standalone: true,
})
class DummyRendererAdvancedComponent extends HotCellRendererAdvancedComponent {}

// Dummy host component to provide a TemplateRef.
@Component({
  selector: 'hot-dummy-template-host',
  template: `
    <ng-template #dummyTemplate let-value="value" let-row="row" let-col="col">
      <div>Template Renderer: {{ value }} (Row: {{ row }}, Col: {{ col }})</div>
    </ng-template>

    <ng-template #dummyContainer></ng-template>
  `,
  standalone: true,
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
      imports: [DummyRendererComponent, DummyTemplateHostComponent],
      providers: [DynamicComponentService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
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

  describe('when re-rendering the same TD with a component', () => {
    it('should destroy the previous ComponentRef and not duplicate content', () => {
      const rendererFn = service.createRendererFromComponent(DummyRendererComponent, {}, false);
      const td = createDummyTD();
      const cellProperties: Handsontable.CellProperties = {} as any;

      rendererFn(dummyHTInstance, td, 0, 0, 'prop', 'first', cellProperties);
      appRef.tick();
      expect(td.innerHTML).toContain('Component Renderer: first');

      const detachSpy = jest.spyOn(appRef, 'detachView');

      rendererFn(dummyHTInstance, td, 0, 0, 'prop', 'second', cellProperties);
      appRef.tick();

      expect(detachSpy).toHaveBeenCalledTimes(1);
      expect(td.innerHTML).toContain('Component Renderer: second');
      expect(td.innerHTML).not.toContain('Component Renderer: first');
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

  describe('when re-rendering the same TD with a TemplateRef', () => {
    it('should destroy the previous embedded view and not duplicate content', () => {
      const rendererFn = service.createRendererFromComponent(templateHost.dummyTemplate, {}, false);
      const td = createDummyTD();
      const cellProperties: Handsontable.CellProperties = {} as any;

      rendererFn(dummyHTInstance, td, 0, 0, 'prop', 'first', cellProperties);
      appRef.tick();
      expect(td.textContent).toContain('Template Renderer: first');

      rendererFn(dummyHTInstance, td, 0, 0, 'prop', 'second', cellProperties);
      appRef.tick();

      expect(td.textContent).toContain('Template Renderer: second');
      expect(td.textContent).not.toContain('Template Renderer: first');
    });
  });

  describe('when passing an invalid renderer', () => {
    it('should log a warning when component is neither TemplateRef nor HotCellRendererComponent', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const rendererFn = service.createRendererFromComponent({} as any, {}, false);
      rendererFn(dummyHTInstance, createDummyTD(), 0, 0, 'prop', 'value', {} as any);

      expect(warnSpy).toHaveBeenCalledWith(INVALID_RENDERER_WARNING);
      warnSpy.mockRestore();
    });
  });

  describe('when register=true', () => {
    it('should call Handsontable.renderers.registerRenderer with a valid HotCellRendererComponent', () => {
      if (!(Handsontable.renderers as any).registerRenderer) {
        (Handsontable.renderers as any).registerRenderer = jest.fn();
      }
      const registerSpy = jest.spyOn(Handsontable.renderers as any, 'registerRenderer').mockImplementation(() => {});

      const rendererFn = service.createRendererFromComponent(DummyRendererComponent, {}, true);
      rendererFn(dummyHTInstance, createDummyTD(), 0, 0, 'prop', 'value', {} as any);

      expect(registerSpy).toHaveBeenCalled();
      registerSpy.mockRestore();
    });

    it('should call registerRenderer only once even when the renderer function is called multiple times', () => {
      if (!(Handsontable.renderers as any).registerRenderer) {
        (Handsontable.renderers as any).registerRenderer = jest.fn();
      }
      const registerSpy = jest.spyOn(Handsontable.renderers as any, 'registerRenderer').mockImplementation(() => {});
      const td = createDummyTD();
      const cellProperties: Handsontable.CellProperties = {} as any;

      const rendererFn = service.createRendererFromComponent(DummyRendererComponent, {}, true);
      rendererFn(dummyHTInstance, td, 0, 0, 'prop', 'first', cellProperties);
      rendererFn(dummyHTInstance, td, 0, 0, 'prop', 'second', cellProperties);
      rendererFn(dummyHTInstance, td, 0, 0, 'prop', 'third', cellProperties);

      expect(registerSpy).toHaveBeenCalledTimes(1);
      registerSpy.mockRestore();
    });
  });
});

describe('DynamicComponentService - createRendererWithFactory', () => {
  let service: DynamicComponentService;
  let appRef: ApplicationRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DummyRendererAdvancedComponent],
      providers: [DynamicComponentService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    appRef = TestBed.inject(ApplicationRef);
    service = TestBed.inject(DynamicComponentService);

    if (!Handsontable.renderers) {
      Handsontable.renderers = {} as any;
    }
    Handsontable.renderers.rendererFactory = rendererFactory;
  });

  describe('when using a component as renderer', () => {
    it('should create a renderer function that attaches a component to the TD element', () => {
      const rendererFn = service.createRendererWithFactory(DummyRendererAdvancedComponent, { custom: 'dummy' }, false);

      const td = createDummyTD();

      const row = 1;
      const col = 2;
      const prop = 'testProp';
      const value = 'Component Test';
      const cellProperties: Handsontable.CellProperties = {} as any;

      rendererFn(dummyHTInstance, td, row, col, prop, value, cellProperties);
      appRef.tick();

      // eslint-disable-next-line max-len
      expect(td.innerHTML).toContain('<hot-dummy-renderer-advanced><div>Component Renderer: Component Test</div></hot-dummy-renderer-advanced>');
    });
  });

  describe('when re-rendering the same TD', () => {
    it('should destroy the previous ComponentRef and not duplicate content', () => {
      const rendererFn = service.createRendererWithFactory(DummyRendererAdvancedComponent, {}, false);
      const td = createDummyTD();
      const cellProperties: Handsontable.CellProperties = {} as any;

      rendererFn(dummyHTInstance, td, 0, 0, 'prop', 'first', cellProperties);
      appRef.tick();
      expect(td.innerHTML).toContain('Component Renderer: first');

      const detachSpy = jest.spyOn(appRef, 'detachView');

      rendererFn(dummyHTInstance, td, 0, 0, 'prop', 'second', cellProperties);
      appRef.tick();

      expect(detachSpy).toHaveBeenCalledTimes(1);
      expect(td.innerHTML).toContain('Component Renderer: second');
      expect(td.innerHTML).not.toContain('Component Renderer: first');
    });
  });

  describe('when passing an invalid advanced renderer', () => {
    it('should log a warning when component does not extend HotCellRendererAdvancedComponent', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const rendererFn = service.createRendererWithFactory({} as any, {}, false);
      rendererFn(dummyHTInstance, createDummyTD(), 0, 0, 'prop', 'value', {} as any);

      expect(warnSpy).toHaveBeenCalledWith(INVALID_ADVANCED_RENDERER_WARNING);
      warnSpy.mockRestore();
    });
  });

  describe('when register=true', () => {
    it('should call registerRenderer with a valid HotCellRendererAdvancedComponent', () => {
      expect(() => {
        const rendererFn = service.createRendererWithFactory(DummyRendererAdvancedComponent, {}, true);
        rendererFn(dummyHTInstance, createDummyTD(), 0, 0, 'prop', 'value', {} as any);
      }).not.toThrow();
    });
  });
});

describe('DynamicComponentService - destroyComponent', () => {
  let service: DynamicComponentService;
  let appRef: ApplicationRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DummyRendererComponent],
      providers: [DynamicComponentService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    appRef = TestBed.inject(ApplicationRef);
    service = TestBed.inject(DynamicComponentService);
  });

  it('should detach the view and destroy the component', () => {
    const compRef = createComponent(DummyRendererComponent, {
      environmentInjector: TestBed.inject(EnvironmentInjector),
    });
    appRef.attachView(compRef.hostView);

    const detachSpy = jest.spyOn(appRef, 'detachView');
    const destroySpy = jest.spyOn(compRef, 'destroy');

    service.destroyComponent(compRef);

    expect(detachSpy).toHaveBeenCalledWith(compRef.hostView);
    expect(destroySpy).toHaveBeenCalled();
  });
});

describe('DynamicComponentService - cleanupContainer', () => {
  let service: DynamicComponentService;
  let appRef: ApplicationRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DummyRendererComponent],
      providers: [DynamicComponentService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    appRef = TestBed.inject(ApplicationRef);
    service = TestBed.inject(DynamicComponentService);
  });

  function buildContainer(...tds: HTMLTableCellElement[]): HTMLElement {
    const container = document.createElement('div');
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    const tr = document.createElement('tr');
    tds.forEach((td) => tr.appendChild(td));
    tbody.appendChild(tr);
    table.appendChild(tbody);
    container.appendChild(table);
    return container;
  }

  it('should detach and destroy all renderer components within the container', () => {
    const td1 = createDummyTD();
    const td2 = createDummyTD();
    const container = buildContainer(td1, td2);
    const cellProperties: Handsontable.CellProperties = {} as any;

    const rendererFn = service.createRendererFromComponent(DummyRendererComponent, {}, false);
    rendererFn(dummyHTInstance, td1, 0, 0, 'prop', 'v1', cellProperties);
    rendererFn(dummyHTInstance, td2, 0, 1, 'prop', 'v2', cellProperties);
    appRef.tick();

    const detachSpy = jest.spyOn(appRef, 'detachView');

    service.cleanupContainer(container);

    expect(detachSpy).toHaveBeenCalledTimes(2);
  });

  it('should be a no-op when no renderer components are attached in the container', () => {
    const container = buildContainer(createDummyTD());

    expect(() => service.cleanupContainer(container)).not.toThrow();
  });

  it('should not destroy components on subsequent calls after cleanup', () => {
    const td = createDummyTD();
    const container = buildContainer(td);
    const cellProperties: Handsontable.CellProperties = {} as any;

    const rendererFn = service.createRendererFromComponent(DummyRendererComponent, {}, false);
    rendererFn(dummyHTInstance, td, 0, 0, 'prop', 'val', cellProperties);
    appRef.tick();

    service.cleanupContainer(container); // First cleanup — destroys component

    const detachSpy = jest.spyOn(appRef, 'detachView');
    service.cleanupContainer(container); // Second cleanup — should be a no-op

    expect(detachSpy).not.toHaveBeenCalled();
  });
});

describe('exported type guards', () => {
  describe('isTemplateRef', () => {
    it('should return true for an object with createEmbeddedView method', () => {
      const fakeTemplateRef = { createEmbeddedView: () => {} };
      expect(isTemplateRef(fakeTemplateRef)).toBe(true);
    });

    it('should return false for a plain object without createEmbeddedView', () => {
      expect(isTemplateRef({})).toBe(false);
    });

    it('should return false for null', () => {
      expect(isTemplateRef(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isTemplateRef(undefined)).toBe(false);
    });

    it('should return false for a component class', () => {
      expect(isTemplateRef(DummyRendererComponent)).toBe(false);
    });
  });

  describe('isHotCellRendererComponent', () => {
    it('should return true for a class that extends HotCellRendererComponent', () => {
      expect(isHotCellRendererComponent(DummyRendererComponent)).toBe(true);
    });

    it('should return false for a class that extends HotCellRendererAdvancedComponent', () => {
      expect(isHotCellRendererComponent(DummyRendererAdvancedComponent)).toBe(false);
    });

    it('should return false for a plain object', () => {
      expect(isHotCellRendererComponent({})).toBe(false);
    });

    it('should return false for null', () => {
      expect(isHotCellRendererComponent(null)).toBe(false);
    });
  });

  describe('isAdvancedHotCellRendererComponent', () => {
    it('should return true for a class that extends HotCellRendererAdvancedComponent', () => {
      expect(isAdvancedHotCellRendererComponent(DummyRendererAdvancedComponent)).toBe(true);
    });

    it('should return false for a class that extends HotCellRendererComponent', () => {
      expect(isAdvancedHotCellRendererComponent(DummyRendererComponent)).toBe(false);
    });

    it('should return false for a plain object', () => {
      expect(isAdvancedHotCellRendererComponent({})).toBe(false);
    });

    it('should return false for null', () => {
      expect(isAdvancedHotCellRendererComponent(null)).toBe(false);
    });
  });
});
