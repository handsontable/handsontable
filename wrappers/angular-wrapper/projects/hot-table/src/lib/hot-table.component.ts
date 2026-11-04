import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Handsontable from 'handsontable/base';
import { HotSettingsResolver } from './services/hot-settings-resolver.service';
import { HotGlobalConfigService } from './services/hot-global-config.service';
import { GridSettings } from './models/grid-settings';
import { DynamicComponentService } from './renderer/hot-dynamic-renderer-component.service';
import { HotInstanceWithAngularInjector } from './editor/models/factory-editor-properties';
import { ColumnSettingsInternal } from './models/column-settings';
import { skip } from 'rxjs/operators';

export const HOT_DESTROYED_WARNING = 'The Handsontable instance bound to this component was destroyed and cannot be' + ' used properly.';

/**
 * The size options that discard the sizes stored by the manual resize plugins when they are passed
 * to `updateSettings()`.
 */
const SIZE_SETTING_KEYS = new Set<string>(['rowHeights', 'minRowHeights', 'colWidths']);

/**
 * The `updateData()` source the `data` input is sent with. It tells core that the array is the component's
 * `data` binding, which the React and Vue wrappers send as the `data` of `updateSettings()`: with the sheets
 * bar on, it then follows the top-level `data` rule instead of replacing the visible sheet's rows.
 */
export const DATA_BINDING_SOURCE = 'dataBinding';

/**
 * Settings that core resets only on `null`. Core reads `undefined` as "leave the current size", so a
 * `height` or `width` that goes from a value to `undefined` is forwarded as `null`, which restores the
 * root element's initial inline size.
 */
const CLEARED_BY_NULL_SETTINGS = ['height', 'width'] as const;

/**
 * Checks whether a hook value holds a callback core registers: a function or an array of them.
 *
 * @param value The hook value.
 * @returns `true` for a function or an array.
 */
function isHookCallback(value: unknown): boolean {
  return typeof value === 'function' || Array.isArray(value);
}

/**
 * Compares two size option values. Both hold a number, a string, a function or an array of numbers
 * or strings, so an element-wise walk is enough - and it is what makes a value written inline in a
 * template, which is a new array on every change detection run, compare as unchanged.
 *
 * A function is compared by reference only. It states no fixed size, and the core plugins ignore it
 * when deciding whether the sizes were re-declared, so forwarding it changes nothing either way.
 *
 * @param currentValue The value the grid currently holds.
 * @param newValue The value coming from the `settings` input.
 * @returns `true` when the two state the same sizes.
 */
function isSameSizeSetting(currentValue: unknown, newValue: unknown): boolean {
  if (currentValue === newValue) {
    return true;
  }

  if (Array.isArray(currentValue) && Array.isArray(newValue)) {
    return currentValue.length === newValue.length &&
      currentValue.every((value, index) => value === newValue[index]);
  }

  return false;
}

/**
 * Settings passed on every `settings` change, changed or not. An app may change the rows of its `data`
 * array in place and pass the settings again to show them, as with the React and Vue wrappers.
 */
const ALWAYS_FORWARDED_SETTINGS = new Set<string>(['data']);

/**
 * Settings compared by reference only. The sheets bar writes renames and added sheets into the `sheets`
 * array it was given, so a new array is a new workbook even when its content matches, and walking every
 * sheet's rows on each change would cost as much as the data itself.
 */
const REFERENCE_COMPARED_SETTINGS = new Set<string>(['sheetsBar']);

/**
 * Compares the value last passed to the grid with the value a `settings` change passes. Plain objects
 * and arrays are walked; functions, class instances (an editor component reference), and any other
 * value are compared by reference, and a `RegExp` by its source and flags. A pair of objects already
 * being compared higher up reads as equal, so a value with a cycle (tree rows with a `parent` link)
 * ends instead of overflowing the stack.
 *
 * @param forwardedValue The copy of the value last passed to the grid.
 * @param newValue The value coming from the `settings` input.
 * @param visited The object pairs on the current comparison path.
 * @returns `true` when passing the new value would change nothing.
 */
