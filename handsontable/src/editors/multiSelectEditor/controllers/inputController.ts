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
  /**
   * The search input element managed by this controller.
   */
  input: HTMLInputElement;
  /**
   * The event manager used to register and remove DOM event listeners.
   */
  eventManager: InstanceType<typeof EventManager>;
  /**
   * Whether the search input is currently active and listening for input events.
   */
  enabled: boolean;

  /**
   * Internal storage map for local hook callbacks registered on this controller.
   */
  declare _localHooks: Record<string, Function[]>;
  /**
   * Registers a local hook callback for the given key on this controller.
   */
  declare addLocalHook: (key: string, callback: Function) => this;
  /**
   * Removes a local hook callback for the given key on this controller.
   */
  declare removeLocalHook: (key: string, callback: Function) => this;
  /**
   * Runs all local hook callbacks registered under the given key.
   */
  declare runLocalHooks: (key: string, ...args: unknown[]) => void;
  /**
   * Removes all local hook callbacks registered on this controller.
   */
  declare clearLocalHooks: () => this;

  /**
   * Bound handler for the native input event, used to trigger filtering.
   */
  private onInput = this._onInput.bind(this);

  /**
   * Wires the given input element and event manager, and enables the controller immediately.
   */
  constructor({ input, eventManager }: InputControllerOptions) {
    this.input = input;
    this.eventManager = eventManager;
    this.enabled = true;
  }

  /**
   * Returns the underlying `<input>` element managed by this controller.
   */
  getInputElement(): HTMLInputElement {
    return this.input;
  }

  /**
   * Writes the given string into the input element's value property without firing a DOM input event.
   */
  setValue(value: string): void {
    this.input.value = value;
  }

  /**
   * Enables or disables the input controller: passes `true` to start listening for input events,
   * `false` to stop.
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
   * Registers the native `input` event listener on the managed element so that typing triggers `triggerFilter`.
   */
  listen(): void {
    this.eventManager.addEventListener(this.input, 'input', this.onInput as (event: Event) => void);
  }

  /**
   * Removes the previously registered `input` event listener from the managed element.
   */
  unlisten(): void {
    this.eventManager.removeEventListener(this.input, 'input', this.onInput as (event: Event) => void);
  }

  /**
   * Handles the native input event and delegates to the internal filter trigger.
   */
  private _onInput(): void {
    this.#triggerFilter(this.input.value);
  }

  /**
   * Runs all `triggerFilter` local hook callbacks with the current input value to initiate
   * entry filtering in the dropdown.
   */
  #triggerFilter(value: string): void {
    this.runLocalHooks('triggerFilter', value);
  }
}

mixin(InputController, localHooks);
