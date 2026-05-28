import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  EmbeddedViewRef,
  EnvironmentInjector,
  Injectable,
  TemplateRef,
  Type
} from '@angular/core';
import { baseRenderer, BaseRenderer, registerRenderer, rendererFactory } from 'handsontable/renderers';
import Handsontable from 'handsontable/base';
import { HotCellRendererBase } from './hot-cell-renderer-base.directive';
import { HotCellRendererComponent } from './hot-cell-renderer.component';
import { HotCellRendererAdvancedComponent } from './hot-cell-renderer-advanced.component';

type BaseRendererParameters = Parameters<BaseRenderer>;

export const INVALID_RENDERER_WARNING =
  'The provided renderer component was not recognized as a valid custom renderer. ' +
  'It must either extend HotCellRendererComponent or be a valid TemplateRef. ' +
  'Please ensure that your custom renderer is implemented correctly and imported from the proper source.';

export const INVALID_ADVANCED_RENDERER_WARNING =
  'The provided renderer component was not recognized as a valid custom renderer. ' +
  'It must either extend HotCellRendererAdvancedComponent. ' +
  'Please ensure that your custom renderer is implemented correctly and imported from the proper source.';

/**
 * An object representing the parameters passed to a Handsontable renderer.
 */
interface BaseRendererParametersObject {
  instance: Handsontable.Core;
  td: HTMLTableCellElement;
  row: number;
  col: number;
  prop: string | number;
  value: any;
  cellProperties: Handsontable.CellProperties;
}

/**
 * Type guard that checks if the given object is a TemplateRef.
 *
 * @param obj - The object to check.
 * @returns True if the object is a TemplateRef; otherwise, false.
 */
export function isTemplateRef<T>(obj: any): obj is TemplateRef<T> {
  return !!obj && typeof obj.createEmbeddedView === 'function';
}

/**
 * Type guard to check if an object is an instance of HotCellRendererComponent.
 *
 * @param obj - The object to check.
 * @returns True if the object is a HotCellRendererComponent, false otherwise.
 */
export function isHotCellRendererComponent(obj: any): obj is Type<HotCellRendererComponent> {
  return obj?.RENDERER_MARKER === HotCellRendererComponent.RENDERER_MARKER;
}

/**
 * Type guard to check if an object is an instance of HotCellRendererAdvancedComponent.
 *
 * @param obj - The object to check.
 * @returns True if the object is a HotCellRendererAdvancedComponent, false otherwise.
 */
export function isAdvancedHotCellRendererComponent(obj: any): obj is Type<HotCellRendererAdvancedComponent> {
  return obj?.RENDERER_MARKER === HotCellRendererAdvancedComponent.RENDERER_MARKER;
}

/**
 * Service for dynamically creating Angular components or templates as custom renderers for Handsontable.
 *
 * This service allows you to create a renderer function that wraps a given Angular component or TemplateRef
 * so that it can be used as a Handsontable renderer.
 *
 * @example
 * const customRenderer = dynamicComponentService.createRendererFromComponent(MyRendererComponent, { someProp: value });
 * // Use customRenderer in your Handsontable configuration
 */
@Injectable({
  providedIn: 'root',
})
export class DynamicComponentService {
  // Track Angular component refs and embedded views keyed by the TD element they are attached to.
  // When a cell is re-rendered the previous component is destroyed before a new one is created.
  private readonly _tdComponentRefs = new WeakMap<HTMLTableCellElement, ComponentRef<any>>();
  private readonly _tdEmbeddedViews = new WeakMap<HTMLTableCellElement, EmbeddedViewRef<any>>();

  constructor(private appRef: ApplicationRef, private environmentInjector: EnvironmentInjector) {}

  /**
   * Creates a custom renderer function for Handsontable from an Angular component or TemplateRef.
   * The generated renderer function will be used by Handsontable to render cell content.
   *
   * @param component - The Angular component type or TemplateRef to use as renderer.
   * @param componentProps - An object containing additional properties to use by the renderer.
   * @param register - If true, registers the renderer with Handsontable using the component's name.
   * @returns A renderer function that can be used in Handsontable's configuration.
   */
  createRendererFromComponent(
    component: Type<HotCellRendererComponent> | TemplateRef<any>,
    componentProps: Record<string, any> = {},
    register: boolean = false
  ) {
    let registered = false;

    return (
      instance: Handsontable.Core,
      td: HTMLTableCellElement,
      row: number,
      col: number,
      prop: string | number,
      value: any,
      cellProperties: Handsontable.CellProperties
    ) => {
      const properties: BaseRendererParametersObject = {
        value,
        instance,
        td,
        row,
        col,
        prop,
        cellProperties,
      };

      Object.assign(cellProperties, { rendererProps: componentProps });

      const rendererParameters: BaseRendererParameters = [instance, td, row, col, prop, value, cellProperties];

      baseRenderer.apply(this, rendererParameters);

      // Destroy previously attached component/view for this cell before replacing its content.
      const prevRef = this._tdComponentRefs.get(td);
      if (prevRef) {
        this.destroyComponent(prevRef);
        this._tdComponentRefs.delete(td);
      }
      const prevView = this._tdEmbeddedViews.get(td);
      if (prevView) {
        prevView.destroy();
        this._tdEmbeddedViews.delete(td);
      }

      td.innerHTML = '';

      if (isTemplateRef(component)) {
        const embeddedView = this.attachTemplateToElement(component, td, properties);
        this._tdEmbeddedViews.set(td, embeddedView);
      } else if (isHotCellRendererComponent(component)) {
        const componentRef = this.createComponent(component, properties);
        this.attachComponentToElement(componentRef, td);
        this._tdComponentRefs.set(td, componentRef);
      } else {
        console.warn(INVALID_RENDERER_WARNING);
      }

      if (register && !registered && isHotCellRendererComponent(component)) {
        Handsontable.renderers.registerRenderer((component as Type<any>).name, component as any as BaseRenderer);
        registered = true;
      }

      return td;
    };
  }

