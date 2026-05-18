import { useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

// Build column headers: 'Cost Center' + 49 monthly labels (Jan 2021 … Jan 2025)
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const colHeaders: string[] = ['Cost Center'];
let year = 2021;
let monthIndex = 0;

while (colHeaders.length < 50) {
  colHeaders.push(`${months[monthIndex]} ${year}`);
  monthIndex += 1;

  if (monthIndex >= months.length) {
    monthIndex = 0;
    year += 1;
  }
}

// Build 50 rows of budget data
const data: (string | number)[][] = [];

for (let row = 0; row < 50; row++) {
  const rowData: (string | number)[] = [`CC-${1000 + row}`];

  for (let col = 0; col < 49; col++) {
    rowData.push(2000 + row * 100 + col * 50);
  }

  data.push(rowData);
}

function Slider({ label, unit, min, max, step, value, onChange }: {
  label: string; unit: string; min: number; max: number; step: number;
  value: number; onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, font: '13px/1.4 sans-serif', color: '#334155' }}>
      <b style={{ fontFamily: 'monospace' }}>{label}: {value} {unit}</b>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: 200, cursor: 'pointer' }}
      />
    </label>
  );
}

const ExampleComponent = () => {
  const [intervalMin, setIntervalMin] = useState(20);
  const [intervalMax, setIntervalMax] = useState(500);
  const [rampDistance, setRampDistance] = useState(120);

  return (
    <div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 16 }}>
        <Slider label="interval.min" unit="ms" min={10}  max={200}  step={10} value={intervalMin}   onChange={setIntervalMin} />
        <Slider label="interval.max" unit="ms" min={100} max={1000} step={50} value={intervalMax}   onChange={setIntervalMax} />
        <Slider label="rampDistance" unit="px" min={20}  max={300}  step={10} value={rampDistance}  onChange={setRampDistance} />
      </div>
      <HotTable
        data={data}
        colHeaders={colHeaders}
        width={500}
        height={220}
        rowHeaders={true}
        dragToScroll={{ interval: { min: intervalMin, max: intervalMax }, rampDistance }}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
