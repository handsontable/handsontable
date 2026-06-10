import { HotTable, HotColumn, EditorComponent } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import './example1.css';

registerAllModules();

interface StarRatingProps {
  name: string;
  value: number;
  editing?: boolean;
  onStarHover?: (value: number) => void;
  onStarClick?: (value: number) => void;
}

function StarRating({ name, value, editing = true, onStarHover, onStarClick }: StarRatingProps) {
  return (
    <div className="star-rating" aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={`${name}-${star}`}
          className={star <= value ? 'star filled' : 'star'}
          onMouseEnter={editing ? () => onStarHover?.(star) : undefined}
          onClick={editing ? () => onStarClick?.(star) : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/* start:skip-in-preview */

export const data = [
  { product: "Dashboard Pro", category: "Analytics", rating: 5, reviews: 342, price: 49 },
  { product: "Form Builder", category: "Tools", rating: 4, reviews: 218, price: 29 },
  { product: "Chart Engine", category: "Analytics", rating: 3, reviews: 156, price: 39 },
  { product: "Auth Module", category: "Security", rating: 5, reviews: 89, price: 19 },
  { product: "File Manager", category: "Storage", rating: 2, reviews: 64, price: 15 },
  { product: "Email Service", category: "Communication", rating: 4, reviews: 275, price: 25 },
  { product: "Search Index", category: "Tools", rating: 1, reviews: 31, price: 35 },
  { product: "Cache Layer", category: "Infra", rating: 4, reviews: 112, price: 20 },
];

/* end:skip-in-preview */

const RatingCellRenderer = ({ value }: { value: unknown }) => (
  <div className="rating-cell">
    <StarRating
      name="rating-cell"
      value={Number(value) || 0}
      editing={false}
    />
  </div>
);

const ratingValidator = (value: string | number, callback: (valid: boolean) => void) => {
  const parsed = parseInt(String(value));
  callback(parsed >= 0 && parsed <= 100);
};

export const RatingEditor = () => {
  return (
    <EditorComponent<number>>
      {({ value, setValue, finishEditing }) => (
        <div className="rating-editor">
          <StarRating
            name="rating"
            value={Number(value) || 0}
            onStarHover={(nextValue) => setValue(nextValue)}
            onStarClick={(nextValue) => {
              setValue(nextValue);
              finishEditing();
            }}
          />
        </div>
      )}
    </EditorComponent>
  );
};

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={["Product", "Category", "Rating", "Reviews", "Price"]}
      autoRowSize={true}
      rowHeaders={true}
      height="auto"
      width="100%"
      autoWrapRow={true}
      headerClassName="htLeft"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="product" type="text" width={240} />
      <HotColumn data="category" type="text" width={120} />
      <HotColumn
        data="rating"
        width={150}
        editor={RatingEditor}
        renderer={RatingCellRenderer}
        validator={ratingValidator}
      />
      <HotColumn data="reviews" type="numeric" width={80} />
      <HotColumn data="price" type="numeric" width={80} />
    </HotTable>
  );
};

export default ExampleComponent;
