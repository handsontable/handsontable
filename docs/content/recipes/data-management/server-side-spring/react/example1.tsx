import { useCallback, useMemo } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type {
  DataProviderQueryParameters,
  DataProviderFetchOptions,
  DataProviderFetchResult,
} from 'handsontable/plugins/dataProvider';

registerAllModules();

/**
 * Builds a URL with query parameters, skipping undefined and null values.
 *
 * @param base - The base path (e.g. '/api/products').
 * @param params - Key/value pairs to append as query parameters.
 * @returns The assembled URL string.
 */
function buildUrl(base: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(base, window.location.origin);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

const ExampleComponent = () => {
  /**
   * Fetches a page of products from the Spring Boot REST API.
   *
   * Handsontable passes the current page, pageSize, sort state, and active
   * filters. The function maps them to Spring Boot query parameters and
   * returns { rows, totalRows } so the grid can render pagination controls.
   *
   * The AbortSignal in the second argument lets the browser cancel
   * in-flight requests when the user quickly changes pages or filters.
   */
  const fetchRows = useCallback(
    async (
      { page, pageSize, sort, filters }: DataProviderQueryParameters,
      { signal }: DataProviderFetchOptions
    ): Promise<DataProviderFetchResult> => {
      const url = buildUrl('/api/products', {
        page,
        pageSize,
        sortProp: sort?.prop,
        sortOrder: sort?.order,
        // Handsontable passes filters as an array of objects; serialize to JSON
        // so it can travel as a single query parameter.
        filters: filters ? JSON.stringify(filters) : undefined,
      });

      const res = await fetch(url, { signal });
      const json = await res.json() as { rows: unknown[]; totalRows: number };

      // The Spring Boot controller returns { rows, totalRows }.
      return { rows: json.rows, totalRows: json.totalRows };
    },
    []
  );

  /**
   * Sends a request to create one or more empty rows on the server.
   *
   * The payload shape is { position, referenceRowId, rowsAmount }, which
   * matches the CreateRowsPayload DTO in ProductController.
   */
  const onRowsCreate = useCallback(async (payload: unknown): Promise<void> => {
    await fetch('/api/products/create-rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }, []);

  /**
   * Sends changed cell values to the server.
   *
   * Each element in the array is { id, changes } where changes is a map
   * of column name to new value -- matching UpdateRowPayload on the server.
   */
  const onRowsUpdate = useCallback(async (rows: unknown): Promise<void> => {
    await fetch('/api/products/update-rows', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });
  }, []);

  /**
   * Sends an array of row IDs to delete on the server.
   */
  const onRowsRemove = useCallback(async (rowIds: unknown[]): Promise<void> => {
    await fetch('/api/products/remove-rows', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rowIds),
    });
  }, []);

  const dataProvider = useMemo(
    () => ({
      // 'id' is the primary key returned by the Spring Boot API.
      rowId: 'id',
      fetchRows,
      onRowsCreate,
      onRowsUpdate,
      onRowsRemove,
    }),
    [fetchRows, onRowsCreate, onRowsUpdate, onRowsRemove]
  );

  return (
    <div>
      <HotTable
        dataProvider={dataProvider}
        // Column definitions map to the fields returned by the Spring Boot API.
        columns={[
          { data: 'id', title: 'ID', readOnly: true, width: 60 },
          { data: 'name', title: 'Name', width: 200 },
          { data: 'sku', title: 'SKU', width: 120 },
          { data: 'category', title: 'Category', width: 130 },
          {
            data: 'price',
            title: 'Price',
            type: 'numeric',
            numericFormat: { pattern: '0,0.00', culture: 'en-US' },
            width: 100,
          },
          { data: 'stock', title: 'Stock', type: 'numeric', width: 80 },
        ]}
        colHeaders={true}
        rowHeaders={true}
        height={450}
        width="100%"
        // Enable server-side column sorting.
        columnSorting={true}
        // Enable column filter dropdowns.
        filters={true}
        dropdownMenu={true}
        // Show 10 rows per page; the server returns the matching slice.
        pagination={{ pageSize: 10 }}
        // Show a placeholder message when no rows match the active filters.
        emptyDataState={true}
        // Show an error toast when a fetch or mutation request fails.
        notification={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
