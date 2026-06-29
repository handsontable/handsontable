<template>
  <div id="example">
    <HotTable
      :data="data"
      :height="450"
      :col-headers="[
        'ID',
        'Item Name',
        'Item No.',
        'Lead Engineer',
        'Cost',
        'In Stock',
        'Category',
        'Item Quality',
        'Origin',
        'Quantity',
        'Value Stock',
        'Repairable',
        'Supplier Name',
        'Restock Date',
        'Operational Status',
      ]"
      :dropdown-menu="true"
      :hidden-columns="{
        columns: [0, 2],
        indicators: true,
      }"
      :context-menu="true"
      :multi-column-sorting="true"
      :filters="true"
      :row-headers="true"
      header-class-name="htLeft"
      :manual-row-move="true"
      :auto-wrap-row="true"
      :auto-wrap-col="true"
      license-key="non-commercial-and-evaluation"
    >
      <HotColumn data="id" type="numeric" :width="150" />
      <HotColumn data="itemName" type="text" header-class-name="htLeft" class-name="htLeft" :width="150" />
      <HotColumn data="itemNo" type="text" header-class-name="htLeft" class-name="htLeft" :width="150" />
      <HotColumn data="leadEngineer" type="text" header-class-name="htLeft" class-name="htLeft" />
      <HotColumn data="cost" type="numeric" header-class-name="htRight" class-name="htRight" />
      <HotColumn data="inStock" type="checkbox" class-name="htCenter" header-class-name="htCenter" />
      <HotColumn data="category" type="text" header-class-name="htLeft" class-name="htLeft" />
      <HotColumn data="itemQuality" type="text" header-class-name="htLeft" class-name="htLeft" />
      <HotColumn data="origin" type="text" header-class-name="htLeft" class-name="htLeft" />
      <HotColumn data="quantity" type="numeric" header-class-name="htRight" class-name="htRight" />
      <HotColumn data="valueStock" type="numeric" header-class-name="htRight" class-name="htRight" />
      <HotColumn data="repairable" type="checkbox" class-name="htCenter" header-class-name="htCenter" />
      <HotColumn data="supplierName" type="text" header-class-name="htLeft" class-name="htLeft" />
      <HotColumn data="restockDate" type="date" :allow-invalid="false" header-class-name="htLeft" class-name="htLeft" />
      <HotColumn data="operationalStatus" type="text" header-class-name="htLeft" class-name="htLeft" />
    </HotTable>
  </div>
</template>

