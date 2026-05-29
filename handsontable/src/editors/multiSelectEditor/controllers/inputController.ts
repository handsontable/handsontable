import { mixin } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';
import type EventManager from '../../../eventManager';

export interface InputControllerOptions {
  input: HTMLInputElement;
  eventManager: InstanceType<typeof EventManager>;
}

/**
 * Controller for managing the input.
 *
 * @private
 * @class InputController
 */
export class InputController {
  input: HTMLInputElement;
  eventManager: InstanceType<typeof EventManager>;
  enabled: boolean;

  declare _localHooks: Record<string, Function[]>;
  declare addLocalHook: (key: string, callback: Function) => this;
  declare removeLocalHook: (key: string, callback: Function) => this;
  declare runLocalHooks: (key: string, ...args: unknown[]) => void;
  declare clearLocalHooks: () => this;

  private onInput = this._onInput.bind(this);

  /**
   * Creates a new InputController.
   */
  constructor({ input, eventManager }: InputControllerOptions) {
    this.input = input;
    this.eventManager = eventManager;
    this.enabled = true;
  }

  /**
   * Gets the input element.
   */
  getInputElement(): HTMLInputElement {
    return this.input;
  }

  /**
   * Sets the value of the input.
   */
  setValue(value: string): void {
    this.input.value = value;
  }

  /**
   * Toggles the input.
   *
   * @param {boolean} enabled If true, the input will be enabled.
   */
  toggle(enabled: boolean): void {
    this.enabled = enabled;

    if (this.input) {
      if (enabled) {
        this.listen();
      } else {
        this.unlisten();
      }
    }
  }

  /**
   * Listens to the input keyup event.
   */
  listen(): void {
    this.eventManager.addEventListener(this.input, 'input', this.onInput as (event: Event) => void);
  }

  /**
   * Unlistens to the input keyup event.
   */
  unlisten(): void {
    this.eventManager.removeEventListener(this.input, 'input', this.onInput as (event: Event) => void);
  }

  private _onInput(): void {
    this.#triggerFilter(this.input.value);
  }

  /**
   * Triggers the filtering.
   */
  #triggerFilter(value: string): void {
    this.runLocalHooks('triggerFilter', value);
  }
}

mixin(InputController, localHooks);
