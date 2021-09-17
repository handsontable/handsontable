import { Injectable } from '@angular/core';
import Handsontable from 'handsontable';

const instances = new Map<string, Handsontable>();

export const HOT_DESTROYED_WARNING = 'The Handsontable instance bound to this component was destroyed and cannot be' +
  ' used properly.';

@Injectable()
export class HotTableRegisterer {
  public getInstance(id: string): Handsontable {
    const hotInstance = instances.get(id);

    if (hotInstance.isDestroyed) {
      console.warn(HOT_DESTROYED_WARNING);

      return null;
    }

    return hotInstance;
  }

  public registerInstance(id: string, instance: Handsontable): Map<string, Handsontable> {
    return instances.set(id, instance);
  }

  public removeInstance(id: string): boolean {
    return instances.delete(id);
  }
}