function isSameSettingValue(
  forwardedValue: unknown,
  newValue: unknown,
  visited: WeakMap<object, WeakSet<object>> = new WeakMap(),
): boolean {
  if (forwardedValue === newValue) {
    return true;
  }

  if (forwardedValue instanceof RegExp && newValue instanceof RegExp) {
    return forwardedValue.source === newValue.source && forwardedValue.flags === newValue.flags;
  }

  const bothArrays = Array.isArray(forwardedValue) && Array.isArray(newValue);
  const bothPlainObjects = isPlainObject(forwardedValue) && isPlainObject(newValue);

  if (!bothArrays && !bothPlainObjects) {
    return false;
  }

  const forwardedObject = forwardedValue as Record<string, unknown>;
  const newObject = newValue as Record<string, unknown>;
  const comparedWith = visited.get(forwardedObject);

  if (comparedWith?.has(newObject)) {
    return true;
  }

  if (comparedWith) {
    comparedWith.add(newObject);
  } else {
    visited.set(forwardedObject, new WeakSet([newObject]));
  }

  const forwardedKeys = Object.keys(forwardedObject);

  return forwardedKeys.length === Object.keys(newObject).length &&
    forwardedKeys.every(key => Object.prototype.hasOwnProperty.call(newObject, key) &&
      isSameSettingValue(forwardedObject[key], newObject[key], visited));
}

/**
 * Copies the plain objects and arrays of a settings value, keeping every other value by reference, so a
 * value the app changes in place later reads as changed. A value with a cycle is copied with the same
 * cycle.
 *
 * @param value The value to copy.
 * @param copies The copies made so far, by original.
 * @returns The copy.
 */
function copySettingValue(value: unknown, copies: WeakMap<object, unknown> = new WeakMap()): unknown {
  if (!Array.isArray(value) && !isPlainObject(value)) {
    return value;
  }

  if (copies.has(value)) {
    return copies.get(value);
  }

  if (Array.isArray(value)) {
    const arrayCopy: unknown[] = [];

    copies.set(value, arrayCopy);
    value.forEach(item => arrayCopy.push(copySettingValue(item, copies)));

    return arrayCopy;
  }

  const objectCopy: Record<string, unknown> = {};

  copies.set(value, objectCopy);
  Object.keys(value).forEach((key) => {
    objectCopy[key] = copySettingValue(value[key], copies);
  });

  return objectCopy;
}

/**
 * Checks whether a value is an object literal or an object without a prototype.
 *
 * @param value The value to check.
 * @returns `true` for a plain object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

/**
 * The class that makes the container and the host fill their parent. The component styles below
 * spell the same name, because decorator metadata must stay statically analyzable.
 */
const FILL_HEIGHT_CLASS_NAME = 'ht-fill-height';

/**
 * A `height` that resolves against the container: a percentage, or a `var()` that may hold one.
 * The core treats the same two as container-driven in `utils/rootSize.ts`, together with units that
 * resolve against the viewport or a query container, which do not depend on the container here.
 */
