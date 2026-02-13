import { HotTable, HotColumn, EditorComponent } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import StarRatingComponent from 'react-star-rating-component';

registerAllModules();

const inputData = new Array(10)
  .fill(null)
  .map((_, row) =>
    new Array(10)
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

export const data = inputData.map((el) => ({
  ...el,
  rating: Math.floor(Math.random() * 5) + 1,
}));

export const RatingEditor = () => {
  return (
    <div className="rating-editor">
      <EditorComponent<number>>
        {({ value, setValue, finishEditing }) => (
          <StarRatingComponent
            name="rating"
            value={Number(value) || 0}
            onStarHover={(nextValue) => setValue(nextValue)}
            onStarClick={(nextValue) => {
              setValue(nextValue);
              finishEditing();
            }}
          />
        )}
      </EditorComponent>
    </div>
  );
};

const ExampleComponent = () => {
  return (
    <HotTable
      autoRowSize={true}
      rowHeaders={true}
      autoWrapRow={true}
      licenseKey="non-commercial-and-evaluation"
      height="auto"
      themeName="ht-theme-main"
      data={data}
      colHeaders={true}
    >
      <HotColumn
        width={250}
        editor={RatingEditor}
        data="rating"
        title="Rating"
      />
    </HotTable>
  );
};

export default ExampleComponent;
