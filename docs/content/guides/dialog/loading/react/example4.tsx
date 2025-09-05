import React, { useRef, useState, useEffect } from 'react';
import { HotTable, HotColumn, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const Table = React.memo(({ hotTableRef, data }: { hotTableRef: React.RefObject<HotTableRef>; data: any[] }) => {
  return (
    <>
      <HotTable
        ref={hotTableRef}
        themeName="ht-theme-main"
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
          numericFormat={{ pattern: '$0,0.00', culture: 'en-US' }}
          className="htRight"
          headerClassName="htRight"
        />
        <HotColumn
          title="Date"
          type="date"
          data="sellDate"
          width={130}
          dateFormat="MMM D, YYYY"
          correctFormat={true}
          className="htRight"
          headerClassName="htRight"
        />
        <HotColumn
          title="Time"
          type="time"
          data="sellTime"
          width={90}
          timeFormat="hh:mm A"
          correctFormat={true}
          className="htRight"
          headerClassName="htRight"
        />
        <HotColumn title="In stock" type="checkbox" data="inStock" className="htCenter" headerClassName="htCenter" />
      </HotTable>
    </>
  );
});

const ExampleComponent = React.memo(() => {
  const hotTableRef = useRef<HotTableRef>(null);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const paginationContainer = document.querySelector('#example4-pagination');
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
        { model: 'Trail Helmet', price: 1298.14, sellDate: 'Aug 31, 2025', sellTime: '02:12 PM', inStock: true },
        { model: 'Windbreaker Jacket', price: 178.9, sellDate: 'May 10, 2025', sellTime: '10:26 PM', inStock: false },
        { model: 'Cycling Cap', price: 288.1, sellDate: 'Sep 15, 2025', sellTime: '09:37 AM', inStock: true },
        { model: 'HL Mountain Frame', price: 94.49, sellDate: 'Jan 17, 2025', sellTime: '02:19 PM', inStock: false },
        { model: 'Racing Socks', price: 430.38, sellDate: 'May 10, 2025', sellTime: '01:42 PM', inStock: true },
        { model: 'Racing Socks', price: 138.85, sellDate: 'Sep 20, 2025', sellTime: '02:48 PM', inStock: true },
        { model: 'HL Mountain Frame', price: 1909.63, sellDate: 'Sep 5, 2025', sellTime: '09:35 AM', inStock: false },
        { model: 'Carbon Handlebar', price: 1080.7, sellDate: 'Oct 24, 2025', sellTime: '10:58 PM', inStock: false },
        { model: 'Aero Bottle', price: 1571.13, sellDate: 'May 24, 2025', sellTime: '12:24 AM', inStock: true },
        { model: 'Windbreaker Jacket', price: 919.09, sellDate: 'Jul 16, 2025', sellTime: '07:11 PM', inStock: true },
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
      <div style={{ marginTop: '16px', display: 'flex', gaap: '10px' }}>
        <button id="loadData" onClick={loadData} disabled={isLoading}>
          {data.length > 0 ? 'Reload Data' : 'Load Data'}
        </button>
      </div>
      <div style={{ marginTop: '16px' }}>
        <p style={{ padding: 0 }}>
          This is a demonstration of how to use the Loading plugin with pagination in external container. You need to
          create pagination overlay manually, after that you can use the `afterLoadingShow` and `afterLoadingHide` hooks
          to show and hide the pagination container overlay.
        </p>
      </div>
      <div style={{ marginTop: '16px' }}>
        <div id="example4-pagination"></div>
      </div>
    </>
  );
});

export default ExampleComponent;
