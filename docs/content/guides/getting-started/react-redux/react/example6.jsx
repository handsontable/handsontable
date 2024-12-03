import { useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import StarRatingComponent from 'react-star-rating-component';
import { Provider, connect, useDispatch } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { HotTable, HotColumn, useHotEditor } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const UnconnectedColorPickerEditor = () => {
  const dispatch = useDispatch();
  const editorRef = useRef(null);
  const [pickedColor, setPickedColor] = useState('');
  const { value, setValue, isOpen, finishEditing, col, row } = useHotEditor({
    onOpen: () => {
      if (editorRef.current) editorRef.current.style.display = 'block';
      document.querySelector('.react-colorful__interactive')?.focus();
    },
    onClose: () => {
      if (editorRef.current) editorRef.current.style.display = 'none';
      setPickedColor('');
    },
    onPrepare: (_row, _column, _prop, TD, _originalValue, _cellProperties) => {
      const tdPosition = TD.getBoundingClientRect();

      if (!editorRef.current) return;
      editorRef.current.style.left = `${
        tdPosition.left + window.pageXOffset
      }px`;
      editorRef.current.style.top = `${tdPosition.top + window.pageYOffset}px`;
    },
    onFocus: () => {},
  });

  const onPickedColor = (color) => {
    setValue(color);
  };

  const applyColor = () => {
    if (col === 1) {
      dispatch({
        type: 'updateActiveStarColor',
        row,
        hexColor: value,
      });
    } else if (col === 2) {
      dispatch({
        type: 'updateInactiveStarColor',
        row,
        hexColor: value,
      });
    }

    finishEditing();
  };

  const stopMousedownPropagation = (e) => {
    e.stopPropagation();
  };

  const stopKeyboardPropagation = (e) => {
    e.stopPropagation();

    if (e.key === 'Escape') {
      applyColor();
    }
  };

  return (
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
      ref={editorRef}
      onMouseDown={stopMousedownPropagation}
      onKeyDown={stopKeyboardPropagation}
    >
      <HexColorPicker color={pickedColor || value} onChange={onPickedColor} />
      <button
        style={{ width: '100%', height: '33px', marginTop: '10px' }}
        onClick={applyColor}
      >
        Apply
      </button>
    </div>
  );
};

const ColorPickerEditor = connect(function (state) {
  return {
    activeColors: state.appReducer.activeColors,
    inactiveColors: state.appReducer.inactiveColors,
  };
})(UnconnectedColorPickerEditor);

const ColorPickerRenderer = ({ value }) => {
  return (
    <>
      <div
        style={{
          background: value,
          width: '21px',
          height: '21px',
          float: 'left',
          marginRight: '5px',
        }}
      />
      <div>{value}</div>
    </>
  );
};

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
        <HotColumn width={100} type="numeric" renderer={StarRatingRenderer} />
        <HotColumn
          width={150}
          renderer={ColorPickerRenderer}
          editor={ColorPickerEditor}
        />
        <HotColumn
          width={150}
          renderer={ColorPickerRenderer}
          editor={ColorPickerEditor}
        />
      </HotTable>
    </Provider>
  );
};

export default ExampleComponent;
