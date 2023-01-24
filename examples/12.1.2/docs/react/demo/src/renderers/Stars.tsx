import { BaseEditorComponent, HotEditorProps } from '@handsontable/react';
import { getRangeValue } from './utils';

const minAllowedValue = 0;
const maxAllowedValue = 5;

interface IStarsRendererProps extends HotEditorProps {
  value: number;
}

export class StarsRenderer extends BaseEditorComponent {
  props!: IStarsRendererProps;

  render() {
    return (
      <div className="star htCenter">
        {"★".repeat(getRangeValue(this.props.value, minAllowedValue, maxAllowedValue))}
      </div>
    );
  }
}
