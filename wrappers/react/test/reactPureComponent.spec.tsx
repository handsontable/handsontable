import React from 'react';
import {
  mount,
  ReactWrapper
} from 'enzyme';
import {
  HotTable
} from '../src/hotTable';
import {
  mockElementDimensions,
  sleep,
} from './_helpers';
import Handsontable from 'handsontable';

beforeEach(() => {
  let container = document.createElement('DIV');
  container.id = 'hotContainer';
  document.body.appendChild(container);
});

/**
 * Worth noting, that although it's possible to use React's Pure Components on renderer components, it doesn't do much, as currently they're recreated on every
 * Handsontable's `render`.
 */
describe('React PureComponents', () => {
  it('should be possible to declare the renderer as PureComponent', async (done) => {
    class RendererComponent2 extends React.PureComponent<any, any> {
      render(): React.ReactElement<string> {
        return (
          <>
            value: {this.props.value}
          </>
        );
      }
    }

    const wrapper: ReactWrapper<{}, {}, any> = mount(
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={Handsontable.helper.createSpreadsheetData(3, 3)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <RendererComponent2 hot-renderer/>
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(100);

    const hotTableInstance = wrapper.instance();
    const hotInstance = hotTableInstance.hotInstance;

    expect(hotInstance.getCell(0, 0).innerHTML).toEqual('<div>value: A1</div>');

    wrapper.detach();

    done();
  });

  /*
    Editors cannot be declared as PureComponents, as they're derived from the BaseEditorComponent class.
   */
});
