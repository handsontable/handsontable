import React, { ChangeEvent, CSSProperties, MouseEvent } from "react";
import { BaseEditorComponent, HotEditorProps } from "@handsontable/react";
import { EditorInstance, positionHorizontally, positionVertically } from "../hooksCallbacks";
import { CellProperties } from "handsontable/types/settings";

interface IProgressBarRendererProps extends HotEditorProps {
  isEditor?: boolean;
  value: string;
}

export class ProgressBarRenderer extends BaseEditorComponent {
  editorRef = React.createRef<HTMLDivElement>();
  props!: IProgressBarRendererProps;
  state: {value: string};
  
  editorContainerStyle: CSSProperties = {
    display: 'none',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
    width: 106,
    marginLeft: 1,
    marginTop: 1,
    background: 'white'
  };
  
  constructor(props: IProgressBarRendererProps) {
    super(props);

    this.state = {
      value: ''
    };
  }

  stopMousedownPropagation(e: MouseEvent<HTMLDivElement>): void {
    e.stopPropagation();
  }

  setValue(value: string, callback: () => void) {
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

    const tdPosition = td.getBoundingClientRect();
    
    this.editorRef.current!.style.left = tdPosition.left + window.pageXOffset + 'px';
    this.editorRef.current!.style.top = tdPosition.top + window.pageYOffset + 'px';
  }

  handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    this.setValue(this.getRangeValue(event.target.value), () => {});
  }

  getRangeValue(value: string): string {
    const numberValue = parseInt(value);
    if (numberValue < 0 || !numberValue ) {
      return '0';
    }
    if (numberValue > 100) {
      return '100';
    }
    return value;
  }

  render() {
    if (this.props.isEditor) {
      return (
        <div style={this.editorContainerStyle} ref={this.editorRef} onMouseDown={this.stopMousedownPropagation}>
          <form onSubmit={(event) => {
            event.preventDefault();
            this.finishEditing();
          }}>
            <input
              style={{width: 103, border: 'none', outline: 'none'}}
              type="number"
              value={this.state.value}
              onChange={this.handleInputChange.bind(this)}
            />
          </form>
        </div>
      );
    }

    return (
      <div style={{marginTop: 6}}>
        <div className="progressBar" style={{ width: `${this.getRangeValue(this.props.value)}px` }} />
      </div>
    );
  }
}
