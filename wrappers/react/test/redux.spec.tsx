import React from 'react';
import { act } from '@testing-library/react';
import { createStore, combineReducers, AnyAction } from 'redux';
import { Provider, connect } from 'react-redux';
import { HotTable } from '../src/hotTable';
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

const appReducer = (state = initialReduxStoreState, action: AnyAction) => {
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
      })(RendererComponent);

    const rendererInstances = new Map();

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
                  }}
                  renderer={(props) => <ReduxEnabledRenderer {...props} tap={(props) =>  {
                    rendererInstances.set(`${props.row}-${props.col}`, props);
                  }
                  } />} />
      </Provider>
    ));

    expect(rendererInstances.size).not.toEqual(0);

    rendererInstances.forEach((props, key, map) => {
      expect(props.bgColor).toEqual('#fff');
    });

    await act(async () => {
      reduxStore.dispatch({
        type: 'updateColor',
        hexColor: '#B57267'
      });
    });

    rendererInstances.forEach((props) => {
      expect(props.bgColor).toEqual('#B57267');
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

    let editorProps: any;

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
                  }}
                  editor={() => <ReduxEnabledEditor tap={(props) => {
                    editorProps = props
                  }
                  } />} />
      </Provider>
    ));

    await sleep(100);

    expect(editorProps.bgColor).toEqual('#fff');

    await act(async () => {
      reduxStore.dispatch({
        type: 'updateColor',
        hexColor: '#B57267'
      });
    });

    expect(editorProps.bgColor).toEqual('#B57267');
  });
});
