import {
  ApplicationRef, ComponentRef, createComponent,
  EmbeddedViewRef, EnvironmentInjector, Injectable,
  TemplateRef, Type
} from '@angular/core';
import {baseRenderer, BaseRenderer} from 'handsontable/renderers';
import Handsontable from 'handsontable/base';
import {HotCellRendererComponent} from './hot-cell-renderer.component';

type BaseRendererParameters = Parameters<BaseRenderer>;

export const INVALID_RENDERER_WARNING =
  'The provided renderer component was not recognized as a valid custom renderer. ' +
  'It must either extend HotCellRendererComponent or be a valid TemplateRef. ' +
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
  return obj && typeof obj.createEmbeddedView === 'function';
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
  constructor(
    private appRef: ApplicationRef,
    private environmentInjector: EnvironmentInjector
  ) {}

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
        value, instance, td, row, col, prop, cellProperties
      };

      if (componentProps) {
        Object.assign(cellProperties, {rendererProps: componentProps});
      }

      const rendererParameters: BaseRendererParameters = [
        instance, td, row, col, prop, value, cellProperties
      ];

      baseRenderer.apply(this, rendererParameters);

      td.innerHTML = '';

      if (isTemplateRef(component)) {
        this.attachTemplateToElement(component, td, properties);
      } else if (isHotCellRendererComponent(component)){
        const componentRef = this.createComponent(component, properties);
        this.attachComponentToElement(componentRef, td);
      } else {
        console.warn(INVALID_RENDERER_WARNING)
      }

      if (register && isHotCellRendererComponent(component)) {
        Handsontable.renderers.registerRenderer(
          component.constructor.name,
          component as any as BaseRenderer
        );
      }

      return td;
    };
  }

  /**
   * Attaches an embedded view created from a TemplateRef to a given DOM element.
   *
   * @param template - The TemplateRef to create an embedded view from.
   * @param tdEl - The target DOM element (a table cell) to which the view will be appended.
   * @param properties - Context object providing properties to be used within the template.
   */
  private attachTemplateToElement(
    template: TemplateRef<any>,
    tdEl: HTMLTableCellElement,
    properties: BaseRendererParametersObject
  ) {
    const embeddedView: EmbeddedViewRef<any> = template.createEmbeddedView({
      $implicit: properties.value,
      ...properties,
    });
    embeddedView.detectChanges();

    embeddedView.rootNodes.forEach((node) => {
      tdEl.appendChild(node);
    });
  }

  /**
   * Dynamically creates an Angular component of the given type.
   *
   * @param component - The Angular component type to be created.
   * @param rendererParameters - An object containing input properties to assign to the component instance.
   * @returns The ComponentRef of the dynamically created component.
   */
  private createComponent<T extends HotCellRendererComponent>(
    component: Type<T>,
    rendererParameters: BaseRendererParametersObject
  ): ComponentRef<T> {
    const componentRef = createComponent(component, {
      environmentInjector: this.environmentInjector
    });

    Object.keys(rendererParameters).forEach(key => {
      if (rendererParameters.hasOwnProperty(key)) {
        componentRef.setInput(key, rendererParameters[key])
      } else {
        console.warn(`Input property "${key}" does not exist on component instance: ${component?.name}.`);
      }
    })
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
  private attachComponentToElement<T>(
    componentRef: ComponentRef<T>,
    container: HTMLElement
  ): void {
    const domElem = (componentRef.hostView as EmbeddedViewRef<T>)
      .rootNodes[0] as HTMLElement;
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