  /**
   * Creates a custom renderer function using rendererFactory from Handsontable.
   * This is an alternative implementation that uses the factory pattern.
   *
   * @param component - The Angular component type to use as renderer.
   * @param componentProps - An object containing additional properties to use by the renderer.
   * @param register - If true, registers the renderer with Handsontable using the component's name.
   * @returns A renderer function that can be used in Handsontable's configuration.
   */
  createRendererWithFactory(
    component: Type<HotCellRendererAdvancedComponent>,
    componentProps: Record<string, any> = {},
    register: boolean = false
  ) {
    let registered = false;

    return rendererFactory(({
      instance,
      td,
      row,
      column,
      prop,
      value,
      cellProperties
    }) => {
      const properties: BaseRendererParametersObject = {
        value,
        instance,
        td,
        row,
        col: column,
        prop,
        cellProperties,
      };

      Object.assign(cellProperties, { rendererProps: componentProps });

      // Destroy previously attached component/view for this cell before replacing its content.
      const prevRef = this._tdComponentRefs.get(td);
      if (prevRef) {
        this.destroyComponent(prevRef);
        this._tdComponentRefs.delete(td);
      }
      const prevView = this._tdEmbeddedViews.get(td);
      if (prevView) {
        prevView.destroy();
        this._tdEmbeddedViews.delete(td);
      }

      td.innerHTML = '';

      if (isAdvancedHotCellRendererComponent(component)) {
        const componentRef = this.createComponent(component, properties);
        this.attachComponentToElement(componentRef, td);
        this._tdComponentRefs.set(td, componentRef);
      } else {
        console.warn(INVALID_ADVANCED_RENDERER_WARNING);
      }

      if (register && !registered && isAdvancedHotCellRendererComponent(component)) {
        registerRenderer(component.name, component as any as BaseRenderer);
        registered = true;
      }
    });
  }

  /**
   * Destroys all renderer components and embedded views attached to cells within a container element.
   * Must be called before destroying the Handsontable instance to prevent Angular component leaks.
   *
   * @param container - The root DOM element of the Handsontable instance.
   */
  cleanupContainer(container: HTMLElement): void {
    container.querySelectorAll<HTMLTableCellElement>('td').forEach((td) => {
      const compRef = this._tdComponentRefs.get(td);
      if (compRef) {
        this.destroyComponent(compRef);
        this._tdComponentRefs.delete(td);
      }
      const embView = this._tdEmbeddedViews.get(td);
      if (embView) {
        embView.destroy();
        this._tdEmbeddedViews.delete(td);
      }
    });
  }

  /**
   * Attaches an embedded view created from a TemplateRef to a given DOM element.
   *
   * @param template - The TemplateRef to create an embedded view from.
   * @param tdEl - The target DOM element (a table cell) to which the view will be appended.
   * @param properties - Context object providing properties to be used within the template.
   * @returns The created EmbeddedViewRef so the caller can track and destroy it later.
   */
  private attachTemplateToElement(
    template: TemplateRef<any>, tdEl: HTMLTableCellElement, properties: BaseRendererParametersObject
  ): EmbeddedViewRef<any> {
    const embeddedView: EmbeddedViewRef<any> = template.createEmbeddedView({
      $implicit: properties.value,
      ...properties,
    });
    embeddedView.detectChanges();

    embeddedView.rootNodes.forEach((node) => {
      tdEl.appendChild(node);
    });

    return embeddedView;
  }

  /**
   * Dynamically creates an Angular component of the given type.
   *
   * @param component - The Angular component type to be created.
   * @param rendererParameters - An object containing input properties to assign to the component instance.
   * @returns The ComponentRef of the dynamically created component.
   */
  private createComponent<T extends HotCellRendererBase>(
    component: Type<T>,
    rendererParameters: BaseRendererParametersObject
  ): ComponentRef<T> {
    const componentRef = createComponent(component, {
      environmentInjector: this.environmentInjector,
    });

    (Object.keys(rendererParameters) as (keyof BaseRendererParametersObject)[]).forEach((key) => {
      componentRef.setInput(key, rendererParameters[key]);
    });
    componentRef.changeDetectorRef.detectChanges();

    this.appRef.attachView(componentRef.hostView);

    return componentRef;
  }

  /**
   * Attaches a dynamically created component's view to a specified DOM container element.
   *
   * @param componentRef - The reference to the dynamically created component.
   * @param container - The target DOM element to which the component's root node will be appended.
   */
  private attachComponentToElement<T>(componentRef: ComponentRef<T>, container: HTMLElement): void {
    const domElem = (componentRef.hostView as EmbeddedViewRef<T>).rootNodes[0] as HTMLElement;
    container.appendChild(domElem);
  }

  /**
   * Destroys a dynamically created component and detaches its view from the Angular application.
   *
   * @param componentRef - The reference to the component to be destroyed.
   */
  destroyComponent<T>(componentRef: ComponentRef<T>): void {
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();
  }
}