const RELATIVE_HEIGHT_PATTERN = /%|\bvar\(/i;

@Component({
  selector: 'hot-table',
  template: '<div #container></div>',
  encapsulation: ViewEncapsulation.None,
  providers: [HotSettingsResolver],
  styles: [
    `
      :host {
        display: block;
      }

      :where(hot-table.ht-fill-height, hot-table > div.ht-fill-height) {
        height: 100%;
      }
    `,
  ],
})
export class HotTableComponent implements AfterViewInit, OnChanges, OnDestroy {
  // component inputs
  /** The data for the Handsontable instance. */
  @Input() data: Handsontable.GridSettings['data'] | null = null;
  /** The settings for the Handsontable instance. */
  @Input() settings: GridSettings = {};

  /** The container element for the Handsontable instance. */
  @ViewChild('container', { static: false })
  public container: ElementRef<HTMLDivElement>;

  /** The Handsontable instance. */
  private __hotInstance: Handsontable | null = null;
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = inject(PLATFORM_ID) === 'browser';
  /**
   * The grid-level `columns` resolved from the `settings` input on the last change that carried them.
   * They hold the editor components this component created for them. The grid's own `columns` is not
   * where to find them: while the sheets bar shows a sheet that declares its own `columns`, it holds that
   * sheet's.
   */
  private _gridColumns: ColumnSettingsInternal[] | undefined;
  /**
   * The hooks the last applied `settings` input passed a callback for. A hook in this set that the next
   * input leaves out is sent as `null`. It is read from what the component sent, not from the previous
   * input, because an app may delete the key from that object before passing a copy.
   */
  private _passedHookKeys = new Set<string>();

  /**
   * Copies of the settings last passed to the grid, by setting name. A `settings` change leaves out a
   * key whose value equals its copy (`updateHotTable()`). The copy, not the grid's live value, is what
   * shows a change made in place, and with the sheets bar on the live value is the visible sheet's own.
   */
  private _forwardedSettings = new Map<string, unknown>();
  /**
   * The `height` and `width` keys whose size the grid holds from a `settings` input: passed a value, and
   * not cleared since (a key left out of a later input keeps its size, so it stays listed). Only these
   * are sent as `null` when an input sets them to `undefined`, so a size the app set through
   * `hotInstance.updateSettings()` stays when the input never passed one.
   */
  private _passedClearedByNullKeys = new Set<string>();

  constructor(
    private _hotSettingsResolver: HotSettingsResolver,
    private _hotConfig: HotGlobalConfigService,
    public ngZone: NgZone,
    private readonly environmentInjector: EnvironmentInjector,
    private readonly _dynamicComponentService: DynamicComponentService
  ) {}

  /**
   * Gets the Handsontable instance.
   * @returns The Handsontable instance, or `null` when it is not created yet, it has been
   * destroyed, or this component is rendering on the server.
   */
  public get hotInstance(): Handsontable | null {
    if (!this.__hotInstance || !this.__hotInstance.isDestroyed) {
      // Will return the Handsontable instance or `null` if it's not yet been created.
      return this.__hotInstance;
    } else {
      console.warn(HOT_DESTROYED_WARNING);
      return null;
    }
  }

  /**
   * Sets the Handsontable instance.
   * @param hotInstance The Handsontable instance to set.
   */
  private set hotInstance(hotInstance) {
    this.__hotInstance = hotInstance;
  }

  /**
   * Initializes the Handsontable instance after the view has been initialized.
   * The initial settings of the table are also prepared here
   */
  ngAfterViewInit(): void {
    // The server DOM has no `getRootNode`, and constructing the grid there throws on every
    // request. `afterNextRender` skips the server too, but it shipped in Angular 16.2 and this
    // wrapper still supports 16.0.
    if (!this.isBrowser) {
      return;
    }

    let options: Handsontable.GridSettings = this._hotSettingsResolver.applyCustomSettings(this.settings);

    if (Array.isArray(options.columns)) {
      this._gridColumns = options.columns;
    }

    this._passedHookKeys = this.collectHookKeys(options);
    this._passedClearedByNullKeys = this.collectClearedByNullKeys(options);

    const negotiatedSettings = this.getNegotiatedSettings(options);
    options = { ...options, ...negotiatedSettings, ...(this.data != null ? { data: this.data } : {}) };

    this._forwardedSettings = new Map();
    Object.keys(options).forEach((key) => {
      this.recordForwarded(key, (options as any)[key]);
    });

    this.ngZone.runOutsideAngular(() => {
      this.hotInstance = new Handsontable.Core(this.container.nativeElement, options);

      (this.hotInstance as HotInstanceWithAngularInjector)._angularEnvironmentInjector = this.environmentInjector;

      this.hotInstance._addSettingsFilter?.(settings => this._hotSettingsResolver.resolveAppliedSettings(settings));

      // Registered before `init()`, so the hook also sees the initial `height`, before the first render.
      this.hotInstance.addHook('beforeHeightChange', (height) => {
        this.toggleFillHeight(height);

        return height;
      });

      this.hotInstance.init();
    });

    this._hotConfig.config$.pipe(skip(1), takeUntilDestroyed(this._destroyRef)).subscribe((config) => {
      if (this.hotInstance) {
        const negotiatedSettings = this.getNegotiatedSettings(this.settings);
        this.updateHotTable(negotiatedSettings);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.hotInstance === null) {
      return;
    }

    if (changes.settings && !changes.settings.firstChange) {
      // Capture old editor refs before applying new settings so HOT can close any active editor first.
      const prevColumnsArray = this._gridColumns;

      // Pass the previous columns so unchanged editor types recycle their existing component
      // instead of creating a fresh one on every settings change.
      const newOptions: Handsontable.GridSettings = this._hotSettingsResolver.applyCustomSettings(
        changes.settings.currentValue,
        prevColumnsArray
      );

      this.clearRemovedHooks(newOptions);
      this._passedHookKeys = this.collectHookKeys(newOptions);
      this.clearUnsetSizes(newOptions);
      this._passedClearedByNullKeys = this.collectClearedByNullKeys(newOptions, this._passedClearedByNullKeys);

      // updateHotTable closes any active editor via HOT.updateSettings before we destroy old refs.
      const appliedOptions = this.updateHotTable(newOptions);

      // Only destroy old editor refs when the grid actually received new columns.
      // If it did not, HOT keeps the old column objects active — destroying
      // their refs would crash FactoryEditorAdapter / BaseEditorAdapter on next edit.
      if (prevColumnsArray && Array.isArray(appliedOptions.columns)) {
        // Refs recycled into the new columns must survive — destroy only the ones left behind.
        const reusedRefs = new Set(
          appliedOptions.columns
            .map((column) => column._editorComponentReference)
            .filter((ref): ref is NonNullable<typeof ref> => !!ref)
        );

        prevColumnsArray.forEach((column) => {
          if (column._editorComponentReference && !reusedRefs.has(column._editorComponentReference)) {
            column._editorComponentReference.destroy();
          }
        });
      }

      if (Array.isArray(appliedOptions.columns)) {
        this._gridColumns = appliedOptions.columns;
      }
    }

    if (changes.data && !changes.data.firstChange) {
      this.hotInstance?.updateData(changes.data.currentValue, DATA_BINDING_SOURCE);
    }
  }

  /**
   * Destroys the Handsontable instance and clears the columns from custom editors.
   */
  ngOnDestroy(): void {
    this.ngZone.runOutsideAngular(() => {
      if (!this.__hotInstance) {
        return;
      }

      const isLive = !this.__hotInstance.isDestroyed;

      // Destroy renderer Angular components attached to table cells before HOT removes the DOM.
      if (isLive && this.container) {
        this._dynamicComponentService.cleanupContainer(this.container.nativeElement, this.__hotInstance);
      }

      this._gridColumns?.forEach((column) => {
        if (column._editorComponentReference) {
          column._editorComponentReference.destroy();
        }
      });
      this._gridColumns = undefined;
      this._hotSettingsResolver.destroyAppliedEditors();

      if (isLive) {
        this.__hotInstance.destroy();
      }
    });
  }

  /**
   * Makes the container and the `<hot-table>` host fill their parent when the grid `height` is
   * relative.
   *
   * The core puts its root wrapper inside the container, and the `height: 100%` of the grid content
   * resolves against the container. An auto-height container makes that `100%` collapse to `0px`, so
   * the container has to pass the height of its parent through. React and Vue always do. Here it
   * happens only for a relative `height` (`%` or `var()`), so grids with other heights keep their
   * layout. The rule is a zero-specificity `:where()`, so any CSS of the app overrides it.
   *
   * @param height The value the `beforeHeightChange` hook received. It is the result of a `height`
   * function, and it is `null` when the `height` is reset.
   */
  private toggleFillHeight(height: unknown): void {
    const fillHeight = typeof height === 'string' && RELATIVE_HEIGHT_PATTERN.test(height);

    this.container.nativeElement.classList.toggle(FILL_HEIGHT_CLASS_NAME, fillHeight);
    this._host.nativeElement.classList.toggle(FILL_HEIGHT_CLASS_NAME, fillHeight);
  }

  /**
   * Sets to `null` each hook the component last passed a callback for and the new settings do not, so
   * `updateSettings()` removes that callback. A key missing from the new object is otherwise left out of
   * the payload, and core keeps the callback.
   *
   * @param newOptions The settings about to be applied. Changed in place.
   */
  private clearRemovedHooks(newOptions: Handsontable.GridSettings): void {
    this._passedHookKeys.forEach((key) => {
      if (!isHookCallback(newOptions[key])) {
        newOptions[key] = null;
      }
    });
  }

  /**
   * Sets to `null` each of `height` and `width` that the component last passed a value for and the new
   * settings set to `undefined`, so `updateSettings()` resets the root element's size. A key missing from
   * the new object is left out of the payload, and the grid keeps its size.
   *
   * @param newOptions The settings about to be applied. Changed in place.
   */
  private clearUnsetSizes(newOptions: Handsontable.GridSettings): void {
    Object.keys(newOptions).forEach((key) => {
      if (this._passedClearedByNullKeys.has(key) && newOptions[key] === undefined) {
        newOptions[key] = null;
      }
    });
  }

  /**
   * Lists which of `height` and `width` hold a size the component applied: the keys the settings pass a
   * value for, and the previously listed keys the settings leave out, because the grid keeps that size.
   *
   * @param settings The settings to read.
   * @param previousKeys The keys listed for the previous settings.
   * @returns The setting names.
   */
  private collectClearedByNullKeys(
    settings: Handsontable.GridSettings,
    previousKeys: Set<string> = new Set()
  ): Set<string> {
    const ownKeys = new Set(Object.keys(settings));

    return new Set(CLEARED_BY_NULL_SETTINGS.filter(key => (
      ownKeys.has(key) ? settings[key] !== undefined && settings[key] !== null : previousKeys.has(key)
    )));
  }

  /**
   * Lists the hooks the settings pass a callback for. A key counts as a hook by the rule core's
   * `updateSettings()` uses in `core.ts`: a registered or a deprecated hook name. Only a function or an
   * array of them counts as a callback: core ignores any other value, such as `false`.
   *
   * @param settings The settings to read.
   * @returns The hook names.
   */
  private collectHookKeys(settings: Handsontable.GridSettings): Set<string> {
    return new Set(Object.keys(settings).filter(key => (
      isHookCallback(settings[key]) &&
      (Handsontable.hooks.isRegistered(key) || Handsontable.hooks.isDeprecated(key))
    )));
  }

  /**
   * Checks whether a `settings` change passes a setting with the value it passed last time.
   *
   * @param key The setting name.
   * @param value The value the change passes.
   * @returns `true` when passing the value would change nothing.
   */
  private isSameAsForwarded(key: string, value: unknown): boolean {
    if (!this._forwardedSettings.has(key) || ALWAYS_FORWARDED_SETTINGS.has(key)) {
      return false;
    }

    const forwardedValue = this._forwardedSettings.get(key);

    return REFERENCE_COMPARED_SETTINGS.has(key) ? forwardedValue === value : isSameSettingValue(forwardedValue, value);
  }

  /**
   * Records the value passed to the grid for a setting, for the next `settings` change to compare with.
   *
   * @param key The setting name.
   * @param value The value passed.
   */
  private recordForwarded(key: string, value: unknown): void {
    if (ALWAYS_FORWARDED_SETTINGS.has(key)) {
      return;
    }

    this._forwardedSettings.set(key, REFERENCE_COMPARED_SETTINGS.has(key) ? value : copySettingValue(value));
  }

  /**
   * Updates the Handsontable instance with new settings. A setting passed last time with the same value
   * is left out (`isSameAsForwarded()`): passing it again re-applies the plugin it names, and a plugin
   * re-applied with its own settings drops the state the user gave it (Filters' conditions, Pagination's
   * page, the server total of a `dataProvider` grid, and a refetch). `ngOnChanges` passes every key of
   * a new `settings` object, so without the check one changed key re-applied all the others.
   *
   * @param newSettings The new settings to apply to the Handsontable instance.
   * @returns The settings passed to `updateSettings()`.
   */
  private updateHotTable(newSettings: Handsontable.GridSettings): Handsontable.GridSettings {
    if (!this.hotInstance) {
      return {};
    }

    const currentSettings = this.hotInstance.getSettings();
    const initOnlySettingKeys = new Set<string>(
      (currentSettings as any)?._initOnlySettings ?? []
    );
    const filteredSettings: Handsontable.GridSettings = {};

    for (const key of Object.keys(newSettings)) {
      if (initOnlySettingKeys.has(key)) {
        continue;
      }

      // `ngOnChanges` fires for the whole settings object, so every key is re-passed whenever any
      // one of them changes. Passing `rowHeights` or `colWidths` re-declares the sizes and discards
      // the ones the user produced by dragging, so an unchanged value must not be forwarded.
      if (
        SIZE_SETTING_KEYS.has(key) &&
        isSameSizeSetting((currentSettings as any)?.[key], (newSettings as any)[key])
      ) {
        continue;
      }

      if (this.isSameAsForwarded(key, (newSettings as any)[key])) {
        continue;
      }

      (filteredSettings as any)[key] = (newSettings as any)[key];
      this.recordForwarded(key, (newSettings as any)[key]);
    }

    this.ngZone.runOutsideAngular(() => {
      this.hotInstance?.updateSettings(filteredSettings, false);
    });

    return filteredSettings;
  }

  /**
   * Merges the provided Handsontable grid settings with the global configuration.
   *
   * This method retrieves the global configuration from the HotGlobalConfigService and negotiates the final
   * Handsontable settings by giving precedence to the provided settings.
   * Additionally, the `layoutDirection` is only merged if the Handsontable instance has not yet been initialized.
   *
   * @param settings - The grid settings provided by the user or component.
   * @returns The final negotiated grid settings after merging with global defaults.
   */
  private getNegotiatedSettings(settings: GridSettings): Handsontable.GridSettings {
    const hotConfig = this._hotConfig.getConfig();
    const negotiatedSettings: Handsontable.GridSettings = {};

    negotiatedSettings.licenseKey = settings.licenseKey ?? hotConfig.license;
    negotiatedSettings.language = settings.language ?? hotConfig.language;

    const theme = settings.theme ?? hotConfig.theme;
    const themeName = settings.themeName ?? hotConfig.themeName;

    if (theme !== undefined) {
      negotiatedSettings.theme = theme as Handsontable.GridSettings['theme'];
    } else if (themeName) {
      negotiatedSettings.themeName = themeName;
    }

    // settings that can be set only before the Handsontable instance is initialized
    if (!this.__hotInstance) {
      negotiatedSettings.layoutDirection = settings.layoutDirection ?? hotConfig.layoutDirection;
    }

    return negotiatedSettings;
  }
}
