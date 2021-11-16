import Handsontable from 'handsontable/base';
import { ThisTypedComponentOptionsWithRecordProps } from 'vue/types/options';

export type VNode = any;
export type Vue = any;

export interface HotTableProps extends Handsontable.GridSettings {
  id?: string,
  settings?: Handsontable.GridSettings,
  wrapperRendererCacheSize?: number,
  usesRendererComponent?: boolean,
  [additional: string]: any;
}

export interface EditorComponent extends Vue {
  focus(): void;
  open(event?: Event): void;
  close(): void;
  getValue(): any;
  setValue(newValue?: any): void;
  [additional: string]: any;
}

export interface HotTableData {
  __internalEdit: boolean,
  __hotInstance: Handsontable | null,
  miscCache?: {
    currentSourceColumns?: number
  },
  hotInstance?: Handsontable | null,
  columnSettings: HotTableProps[],
  rendererCache: any, // temporary `any`, TODO: use the LRU definition here
  editorCache: Map<string, EditorComponent>
}

export interface HotTableMethods {
  hotInit: () => void,
  getColumnSettings: () => HotTableProps[] | void,
  getGlobalRendererVNode: () => VNode | void,
  getGlobalEditorVNode: () => VNode | void,
  getRendererWrapper: (vNode: VNode, containerComponent: Vue) => (...args) => HTMLElement,
  getEditorClass: (vNode: VNode, containerComponent: Vue) => typeof Handsontable.editors.BaseEditor,
  matchHotMappersSize: () => void
}

export interface HotColumnProps extends Handsontable.GridSettings {
  settings: Handsontable.GridSettings,
}

export interface HotTableComponent<V extends Vue, D, M, C, P>
    extends ThisTypedComponentOptionsWithRecordProps<V, D, M, C, P> {
  version: string
}

export interface HotColumnMethods {
  createColumnSettings: () => void
}

export type VueProps<T> = { [P in keyof T]: any };

// eslint-disable-next-line @typescript-eslint/ban-types
type ClassMethodKey<T> = ({ [P in keyof T]: T[P] extends Function ? P : never })[keyof T];
type NonConstructorClassMethodKey<T> = Exclude<ClassMethodKey<T>, 'constructor'>;
// trim out the `originalValue` prop, as it's set to `any`
type NotOriginalValueProp<T> = Exclude<NonConstructorClassMethodKey<T>, 'originalValue'>;
// eslint-disable-next-line @typescript-eslint/ban-types
type ClassFieldKey<T> = ({[P in keyof T]: T[P] extends Function ? never : P })[keyof T];
type ClassMethods<T> = Pick<T, NotOriginalValueProp<T>>;
type ClassFields<T> = Pick<T, ClassFieldKey<T>>;

export type BaseVueEditorMethods = ClassMethods<Handsontable.editors.BaseEditor>;
export type BaseVueEditorFields = ClassFields<Handsontable.editors.BaseEditor>;
