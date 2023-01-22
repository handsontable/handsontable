import React, { ChangeEvent, MouseEvent } from 'react';
import { BaseEditorComponent, HotEditorProps } from '@handsontable/react';
import { EditorInstance, positionHorizontally, positionVertically } from '../hooksCallbacks';
import { CellProperties } from '../../../../../../../handsontable/types/settings';
import { getRangeValue, defaultEditorStyles } from './utils';

const minAllowedValue = 0;
const maxAllowedValue = 5;

interface IStarsRendererProps extends HotEditorProps {
  isEditor?: boolean;
  value: string;
}

export class StarsRenderer extends BaseEditorComponent {
  editorRef = React.createRef<HTMLDivElement>();
  props!: IStarsRendererProps;
  state: { value: string };

  constructor(props: IStarsRendererProps) {
    super(props);

    this.state = {
      value: ''
    };
  }

  stopMousedownPropagation(e: MouseEvent<HTMLDivElement>): void {
    e.stopPropagation();
  }

  setValue(value: number, callback: () => void) {
    this.setState(() => {
      return { value: value };
    }, callback);
  }

  getValue() {
    return this.state.value;
  }

  open() {
    const editorInstance = this as unknown as EditorInstance;
    editorInstance.editorRef.current!.style.display = 'block';
    editorInstance.editorRef.current!.querySelector('input')!.focus();
    editorInstance.hotInstance.addHook('afterScrollVertically', () => positionVertically(editorInstance));
    editorInstance.hotInstance.addHook('afterScrollHorizontally', () => positionHorizontally(editorInstance));
  }

  close() {
    this.editorRef.current!.style.display = 'none';
    this.hotInstance.removeHook('afterScrollVertically')
    this.hotInstance.removeHook('afterScrollHorizontally')
  }

  prepare(row: number, col: number, prop: string | number, td: HTMLTableCellElement, originalValue: number, cellProperties: CellProperties) {
    super.prepare(row, col, prop, td, originalValue, cellProperties);
    
    const tdRect = td.getBoundingClientRect();

    this.editorRef.current!.style.width = `${tdRect.width}px`;
    this.editorRef.current!.style.left = `${tdRect.left + window.pageXOffset}px`;
    this.editorRef.current!.style.top = `${tdRect.top + window.pageYOffset}px`;
  }

  handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    this.setValue(getRangeValue(event.target.value, minAllowedValue, maxAllowedValue), () => {});
  }

  render() {
    if (this.props.isEditor) {
      return (
        <div style={defaultEditorStyles} ref={this.editorRef} onMouseDown={this.stopMousedownPropagation}>
          <form onSubmit={(event) => {
              event.preventDefault();
              this.finishEditing();
            }}
          >
            <input
              style={{ width: '95%', border: 'none', outline: 'none' }}
              type="number"
              value={this.state.value}
              onChange={this.handleInputChange.bind(this)}
            />
          </form>
        </div>
      );
    }

    return (
      <div className="star htCenter">{"★".repeat(getRangeValue(this.props.value, minAllowedValue, maxAllowedValue))}</div>
    );
  }
}
