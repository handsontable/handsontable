import {
  randBoolean,
  randNumber,
  randProductCategory,
} from '@ngneat/falso';

type Scenario = {
  product_id: number;
  mobile_apps: string;
  pricing: string;
  rating: number;
  dataType: string;
  industry: string;
  business_scale: string;
  user_type: string;
  no_of_users: string;
  deployment: string;
  OS: string;
  __children?: Scenario[];
};

const scenarioArray: Scenario[]= [
  ...Array.from({ length: 100 }, () => ({
    product_id: 100000 + randNumber({ max: 99 }),
    mobile_apps: randBoolean() ? 'Y' : 'N',
    pricing: ['Freemium', 'Premium', 'Subscription'][Math.floor(Math.random() * 3)],
    rating: randNumber({ min: 1, max: 5, fraction: 1 }),
    dataType: ['Data Management', 'Data Analysis', 'Data Visualization', 'Data Storage'][Math.floor(Math.random() * 4)],
    industry: ['Utilities', 'Healthcare', 'Finance', 'Retail'][Math.floor(Math.random() * 4)],
    business_scale: ['Small', 'Medium', 'Large'][Math.floor(Math.random() * 3)],
    user_type: ['Business', 'Individual'][Math.floor(Math.random() * 2)],
    no_of_users: ['Single', 'Multiple'][Math.floor(Math.random() * 2)],
    deployment: ['Cloud', 'On-premises'][Math.floor(Math.random() * 2)],
    OS: ['Linux', 'Windows', 'MacOS'][Math.floor(Math.random() * 3)],
  })),
  
];

const nestedScenarioArray = [];

for (let i = 0; i < scenarioArray.length; i += 9) {
  nestedScenarioArray.push({
    category: randProductCategory(),
    __children: scenarioArray.slice(i, i + 9),
  });
}

const scenarioDataTop = [
  ...scenarioArray,
];

const scenarioDataBottom = [
  ...nestedScenarioArray,
];

export function getScenarioDataTop() {
  return scenarioDataTop;
}

export function getScenarioDataBottom() {
  return scenarioDataBottom;
}