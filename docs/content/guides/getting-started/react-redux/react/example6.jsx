import { useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import StarRatingComponent from 'react-star-rating-component';
import { Provider, connect } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { HotTable, HotColumn, BaseEditorComponent } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

// a custom editor component
class UnconnectedColorPicker extends BaseEditorComponent {
  constructor(props) {
    super(props);
    this.editorRef = React.createRef();
    this.state = {
      renderResult: null,
      value: '',
    };
  }
  stopMousedownPropagation(e) {
    e.stopPropagation();
  }
  setValue(value, callback) {
    this.setState((state, props) => {
      return { value };
    }, callback);
  }
  getValue() {
    return this.state.value;
  }
  open() {
    if (!this.editorRef.current) return;
    this.editorRef.current.style.display = 'block';
  }
  close() {
    if (!this.editorRef.current) return;
    this.editorRef.current.style.display = 'none';
    this.setState({
      pickedColor: null,
    });
  }
  prepare(row, col, prop, td, originalValue, cellProperties) {
    super.prepare(row, col, prop, td, originalValue, cellProperties);

    const tdPosition = td.getBoundingClientRect();

    if (!this.editorRef.current) return;
    this.editorRef.current.style.left = `${
      tdPosition.left + window.pageXOffset
    }px`;
    this.editorRef.current.style.top = `${
      tdPosition.top + window.pageYOffset
    }px`;
  }
  onPickedColor(color) {
    this.setValue(color, () => {});
  }
  applyColor() {
    const dispatch = this.props.dispatch;

    if (this.col === 1) {
      dispatch({
        type: 'updateActiveStarColor',
        row: this.row,
        hexColor: this.getValue(),
      });
    } else if (this.col === 2) {
      dispatch({
        type: 'updateInactiveStarColor',
        row: this.row,
        hexColor: this.getValue(),
      });
    }

    this.finishEditing();
  }
  render() {
    let renderResult = null;

    if (this.props.isEditor) {
      renderResult = (
        <div
          style={{
            display: 'none',
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 999,
            background: '#fff',
            padding: '15px',
            border: '1px solid #cecece',
          }}
          ref={this.editorRef}
          onMouseDown={this.stopMousedownPropagation}
        >
          <HexColorPicker
            color={this.state.pickedColor || this.state.value}
            onChange={this.onPickedColor.bind(this)}
          />
          <button
            style={{ width: '100%', height: '33px', marginTop: '10px' }}
            onClick={this.applyColor.bind(this)}
          >
            Apply
          </button>
        </div>
      );
    } else if (this.props.isRenderer) {
      renderResult = (
        <>
          <div
            style={{
              background: this.props.value,
              width: '21px',
              height: '21px',
              float: 'left',
              marginRight: '5px',
            }}
          />
          <div>{this.props.value}</div>
        </>
      );
    }

    return <>{renderResult}</>;
  }
}
const ColorPicker = connect(function (state) {
  return {
    activeColors: state.appReducer.activeColors,
    inactiveColors: state.appReducer.inactiveColors,
  };
})(UnconnectedColorPicker);

// a Redux component
const initialReduxStoreState = {
  activeColors: [],
  inactiveColors: [],
};

const appReducer = (state = initialReduxStoreState, action) => {
  switch (action.type) {
    case 'initRatingColors': {
      const { hotData } = action;
      const activeColors = hotData.map((data) => data[1]);
      const inactiveColors = hotData.map((data) => data[2]);

      return {
        ...state,
        activeColors,
        inactiveColors,
      };
    }
    case 'updateActiveStarColor': {
      const rowIndex = action.row;
      const newColor = action.hexColor;
      const activeColorArray = state.activeColors
        ? [...state.activeColors]
        : [];

      activeColorArray[rowIndex] = newColor;

      return {
        ...state,
        activeColors: activeColorArray,
      };
    }
    case 'updateInactiveStarColor': {
      const rowIndex = action.row;
      const newColor = action.hexColor;
      const inactiveColorArray = state.inactiveColors
        ? [...state.inactiveColors]
        : [];

      inactiveColorArray[rowIndex] = newColor;

      return {
        ...state,
        inactiveColors: inactiveColorArray,
      };
    }
    default:
      return state;
  }
};

const actionReducers = combineReducers({ appReducer });
const reduxStore = createStore(actionReducers);
// a custom renderer component
const UnconnectedStarRatingRenderer = ({
  row,
  col,
  value,
  activeColors,
  inactiveColors,
}) => {
  return (
    <StarRatingComponent
      name={`${row}-${col}`}
      value={value}
      starCount={5}
      starColor={activeColors?.[row || 0]}
      emptyStarColor={inactiveColors?.[row || 0]}
      editing={true}
    />
  );
};

const StarRatingRenderer = connect((state) => ({
  activeColors: state.appReducer.activeColors,
  inactiveColors: state.appReducer.inactiveColors,
}))(UnconnectedStarRatingRenderer);

const data = [
  [1, '#ff6900', '#fcb900'],
  [2, '#fcb900', '#7bdcb5'],
  [3, '#7bdcb5', '#8ed1fc'],
  [4, '#00d084', '#0693e3'],
  [5, '#eb144c', '#abb8c3'],
];

const ExampleComponent = () => {
  useEffect(() => {
    reduxStore.dispatch({
      type: 'initRatingColors',
      hotData: data,
    });
  }, []);

  return (
    <Provider store={reduxStore}>
      <HotTable
        data={data}
        rowHeaders={true}
        rowHeights={30}
        colHeaders={['Rating', 'Active star color', 'Inactive star color']}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      >
        <HotColumn width={100} type={'numeric'}>
          <StarRatingRenderer hot-renderer />
        </HotColumn>
        <HotColumn width={150}>
          <ColorPicker hot-renderer hot-editor />
        </HotColumn>
        <HotColumn width={150}>
          <ColorPicker hot-renderer hot-editor />
        </HotColumn>
      </HotTable>
    </Provider>
  );
};

export default ExampleComponent;
