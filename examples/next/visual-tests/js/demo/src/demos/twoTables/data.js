const scenarioTop = [
  {
    product_id: 100001,
    mobile_apps: 'Y',
    pricing: 'Freemium',
    rating: 4.5,
    dataType: 'Data Management',
    industry: 'Utilities',
    business_scale: 'Small',
    user_type: 'Business',
    no_of_users: 'Single',
    deployment: 'Cloud',
    OS: 'Linux',
  },
  {
    product_id: 100002,
    mobile_apps: 'N',
    pricing: 'Premium',
    rating: 3.8,
    dataType: 'Data Analysis',
    industry: 'Healthcare',
    business_scale: 'Medium',
    user_type: 'Individual',
    no_of_users: 'Multiple',
    deployment: 'On-premises',
    OS: 'Windows',
  },
  {
    product_id: 100003,
    mobile_apps: 'Y',
    pricing: 'Subscription',
    rating: 4.2,
    dataType: 'Data Visualization',
    industry: 'Finance',
    business_scale: 'Large',
    user_type: 'Business',
    no_of_users: 'Multiple',
    deployment: 'Cloud',
    OS: 'MacOS',
  },
  // Add more predefined objects as needed
];

// Generate 100 entries
for (let i = 4; i <= 100; i++) {
  scenarioTop.push({
    product_id: 100000 + i,
    mobile_apps: i % 2 === 0 ? 'Y' : 'N',
    pricing: ['Freemium', 'Premium', 'Subscription'][i % 3],
    rating: (i % 5) + 1,
    dataType: ['Data Management', 'Data Analysis', 'Data Visualization', 'Data Storage'][i % 4],
    industry: ['Utilities', 'Healthcare', 'Finance', 'Retail'][i % 4],
    business_scale: ['Small', 'Medium', 'Large'][i % 3],
    user_type: ['Business', 'Individual'][i % 2],
    no_of_users: ['Single', 'Multiple'][i % 2],
    deployment: ['Cloud', 'On-premises'][i % 2],
    OS: ['Linux', 'Windows', 'MacOS'][i % 3],
  });
}

const scenarioArray = [
  [
    100001,
    'Y',
    'Freemium',
    4.5,
    'Data Management',
    'Utilities',
    'Small',
    'Business',
    'Single',
    'Cloud',
    'Linux'
  ],
  [
    100002,
    'N',
    'Premium',
    3.8,
    'Data Analysis',
    'Healthcare',
    'Medium',
    'Individual',
    'Multiple',
    'On-premises',
    'Windows'
  ],
  [
    100003,
    'Y',
    'Subscription',
    4.2,
    'Data Visualization',
    'Finance',
    'Large',
    'Business',
    'Multiple',
    'Cloud',
    'MacOS'
  ],
  // Add more predefined arrays as needed
];

// Generate 100 entries
for (let i = 4; i <= 100; i++) {
  scenarioArray.push([
    100000 + i,
    i % 2 === 0 ? 'Y' : 'N',
    ['Freemium', 'Premium', 'Subscription'][i % 3],
    (i % 5) + 1,
    ['Data Management', 'Data Analysis', 'Data Visualization', 'Data Storage'][i % 4],
    ['Utilities', 'Healthcare', 'Finance', 'Retail'][i % 4],
    ['Small', 'Medium', 'Large'][i % 3],
    ['Business', 'Individual'][i % 2],
    ['Single', 'Multiple'][i % 2],
    ['Cloud', 'On-premises'][i % 2],
    ['Linux', 'Windows', 'MacOS'][i % 3]
  ]);
}

export const scenarioDataTop = [
  ...scenarioTop,
];

export const scenarioDataBottom = [
  ...scenarioArray,
];