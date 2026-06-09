import React, { useRef, useState } from 'react';
import { HotTable, HotColumn, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const Table = ({ hotTableRef, data }: { hotTableRef: React.RefObject<HotTableRef>; data: any[] }) => {
  return (
    <>
      <HotTable
        ref={hotTableRef}
        data={data}
        width="100%"
        height={300}
        stretchH="all"
        contextMenu={true}
        rowHeaders={true}
        colHeaders={true}
        autoWrapRow={true}
        autoWrapCol={true}
        autoRowSize={true}
        loading={true}
        licenseKey="non-commercial-and-evaluation"
      >
        <HotColumn title="Model" type="text" data="model" width={150} headerClassName="htLeft" />
        <HotColumn
          title="Price"
          type="numeric"
          data="price"
          width={80}
          locale="en-US" numericFormat={{ style: 'currency', currency: 'USD', minimumFractionDigits: 2 }}
          className="htRight"
          headerClassName="htRight"
        />
        <HotColumn
          title="Date"
          type="intl-date"
          data="sellDate"
          width={130}
          locale="en-US" dateFormat={{ month: 'short', day: 'numeric', year: 'numeric' }}
          className="htRight"
          headerClassName="htRight"
        />
        <HotColumn
          title="Time"
          type="intl-time"
          data="sellTime"
          width={90}
          timeFormat={{ hour: '2-digit', minute: '2-digit', hour12: true }}
          className="htRight"
          headerClassName="htRight"
        />
        <HotColumn title="In stock" type="checkbox" data="inStock" className="htCenter" headerClassName="htCenter" />
      </HotTable>
    </>
  );
};

const ExampleComponent = () => {
  const hotTableRef = useRef<HotTableRef>(null);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate data loading
  const loadData = async () => {
    const hotInstance = hotTableRef.current?.hotInstance;

    if (!hotInstance) {
      return;
    }

    const loadingPlugin = hotInstance.getPlugin('loading');

    setIsLoading(true);

    // Show loading dialog
    loadingPlugin.show();

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Simulated data
      setData([
        { model: 'Trail Helmet', price: 1298.14, sellDate: '2025-08-31', sellTime: '14:12', inStock: true },
        { model: 'Windbreaker Jacket', price: 178.9, sellDate: '2025-05-10', sellTime: '22:26', inStock: false },
        { model: 'Cycling Cap', price: 288.1, sellDate: '2025-09-15', sellTime: '09:37', inStock: true },
        { model: 'HL Mountain Frame', price: 94.49, sellDate: '2025-01-17', sellTime: '14:19', inStock: false },
        { model: 'Racing Socks', price: 430.38, sellDate: '2025-05-10', sellTime: '13:42', inStock: true },
        { model: 'Racing Socks', price: 138.85, sellDate: '2025-09-20', sellTime: '14:48', inStock: true },
        { model: 'HL Mountain Frame', price: 1909.63, sellDate: '2025-09-05', sellTime: '09:35', inStock: false },
        { model: 'Carbon Handlebar', price: 1080.7, sellDate: '2025-10-24', sellTime: '22:58', inStock: false },
        { model: 'Aero Bottle', price: 1571.13, sellDate: '2025-05-24', sellTime: '00:24', inStock: true },
        { model: 'Windbreaker Jacket', price: 919.09, sellDate: '2025-07-16', sellTime: '19:11', inStock: true },
      ]);

      // Load data into the table
      hotTableRef.current?.hotInstance?.loadData(data);

      // Hide loading dialog
      loadingPlugin.hide();

      setIsLoading(false);
    } catch (error) {
      // Handle error
      setTimeout(() => {
        loadingPlugin.hide();
        setIsLoading(false);
      }, 2000);
    }
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button type="button" id="loadData" onClick={loadData} disabled={isLoading}>
            {data.length > 0 ? 'Reload Data' : 'Load Data'}
          </button>
        </div>
      </div>
      <Table hotTableRef={hotTableRef} data={data} />
    </>
  );
};

export default ExampleComponent;
