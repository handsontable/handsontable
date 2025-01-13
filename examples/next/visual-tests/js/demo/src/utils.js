import { data } from './constants';

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

export function getDirectionFromURL() {
  const urlParams = new URLSearchParams(location.search);

  return urlParams.get("direction") ?? "ltr";
}

export function getThemeNameFromURL() {
  const urlParams = new URLSearchParams(location.search);

  return urlParams.get("theme") ? `ht-theme-${urlParams.get("theme")}` : undefined;
}

export function generateExampleData() {
  return getDirectionFromURL() === "rtl" ? generateArabicData() : data;
}
