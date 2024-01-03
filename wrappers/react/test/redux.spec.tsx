import React from 'react';
import { act } from '@testing-library/react';
import { createStore, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import {
  HotTable
} from '../src/hotTable';
import {
  createSpreadsheetData,
  mockElementDimensions,
  sleep,
  RendererComponent,
  EditorComponent,
  mountComponent
} from './_helpers';

const initialReduxStoreState = {
  hexColor: '#fff'
};

const appReducer = (state = initialReduxStoreState, action) => {
  switch (action.type) {
    case 'updateColor':
      const newColor = action.hexColor;

      return Object.assign({}, state, {
        hexColor: newColor
      });
    default:
      return state;
  }
};
const actionReducers = combineReducers({appReducer});
const reduxStore = createStore(actionReducers);

beforeEach(() => {
  reduxStore.dispatch({
    type: 'updateColor',
    hexColor: '#fff'
  });
});

describe('Using Redux store within HotTable renderers and editors', () => {
  it('should be possible to use redux-enabled components as renderers', async () => {
    const ReduxEnabledRenderer = connect(function (state: any) {
        return {
          bgColor: state.appReducer.hexColor
        }
      }, () => {
        return {};
      },
      null,
      {
        forwardRef: true
      })(RendererComponent);
    let rendererInstances = new Map();

    mountComponent((
      <Provider store={reduxStore}>
        <HotTable licenseKey="non-commercial-and-evaluation"
                  id="test-hot"
                  data={createSpreadsheetData(3, 3)}
                  width={300}
                  height={300}
                  rowHeights={23}
                  colWidths={50}
                  autoRowSize={false}
                  autoColumnSize={false}
                  init={function () {
                    mockElementDimensions(this.rootElement, 300, 300);
                  }}>
          <ReduxEnabledRenderer ref={function (instance) {
            if (instance === null) {
              return instance;
            }

            rendererInstances.set(`${instance.props.row}-${instance.props.col}`, instance);
          }
          } hot-renderer/>
        </HotTable>
      </Provider>
    ));

    rendererInstances.forEach((component, key, map) => {
      expect(component.props.bgColor).toEqual('#fff');
    });

    await act(async () => {
      reduxStore.dispatch({
        type: 'updateColor',
        hexColor: '#B57267'
      });
    });

    rendererInstances.forEach((component, key, map) => {
      expect(component.props.bgColor).toEqual('#B57267');
    });
  });

  it('should be possible to use redux-enabled components as editors', async () => {
    const ReduxEnabledEditor = connect(function (state: any) {
        return {
          bgColor: state.appReducer.hexColor
        }
      }, () => {
        return {};
      },
      null,
      {
        forwardRef: true
      })(EditorComponent);
    let editorInstances = new Map();

    mountComponent((
      <Provider store={reduxStore}>
        <HotTable licenseKey="non-commercial-and-evaluation"
                  id="test-hot"
                  data={createSpreadsheetData(3, 3)}
                  width={300}
                  height={300}
                  rowHeights={23}
                  colWidths={50}
                  init={function () {
                    mockElementDimensions(this.rootElement, 300, 300);
                  }}>
          <ReduxEnabledEditor ref={function (instance) {
            if (instance === null) {
              return instance;
            }

            editorInstances.set(`${instance.props.row}-${instance.props.col}`, instance);
          }
          } hot-editor/>
        </HotTable>
      </Provider>
    ));

    await sleep(100);

    editorInstances.forEach((value, key, map) => {
      expect(value.props.bgColor).toEqual('#fff');
    });

    await act(async () => {
      reduxStore.dispatch({
        type: 'updateColor',
        hexColor: '#B57267'
      });
    });

    editorInstances.forEach((value, key, map) => {
      expect(value.props.bgColor).toEqual('#B57267');
    });
  });
});
