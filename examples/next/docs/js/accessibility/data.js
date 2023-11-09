import {
  randProductName,
  randCompanyName,
  randPastDate,
  randBoolean,
  randNumber,
  randCountry,
  seed,
} from "@ngneat/falso";

seed("42219");

export const data = [
  {
    companyName: randCompanyName({ maxCharCount: 18 }),
    productName: randProductName({ maxCharCount: 18 }),
    sellDate: randPastDate().toLocaleDateString(),
    inStock: randBoolean(),
    qty: randNumber({ max: 500 }),
    progress: randNumber({ max: 10 }),
    rating: randNumber({ max: 5 }),
    orderId: `${randNumber({ max: 9, min: 0 })}${randNumber({ max: 9, min: 0 })}-${randNumber({
      max: 9999999,
      min: 1111111,
    })}`,
    country: 'United Kingdom',
    __children: [
      {
        companyName: randCompanyName({ maxCharCount: 18 }),
      },
      {
        companyName: randCompanyName({ maxCharCount: 18 }),
      },
      {
        companyName: randCompanyName({ maxCharCount: 18 }),
      },
    ],
  },
  ...Array.from({ length: 5000 }, () => ({
    companyName: randCompanyName({ maxCharCount: 18 }),
    productName: randProductName({ maxCharCount: 18 }),
    sellDate: randPastDate().toLocaleDateString(),
    inStock: randBoolean(),
    qty: randNumber({ max: 500 }),
    progress: randNumber({ max: 10 }),
    rating: randNumber({ max: 5 }),
    orderId: `${randNumber({ max: 9, min: 0 })}${randNumber({ max: 9, min: 0 })}-${randNumber({
      max: 9999999,
      min: 1111111,
    })}`,
    country: randCountry({ maxCharCount: 28 }),
  })),
];

export const countries = data.reduce((acc, curr) => {
  if (acc.includes(curr.country)) {
    return acc;
  }
  return [...acc, curr.country];
}, []);
