import React, { ChangeEvent, CSSProperties, MouseEvent } from "react";
import { BaseEditorComponent, HotEditorProps } from "@handsontable/react";
import { EditorInstance, positionHorizontally, positionVertically } from "../hooksCallbacks";
import { CellProperties } from "handsontable/types/settings";

interface IStarsRendererProps extends HotEditorProps {
  isEditor?: boolean;
  value: string;
}

export class StarsRenderer extends BaseEditorComponent {
  editorRef = React.createRef<HTMLDivElement>();
  props!: IStarsRendererProps;
  state: { value: string };

  editorContainerStyle: CSSProperties = {
    display: 'none',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
    width: 90,
    marginLeft: 1,
    marginTop: 1,
    background: 'white'
  };

  constructor(props: IStarsRendererProps) {
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
  }

  prepare(row: number, col: number, prop: string | number, td: HTMLTableCellElement, originalValue: number, cellProperties: CellProperties) {
    super.prepare(row, col, prop, td, originalValue, cellProperties);

    const tdPosition = td.getBoundingClientRect();

    this.editorRef.current!.style.left = tdPosition.left + window.pageXOffset + 'px';
    this.editorRef.current!.style.top = tdPosition.top + window.pageYOffset + 'px';
  }

  handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    this.setValue(this.getRangeValue(event.target.value), () => {});
  }

  getRangeValue(value: string): string {
    if (parseInt(value) < 0) {
      return '0';
    }
    if (parseInt(value) > 5) {
      return '5';
    }
    return value;
  }

  render() {
    if (this.props.isEditor) {
      return (
        <div style={this.editorContainerStyle} ref={this.editorRef} onMouseDown={this.stopMousedownPropagation}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              this.finishEditing();
            }}
          >
            <input
              style={{ width: 90, border: 'none', outline: 'none' }}
              type="number"
              value={this.state.value}
              onChange={this.handleInputChange.bind(this)}
            />
          </form>
        </div>
      );
    }

    return (
      <div className="star htCenter">{"★".repeat(parseInt(this.getRangeValue(this.props.value)))}</div>
    );
  }
}
