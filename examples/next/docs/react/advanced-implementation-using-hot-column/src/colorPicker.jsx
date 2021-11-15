import React from "react";
import { TwitterPicker } from "react-color";
import NativeListener from "react-native-listener";
import { connect } from "react-redux";
import { BaseEditorComponent } from "@handsontable/react";

class UnconnectedColorPicker extends BaseEditorComponent {
  constructor(props) {
    super(props);

    this.editorRef = React.createRef();

    this.editorContainerStyle = {
      display: "none",
      position: "absolute",
      left: 0,
      top: 0,
      zIndex: 999,
      background: "#fff",
      padding: "15px",
      border: "1px solid #cecece"
    };

    this.state = {
      renderResult: null,
      value: ""
    };
  }

  stopMousedownPropagation(e) {
    e.stopImmediatePropagation();
  }

  setValue(value, callback) {
    this.setState((state, props) => {
      return { value: value };
    }, callback);
  }

  getValue() {
    return this.state.value;
  }

  open() {
    this.editorRef.current.style.display = "block";
  }

  close() {
    this.editorRef.current.style.display = "none";

    this.setState({
      pickedColor: null
    });
  }

  prepare(row, col, prop, td, originalValue, cellProperties) {
    super.prepare(row, col, prop, td, originalValue, cellProperties);

    const tdPosition = td.getBoundingClientRect();

    this.editorRef.current.style.left = tdPosition.left + "px";
    this.editorRef.current.style.top = tdPosition.top + "px";
  }

  onPickedColor(color) {
    this.setValue(color.hex);
  }

  applyColor() {
    const dispatch = this.props.dispatch;

    if (this.col === 1) {
      dispatch({
        type: "updateActiveStarColor",
        row: this.row,
        hexColor: this.getValue()
      });
    } else if (this.col === 2) {
      dispatch({
        type: "updateInactiveStarColor",
        row: this.row,
        hexColor: this.getValue()
      });
    }
    this.finishEditing();
  }

  render() {
    let renderResult = null;

    if (this.props.isEditor) {
      renderResult = (
        <NativeListener onMouseDown={this.stopMousedownPropagation}>
          <div style={this.editorContainerStyle} ref={this.editorRef}>
            <TwitterPicker
              color={this.state.pickedColor || this.state.value}
              onChangeComplete={this.onPickedColor.bind(this)}
            />
            <button
              style={{ width: "100%", height: "33px", marginTop: "10px" }}
              onClick={this.applyColor.bind(this)}
            >
              Apply
            </button>
          </div>
        </NativeListener>
      );
    } else if (this.props.isRenderer) {
      const colorboxStyle = {
        background: this.props.value,
        width: "21px",
        height: "21px",
        float: "left",
        marginRight: "5px"
      };

      renderResult = (
        <>
          <div style={colorboxStyle} />
          <div>{this.props.value}</div>
        </>
      );
    }

    return <>{renderResult}</>;
  }
}

export const ColorPicker = connect(function(state) {
  return {
    activeColors: state.appReducer.activeColors,
    inactiveColors: state.appReducer.inactiveColors
  };
})(UnconnectedColorPicker);
