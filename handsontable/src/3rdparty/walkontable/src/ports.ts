/**
 * Outward ports for the Walkontable rendering engine.
 *
 * These are thin, type-only interfaces that name the boundaries between the engine and the world
 * outside it. They add no runtime code and change no call path: each port is a description of a
 * surface the engine already uses, and the compiler enforces that the existing concrete type still
 * satisfies it. That enforcement is the whole point — a port that no existing type has to satisfy
 * would be speculative.
 *
 * - `SettingsPort` is enforced by `class Settings implements SettingsPort` (a WoT-owned class).
 * - `HooksPort` is enforced by a type-level assertion against the shared `EventManager`. `EventManager`
 *   lives in core and is used far beyond WoT, so it must not depend on a WoT type; the assertion below
 *   checks conformance without editing it.
 *
 * A `CellRendererPort` is intentionally NOT defined here yet. The cell- and header-renderer boundary is
 * currently a set of plain functions read through settings (`cellRenderer`, `rowHeaders`,
 * `columnHeaders`) with no cohesive implementing type to attach a port to. Formalizing it would mean
 * inventing an adapter with no existing implementor, which the ports here deliberately avoid. It is
 * revisited when the render slice is reshaped.
 */
import type { default as EventManager } from '../../../eventManager';

/**
 * The settings-read surface the engine consumes. Mirrors the general signatures of `Settings` so the
 * class satisfies the port; the specific per-key `getSetting` overloads stay on `Settings` itself and
 * remain available to callers that use the concrete type.
 */
export interface SettingsPort {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors Settings.getSetting so the class satisfies the port
  getSetting<T = any>(key: string, param1?: any, param2?: unknown, param3?: unknown, param4?: unknown): T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors Settings.getSettingPure
  getSettingPure<T = any>(key: string): T;
  has(key: string): boolean;
  // `Settings.update` returns `Settings`; a `void` return here still accepts it (a value-returning
  // method is assignable to a void-returning one) and keeps the port free of a concrete dependency.
  update(settings: string | Record<string, unknown>, value?: unknown): void;
}

/**
 * The DOM-event-binding surface the engine uses to attach and tear down the listeners that back its
 * hooks. Matches the methods the engine actually calls on its `EventManager`.
 */
export interface HooksPort {
  addEventListener<E extends Event = Event>(
    element: Element | Document | Window,
    eventName: string,
    callback: (event: E) => void,
    options?: boolean | AddEventListenerOptions
  ): () => void;
  removeEventListener(
    element: Element | Document | Window,
    eventName: string,
    callback: (event: Event) => void,
    onlyOwnEvents?: boolean
  ): void;
  clearEvents(onlyOwnEvents?: boolean): void;
  destroy(): void;
  destroyWithOwnEventsOnly(): void;
}

/**
 * Forces a compile error when its argument type is not exactly `true`.
 */
type Assert<Condition extends true> = Condition;

/**
 * Compile-time guarantee that the shared `EventManager` still satisfies `HooksPort`. Emits no
 * JavaScript. If `EventManager`'s surface drifts away from the port, this alias resolves to
 * `Assert<false>` and fails to compile.
 */
export type EventManagerSatisfiesHooksPort = Assert<EventManager extends HooksPort ? true : false>;