<script setup lang="ts">
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const data = [
  { id: 640329, itemName: 'Lunar Core', itemNo: 'XJ-12', leadEngineer: 'Ellen Ripley', cost: 350000, inStock: true, category: 'Lander', itemQuality: 87, origin: '🇺🇸 USA', quantity: 2, valueStock: 700000, repairable: false, supplierName: 'TechNova', restockDate: '2025-08-01', operationalStatus: 'Awaiting Parts' },
  { id: 863104, itemName: 'Zero Thrusters', itemNo: 'QL-54', leadEngineer: 'Sam Bell', cost: 450000, inStock: false, category: 'Propulsion', itemQuality: 0, origin: '🇩🇪 Germany', quantity: 0, valueStock: 0, repairable: true, supplierName: 'PropelMax', restockDate: '2025-09-15', operationalStatus: 'In Maintenance' },
  { id: 395603, itemName: 'EVA Suits', itemNo: 'PM-67', leadEngineer: 'Alex Rogan', cost: 150000, inStock: true, category: 'Equipment', itemQuality: 79, origin: '🇮🇹 Italy', quantity: 50, valueStock: 7500000, repairable: true, supplierName: 'SuitCraft', restockDate: '2025-10-05', operationalStatus: 'Ready for Testing' },
  { id: 679083, itemName: 'Solar Panels', itemNo: 'BW-09', leadEngineer: 'Dave Bowman', cost: 75000, inStock: true, category: 'Energy', itemQuality: 95, origin: '🇺🇸 USA', quantity: 10, valueStock: 750000, repairable: false, supplierName: 'SolarStream', restockDate: '2025-11-10', operationalStatus: 'Operational' },
  { id: 912663, itemName: 'Comm Array', itemNo: 'ZR-56', leadEngineer: 'Louise Banks', cost: 125000, inStock: false, category: 'Communication', itemQuality: 0, origin: '🇯🇵 Japan', quantity: 0, valueStock: 0, repairable: true, supplierName: 'CommTech', restockDate: '2025-12-20', operationalStatus: 'Decommissioned' },
  { id: 315806, itemName: 'Habitat Dome', itemNo: 'UJ-23', leadEngineer: 'Dr. Ryan Stone', cost: 1000000, inStock: true, category: 'Shelter', itemQuality: 93, origin: '🇨🇦 Canada', quantity: 3, valueStock: 3000000, repairable: false, supplierName: 'DomeInnovate', restockDate: '2026-01-25', operationalStatus: 'Operational' },
  { id: 954632, itemName: 'Oxygen Unit', itemNo: 'FK-87', leadEngineer: 'Dr. Grace Augustine', cost: 600000, inStock: true, category: 'Life Support', itemQuality: 85, origin: '🇺🇸 USA', quantity: 15, valueStock: 9000000, repairable: true, supplierName: 'OxyGenius', restockDate: '2026-03-02', operationalStatus: 'Awaiting Parts' },
  { id: 734944, itemName: 'Processing Rig', itemNo: 'LK-13', leadEngineer: 'Jake Sully', cost: 350000, inStock: true, category: 'Mining', itemQuality: 81, origin: '🇦🇺 Australia', quantity: 25, valueStock: 8750000, repairable: true, supplierName: 'RigTech', restockDate: '2026-04-15', operationalStatus: 'Ready for Testing' },
  { id: 834662, itemName: 'Navigation Module', itemNo: 'XP-24', leadEngineer: 'Dr. Ellie Arroway', cost: 450000, inStock: true, category: 'Navigation', itemQuality: 89, origin: '🇫🇷 France', quantity: 8, valueStock: 3600000, repairable: false, supplierName: 'NavSolutions', restockDate: '2026-05-30', operationalStatus: 'In Maintenance' },
  { id: 714329, itemName: 'Surveyor Arm', itemNo: 'QA-86', leadEngineer: 'Mark Watney', cost: 100000, inStock: true, category: 'Exploration', itemQuality: 78, origin: '🇺🇸 USA', quantity: 40, valueStock: 4000000, repairable: true, supplierName: 'ExploreTech', restockDate: '2026-07-12', operationalStatus: 'Decommissioned' },
  { id: 291439, itemName: 'Habitat Dome', itemNo: 'UJ-24', leadEngineer: 'Jane Doe', cost: 1100000, inStock: true, category: 'Shelter', itemQuality: 92, origin: '🇬🇧 UK', quantity: 4, valueStock: 4400000, repairable: false, supplierName: 'DomeInnovate', restockDate: '2026-02-01', operationalStatus: 'Operational' },
  { id: 485199, itemName: 'Power Generator', itemNo: 'PG-11', leadEngineer: 'John Smith', cost: 500000, inStock: true, category: 'Energy', itemQuality: 85, origin: '🇨🇳 China', quantity: 7, valueStock: 3500000, repairable: true, supplierName: 'PowerCo', restockDate: '2026-03-10', operationalStatus: 'Operational' },
  { id: 271418, itemName: 'Life Support System', itemNo: 'LS-22', leadEngineer: 'Mike Johnson', cost: 800000, inStock: false, category: 'Life Support', itemQuality: 80, origin: '🇯🇵 Japan', quantity: 0, valueStock: 0, repairable: true, supplierName: 'LifeTech', restockDate: '2026-04-20', operationalStatus: 'Awaiting Parts' },
  { id: 390776, itemName: 'Mars Rover', itemNo: 'MR-33', leadEngineer: 'Anna Davis', cost: 2000000, inStock: true, category: 'Exploration', itemQuality: 90, origin: '🇮🇳 India', quantity: 5, valueStock: 10000000, repairable: false, supplierName: 'RoverWorks', restockDate: '2026-05-15', operationalStatus: 'Operational' },
  { id: 672342, itemName: 'Hydroponics Module', itemNo: 'HM-44', leadEngineer: 'Robert Brown', cost: 450000, inStock: true, category: 'Life Support', itemQuality: 88, origin: '🇦🇺 Australia', quantity: 6, valueStock: 2700000, repairable: true, supplierName: 'GreenGrow', restockDate: '2026-06-25', operationalStatus: 'Operational' },
  { id: 907454, itemName: 'Satellite Dish', itemNo: 'SD-55', leadEngineer: 'Emily Wilson', cost: 300000, inStock: false, category: 'Communication', itemQuality: 70, origin: '🇺🇸 USA', quantity: 0, valueStock: 0, repairable: true, supplierName: 'CommTech', restockDate: '2026-07-05', operationalStatus: 'Decommissioned' },
  { id: 841637, itemName: 'Thermal Regulator', itemNo: 'TR-66', leadEngineer: 'Olivia Taylor', cost: 650000, inStock: true, category: 'Energy', itemQuality: 82, origin: '🇷🇺 Russia', quantity: 8, valueStock: 5200000, repairable: false, supplierName: 'ThermoTech', restockDate: '2026-08-15', operationalStatus: 'Operational' },
  { id: 947335, itemName: 'Landing Gear', itemNo: 'LG-77', leadEngineer: 'David Lee', cost: 250000, inStock: true, category: 'Lander', itemQuality: 75, origin: '🇫🇷 France', quantity: 10, valueStock: 2500000, repairable: false, supplierName: 'LandingWorks', restockDate: '2026-09-20', operationalStatus: 'Operational' },
  { id: 629849, itemName: 'Radiation Shield', itemNo: 'RS-88', leadEngineer: 'Sophia Martinez', cost: 900000, inStock: true, category: 'Equipment', itemQuality: 95, origin: '🇧🇷 Brazil', quantity: 3, valueStock: 2700000, repairable: false, supplierName: 'ShieldPro', restockDate: '2026-10-30', operationalStatus: 'Operational' },
  { id: 519304, itemName: 'Fuel Cell', itemNo: 'FC-99', leadEngineer: 'James Anderson', cost: 550000, inStock: true, category: 'Propulsion', itemQuality: 89, origin: '🇨🇦 Canada', quantity: 5, valueStock: 2750000, repairable: true, supplierName: 'FuelWorks', restockDate: '2026-11-22', operationalStatus: 'Operational' },
];
</script>

<style>
table.htCore tr.ht__row_odd td {
  background: #fafbff;
}

.handsontable {
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 400;
}
</style>
