const scenarioArray = [
  ...Array.from({ length: 100 }, (_, index) => ({
    product_id: 100000 + index,
    mobile_apps: index % 2 === 0 ? 'Y' : 'N',
    pricing: ['Freemium', 'Premium', 'Subscription'][index % 3],
    rating: (index % 5) + 1,
    dataType: [
      'Data Management',
      'Data Analysis',
      'Data Visualization',
      'Data Storage',
    ][index % 4],
    industry: ['Utilities', 'Healthcare', 'Finance', 'Retail'][index % 4],
    business_scale: ['Small', 'Medium', 'Large'][index % 3],
    user_type: ['Business', 'Individual'][index % 2],
    no_of_users: ['Single', 'Multiple'][index % 2],
    deployment: ['Cloud', 'On-premises'][index % 2],
    OS: ['Linux', 'Windows', 'MacOS'][index % 3],
  })),
];

const nestedScenarioArray = [];

for (let i = 0; i < scenarioArray.length; i += 9) {
  nestedScenarioArray.push({
    category: `Category ${Math.floor(i / 9) + 1}`,
    __children: scenarioArray.slice(i, i + 9),
  });
}

export const data = [...scenarioArray];
