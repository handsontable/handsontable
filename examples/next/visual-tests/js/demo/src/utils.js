import { data } from './data';

const randomName = () =>
  ["عمر", "علي", "عبد الله", "معتصم"][Math.floor(Math.random() * 3)];
const randomCountry = () =>
  ["تركيا", "مصر", "لبنان", "العراق"][Math.floor(Math.random() * 3)];
const randomDate = () =>
  new Date(Math.floor(Math.random() * Date.now())).toLocaleDateString('en-gb')
const randomBool = () => Math.random() > 0.5;
const randomNumber = (a = 0, b = 1000) => a + Math.floor(Math.random() * b);
const randomPhrase = () =>
  `${randomCountry()} ${randomName()} ${randomNumber()}`;
const randomOrderId = () =>
  `${randomNumber(100000, 999999).toString().match(/.{1,3}/g).join("-")}`;

function generateArabicData() {
  return Array.from({ length: 50 }, () => [
    randomBool(),
    randomName(),
    randomCountry(),
    randomPhrase(),
    randomDate(),
    randomOrderId(),
    randomBool(),
    randomNumber(0, 200).toString(),
    randomNumber(1, 10),
    randomNumber(1, 5),
  ]);
}

export function getFromURL(paramName, defaultValue) {
  return new URLSearchParams(location.search).get(paramName) ?? defaultValue;
}

export function getDirectionFromURL() {
  return getFromURL("direction", "ltr");
}

export function getThemeNameFromURL() {
  const theme = getFromURL("theme");

  return theme ? `ht-theme-${theme}` : undefined;
}

export function generateExampleData() {
  return getDirectionFromURL() === "rtl" ? generateArabicData() : data;
}
