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

// Renderer component inputs, listed once at module scope so the per-cell render path can set them
// without allocating a fresh key array (via Object.keys) on every cell of every render frame.
const RENDERER_INPUT_KEYS: (keyof BaseRendererParametersObject)[] = [
  'instance', 'td', 'row', 'col', 'prop', 'value', 'cellProperties',
];

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

  // Per-instance registries of every renderer ref/view currently attached to the application.
  // The WeakMaps above only allow per-TD lookup; these sets let us sweep refs whose TD was dropped
  // from Handsontable's virtual viewport (scrolling, updateData), which would otherwise stay
  // attached to ApplicationRef forever and leak both memory and change-detection work.
  //
  // The registries are scoped per Handsontable instance (not one global set) because this service
  // is a root singleton shared by every <hot-table>. A global sweep would scan the cells of every
  // table on the page on each `afterViewRender`, i.e. on every scroll frame of any one of them.
  // Keying by instance bounds each sweep to the cells of the table that actually re-rendered.
  private readonly _instanceComponentRefs = new WeakMap<Handsontable.Core, Set<ComponentRef<any>>>();
  private readonly _instanceEmbeddedViews = new WeakMap<Handsontable.Core, Set<EmbeddedViewRef<any>>>();

  // Instances we already wired the sweep hook into, so each instance is hooked at most once.
  private readonly _hookedInstances = new WeakSet<Handsontable.Core>();

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

      (cellProperties as any).rendererProps = componentProps;

      baseRenderer.call(this, instance, td, row, col, prop, value, cellProperties);

      this.registerSweepHook(instance);

      if (isTemplateRef(component)) {
        // Embedded views carry a per-render context, so they are always rebuilt.
        this.replaceCellContent(instance, td);
        const embeddedView = this.attachTemplateToElement(component, td, properties);
        this.trackEmbeddedView(instance, td, embeddedView);
      } else if (isHotCellRendererComponent(component)) {
        this.renderComponent(td, component, properties);
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

      (cellProperties as any).rendererProps = componentProps;

      // Apply the base renderer so the TD gets the same base classes/attributes as the
      // createRendererFromComponent path (rendererFactory itself does not call it).
      baseRenderer.call(this, instance, td, row, column, prop, value, cellProperties);

      this.registerSweepHook(instance);

      if (isAdvancedHotCellRendererComponent(component)) {
        this.renderComponent(td, component, properties);
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
   * @param instance - The Handsontable instance whose registries should be torn down. When omitted
   *   (e.g. test stubs), only refs reachable through TDs still in the container are destroyed.
   */
  cleanupContainer(container: HTMLElement, instance?: Handsontable.Core): void {
    const compRefs = instance ? this._instanceComponentRefs.get(instance) : undefined;
    const embViews = instance ? this._instanceEmbeddedViews.get(instance) : undefined;

    container.querySelectorAll<HTMLTableCellElement>('td').forEach((td) => {
      const compRef = this._tdComponentRefs.get(td);
      if (compRef) {
        this.destroyComponent(compRef);
        this._tdComponentRefs.delete(td);
        compRefs?.delete(compRef);
      }
      const embView = this._tdEmbeddedViews.get(td);
      if (embView) {
        embView.destroy();
        this._tdEmbeddedViews.delete(td);
        embViews?.delete(embView);
      }
    });

    // The loop above only reaches TDs still present in the container. Refs for cells already
    // dropped from the viewport (but not yet swept) would otherwise be orphaned once this
    // instance's afterViewRender hook is gone after destroy. Tear down whatever is left and drop
    // the per-instance registries so a repeated cleanup call is a no-op. (Entries removed in the
    // loop above are already gone from these sets, so nothing is destroyed twice.)
    compRefs?.forEach((ref) => this.destroyComponent(ref));
    embViews?.forEach((view) => view.destroy());

    if (instance) {
      this._instanceComponentRefs.delete(instance);
      this._instanceEmbeddedViews.delete(instance);
    }
  }

  /**
   * Registers a one-time `afterViewRender` hook on the given Handsontable instance that sweeps
   * renderer refs whose TD is no longer connected to the document. Handsontable recycles a pool of
   * TD elements while virtualizing rows; cells that leave the viewport are never re-rendered, so
   * without this sweep their Angular components stay attached to ApplicationRef and leak.
   *
   * Guarded against instances that do not expose `addHook` (e.g. test stubs).
   *
   * @param instance - The Handsontable instance whose render cycle drives the sweep.
   */
  private registerSweepHook(instance: Handsontable.Core): void {
    if (this._hookedInstances.has(instance) || typeof (instance as any)?.addHook !== 'function') {
      return;
    }

    this._hookedInstances.add(instance);
    instance.addHook('afterViewRender', () => this.sweepDetachedViews(instance));
  }

  /**
   * Destroys every renderer ref/view tracked for the given instance whose root node is no longer
   * attached to the document.
   *
   * @param instance - The Handsontable instance whose registries should be swept.
   */
  private sweepDetachedViews(instance: Handsontable.Core): void {
    const compRefs = this._instanceComponentRefs.get(instance);
    compRefs?.forEach((ref) => {
      if (!this.isViewConnected(ref.hostView as EmbeddedViewRef<any>)) {
        this.destroyComponent(ref);
        compRefs.delete(ref);
      }
    });

    const embViews = this._instanceEmbeddedViews.get(instance);
    embViews?.forEach((view) => {
      if (!this.isViewConnected(view)) {
        view.destroy();
        embViews.delete(view);
      }
    });
  }

  /**
   * @returns True if any of the view's root nodes is still connected to the document.
   */
  private isViewConnected(view: EmbeddedViewRef<any>): boolean {
    return view.rootNodes.some((node: Node) => !!node?.isConnected);
  }

  /**
   * Destroys the renderer ref/view previously attached to a cell and clears the cell content,
   * so a fresh renderer can take over the TD without leaking the old one.
   *
   * @param instance - The Handsontable instance owning the cell, used to update its registries.
   * @param td - The table cell whose previous content should be torn down.
   */
  private replaceCellContent(instance: Handsontable.Core, td: HTMLTableCellElement): void {
    const prevRef = this._tdComponentRefs.get(td);
    if (prevRef) {
      this.destroyComponent(prevRef);
      this._tdComponentRefs.delete(td);
      this._instanceComponentRefs.get(instance)?.delete(prevRef);
    }

    const prevView = this._tdEmbeddedViews.get(td);
    if (prevView) {
      prevView.destroy();
      this._tdEmbeddedViews.delete(td);
      this._instanceEmbeddedViews.get(instance)?.delete(prevView);
    }

    td.innerHTML = '';
  }

  /**
   * Tracks a component ref both by its TD (for fast replacement) and in the instance registry
   * (for sweeping and full teardown).
   */
  private trackComponentRef(
    instance: Handsontable.Core, td: HTMLTableCellElement, ref: ComponentRef<any>
  ): void {
    this._tdComponentRefs.set(td, ref);
    this.registryFor(this._instanceComponentRefs, instance).add(ref);
  }

  /**
   * Tracks an embedded view both by its TD (for fast replacement) and in the instance registry
   * (for sweeping and full teardown).
   */
  private trackEmbeddedView(
    instance: Handsontable.Core, td: HTMLTableCellElement, view: EmbeddedViewRef<any>
  ): void {
    this._tdEmbeddedViews.set(td, view);
    this.registryFor(this._instanceEmbeddedViews, instance).add(view);
  }

  /**
   * Returns the per-instance registry set for the given instance, creating it on first use.
   */
  private registryFor<T>(registry: WeakMap<Handsontable.Core, Set<T>>, instance: Handsontable.Core): Set<T> {
    let set = registry.get(instance);
    if (!set) {
      set = new Set<T>();
      registry.set(instance, set);
    }
    return set;
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

    this.applyInputs(componentRef, rendererParameters);
    componentRef.changeDetectorRef.detectChanges();

    this.appRef.attachView(componentRef.hostView);

    return componentRef;
  }

  /**
   * Renders an Angular component into the given cell, recycling the component already attached to
   * the TD when it is of the same type. Handsontable recycles its pool of TD elements heavily while
   * virtualizing rows, so recreating an Angular component on every re-render would cause needless
   * teardown/instantiation churn and GC pressure. When the type matches we only refresh the inputs.
   *
   * @param td - The target table cell.
   * @param component - The renderer component type to render.
   * @param properties - The renderer parameters to feed as component inputs.
   */
  private renderComponent<T extends HotCellRendererBase>(
    td: HTMLTableCellElement,
    component: Type<T>,
    properties: BaseRendererParametersObject
  ): void {
    const prevRef = this._tdComponentRefs.get(td);

    if (
      prevRef &&
      prevRef.componentType === component &&
      this.isViewConnected(prevRef.hostView as EmbeddedViewRef<any>)
    ) {
      this.applyInputs(prevRef, properties);
      prevRef.changeDetectorRef.detectChanges();
      return;
    }

    this.replaceCellContent(properties.instance, td);
    const componentRef = this.createComponent(component, properties);
    this.attachComponentToElement(componentRef, td);
    this.trackComponentRef(properties.instance, td, componentRef);
  }

  /**
   * Assigns every renderer parameter as an input on the given component ref.
   *
   * @param componentRef - The component ref whose inputs should be set.
   * @param rendererParameters - The renderer parameters to assign.
   */
  private applyInputs<T>(componentRef: ComponentRef<T>, rendererParameters: BaseRendererParametersObject): void {
    RENDERER_INPUT_KEYS.forEach((key) => {
      componentRef.setInput(key, rendererParameters[key]);
    });
  }

  /**
   * Attaches a dynamically created component's view to a specified DOM container element.
   *
   * @param componentRef - The reference to the dynamically created component.
   * @param container - The target DOM element to which the component's root node will be appended.
   */
  private attachComponentToElement<T>(componentRef: ComponentRef<T>, container: HTMLElement): void {
    (componentRef.hostView as EmbeddedViewRef<T>).rootNodes.forEach((node) => {
      container.appendChild(node);
    });
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
