import React, { useRef, useState, useEffect } from 'react';
import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const Table = React.memo(({ hotTableRef, data }) => {
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
          locale="en-US"
          numericFormat={{ style: 'currency', currency: 'USD', minimumFractionDigits: 2 }}
          className="htRight"
          headerClassName="htRight"
        />
        <HotColumn
          title="Date"
          type="intl-date"
          data="sellDate"
          width={130}
          locale="en-US"
          dateFormat={{ month: 'short', day: 'numeric', year: 'numeric' }}
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
});

const ExampleComponent = () => {
  const hotTableRef = useRef(null);
  const paginationContainerRef = useRef(null);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const paginationContainer = paginationContainerRef?.current;
    const hot = hotTableRef.current?.hotInstance;

    if (!hot || !paginationContainer) {
      return;
    }

    hot.updateSettings({
      pagination: {
        uiContainer: paginationContainer,
      },
    });
    // Add hooks to show and hide the pagination container overlay
    hot.addHook('afterLoadingShow', () => {
      paginationContainer.classList.add('overlay');
    });
    hot.addHook('afterLoadingHide', () => {
      paginationContainer.classList.remove('overlay');
    });
  }, []);

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
        { model: 'LED Bike Light', price: 1012.5, sellDate: '2025-05-01', sellTime: '17:30', inStock: false },
        { model: 'Windbreaker Jacket', price: 635.37, sellDate: '2025-05-14', sellTime: '09:05', inStock: true },
        { model: 'Road Tire Tube', price: 1421.27, sellDate: '2025-01-31', sellTime: '13:33', inStock: true },
        { model: 'Action Camera', price: 1019.05, sellDate: '2025-12-07', sellTime: '01:26', inStock: false },
        { model: 'Carbon Handlebar', price: 603.96, sellDate: '2025-09-13', sellTime: '04:10', inStock: false },
        { model: 'Aero Bottle', price: 1334.03, sellDate: '2025-01-24', sellTime: '03:29', inStock: false },
        { model: 'Road Tire Tube', price: 1841.17, sellDate: '2025-05-22', sellTime: '01:45', inStock: false },
        { model: 'Aero Bottle', price: 1622.05, sellDate: '2025-01-13', sellTime: '08:30', inStock: true },
        { model: 'Comfort Saddle', price: 1456.24, sellDate: '2025-07-20', sellTime: '03:39', inStock: false },
        { model: 'Windbreaker Jacket', price: 1736.96, sellDate: '2025-09-25', sellTime: '00:43', inStock: true },
        { model: 'Fitness Watch', price: 1075.31, sellDate: '2025-11-07', sellTime: '17:47', inStock: true },
        { model: 'Cycling Cap', price: 726.01, sellDate: '2025-10-28', sellTime: '12:44', inStock: true },
        { model: 'Road Tire Tube', price: 601.99, sellDate: '2025-09-22', sellTime: '00:26', inStock: true },
        { model: 'Speed Gloves', price: 1758.26, sellDate: '2025-10-04', sellTime: '04:59', inStock: true },
        { model: 'Speed Gloves', price: 564.35, sellDate: '2025-07-10', sellTime: '18:21', inStock: true },
        { model: 'Hydration Pack', price: 954.84, sellDate: '2025-11-02', sellTime: '00:59', inStock: false },
        { model: 'Cycling Cap', price: 1511.5, sellDate: '2025-02-11', sellTime: '02:38', inStock: false },
        { model: 'HL Road Tire', price: 269.6, sellDate: '2025-06-18', sellTime: '04:58', inStock: false },
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
      <Table hotTableRef={hotTableRef} data={data} />
      <div className="example-controls-container example-controls-below-grid">
        <div className="controls">
          <button type="button" id="loadData" onClick={loadData} disabled={isLoading}>
            {data.length > 0 ? 'Reload Data' : 'Load Data'}
          </button>
        </div>
      </div>
      <div style={{ marginTop: '16px' }}>
        <p style={{ padding: 0, fontSize: 'var(--sl-text-xs)', color: 'var(--sl-color-gray-3)' }}>
          This is a demonstration of how to use the Loading plugin with pagination in external container. You need to
          create pagination overlay manually, after that you can use the <code>afterLoadingShow</code> and{' '}
          <code>afterLoadingHide</code> hooks to show and hide the pagination container overlay.
        </p>
      </div>
      <div style={{ marginTop: '16px' }}>
        <div className="example4-pagination" ref={paginationContainerRef}></div>
      </div>
    </>
  );
};

export default ExampleComponent;
