import { useEffect, createRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import StarRatingComponent from 'react-star-rating-component';
import { Provider, connect } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { HotTable, HotColumn, useHotEditor } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

// a custom renderer component
const ColorPickerRenderer = (props) => {
  const colorboxStyle = {
    background: props.value,
    width: '21px',
    height: '21px',
    float: 'left',
    marginRight: '5px'
  };

  return (
    <>
      <div style={colorboxStyle} />
      <div>{props.value}</div>
    </>
  );
};

// a custom editor component
const UnconnectedColorPickerEditor = (props) => {
  const editorRef = React.useRef(null);

  const editorContainerStyle = {
    display: 'none',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 999,
    background: '#fff',
    padding: '15px',
    border: '1px solid #cecece'
  };

  const stopMousedownPropagation = React.useCallback((e) => {
    e.stopPropagation();
  }, []);

  const { value, setValue, row, col, finishEditing } = useHotEditor({
    onOpen() {
      editorRef.current.style.display = 'block';
    },

    onClose() {
      editorRef.current.style.display = 'none';
    },

    onPrepare(row, col, prop, td, originalValue, cellProperties) {
      const tdPosition = td.getBoundingClientRect();

      editorRef.current.style.left = tdPosition.left + window.pageXOffset + 'px';
      editorRef.current.style.top = tdPosition.top + window.pageYOffset + 'px';
    }
  });

  const applyColor = React.useCallback(() => {
    const dispatch = props.dispatch;

    if (col === 1) {
      dispatch({
        type: 'updateActiveStarColor',
        row: row,
        hexColor: value
      });
    } else if (col === 2) {
      dispatch({
        type: 'updateInactiveStarColor',
        row: row,
        hexColor: value
      });
    }
    finishEditing();
  }, [props.dispatch, value, row, col, finishEditing]);

  return (
    <div style={editorContainerStyle} ref={editorRef} onMouseDown={stopMousedownPropagation}>
      <HexColorPicker
        color={value}
        onChange={setValue}
      />
      <button
        style={{ width: '100%', height: '33px', marginTop: '10px' }}
        onClick={applyColor}
      >
        Apply
      </button>
    </div>
  );
};

const ColorPickerEditor = connect(function(state) {
  return {
    activeColors: state.appReducer.activeColors,
    inactiveColors: state.appReducer.inactiveColors,
  };
})(UnconnectedColorPickerEditor);

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
  [5, '#eb144c', '#abb8c3']
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
        {/* add the `renderer` prop to set the component as a Handsontable renderer */}
        <HotColumn width={100} type={'numeric'} renderer={StarRatingRenderer} />
        {/* add the `renderer` and `editor` props to set the component as a Handsontable renderer and editor */}
        <HotColumn width={150}
                   renderer={ColorPickerRenderer}
                   editor={ColorPickerEditor} />
        <HotColumn width={150}
                   renderer={ColorPickerRenderer}
                   editor={ColorPickerEditor} />
      </HotTable>
    </Provider>
  );
};

export default ExampleComponent;
