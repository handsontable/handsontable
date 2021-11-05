export function getListenersCounter(): number;
export default class EventManager {
  constructor(context?: object);

  context: any;

  addEventListener(element: Element, eventName: string, callback: (event: Event) => void, options?: boolean | AddEventListenerOptions): () => void;
  removeEventListener(element: Element, eventName: string, callback: () => void, onlyOwnEvents?: boolean): void;
  clear(): void;
  destroy(): void;
  destroyWithOwnEventsOnly(): void;
  fireEvent(element: Element, eventName: string): void;
}
