
import { CellProperties } from '../settings';
import { BaseEditor } from './baseEditor/baseEditor';
import { Context } from '../shortcuts/context';

type Shortcut = Parameters<Context['addShortcut']>[0];

type ExtendedEditor<T> = BaseEditor & {
  render: (editor: ExtendedEditor<T>) => void;
  value?: T extends {
    value: any;
  } ? T['value'] : any;
  config?: T extends {
    config: any;
  } ? T['config'] : any;
  container: HTMLDivElement;
} & T;

export declare const editorFactory: <TProperties, TMethods = Record<string, any>>({ init, afterOpen, afterInit, afterClose, beforeOpen, getValue, setValue, onFocus, shortcuts, value, render, config, shortcutsGroup, ...args }:{
    value?: TProperties extends {
        value: any;
    } ? TProperties['value'] : any;
    config?: TProperties extends {
        config: any;
    } ? TProperties['config'] : any;
    render?: (editor: ExtendedEditor<TProperties & TMethods>) => void;
    init: (editor: ExtendedEditor<TProperties & TMethods>) => void;
    afterOpen?: (editor: ExtendedEditor<TProperties & TMethods>, event?: Event) => void;
    afterClose?: (editor: ExtendedEditor<TProperties & TMethods>) => void;
    afterInit?: (editor: ExtendedEditor<TProperties & TMethods>) => void;
    beforeOpen?: (editor: ExtendedEditor<TProperties & TMethods>, { row, col, prop, td, originalValue, cellProperties, }: {
      row: number;
      col: number;
      prop: string | number;
      td: HTMLTableCellElement;
      originalValue: any;
      cellProperties: CellProperties;
    }) => void;
    getValue?: (editor: ExtendedEditor<TProperties & TMethods>) => any;
    setValue?: (editor: ExtendedEditor<TProperties & TMethods>, value: any) => void;
    onFocus?: (editor: ExtendedEditor<TProperties & TMethods>) => void;
    shortcutsGroup?: string;
    shortcuts?: (Omit<Shortcut, 'callback' | 'group'> & {
      callback: (editor: ExtendedEditor<TProperties & TMethods>, event: Event) => boolean | void;
      group?: string;
    })[];
    position?: 'container' | 'portal';
  } & TMethods & Record<string, any>) => ExtendedEditor<TProperties>;
