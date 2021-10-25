export function getListenersCounter(): number;
export default EventManager;

declare class EventManager {
  private constructor();

  context: any;

  addEventListener(element: Element, eventName: string, callback: Function, options?: boolean | AddEventListenerOptions): Function;
  removeEventListener(element: Element, eventName: string, callback: Function, onlyOwnEvents?: boolean): void;
  clear(): void;
  destroy(): void;
  destroyWithOwnEventsOnly(): void;
  fireEvent(element: Element, eventName: string): void;
}
