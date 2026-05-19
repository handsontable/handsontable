/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';

const LEGACY_ANGULAR_VERSIONS = [
  '15\\.3',
  '15\\.2',
  '15\\.1',
  '15\\.0',
  '14\\.6',
  '14\\.5',
  '14\\.4',
  '14\\.3',
  '14\\.2',
  '14\\.1',
  '14\\.0',
  '13\\.1',
  '13\\.0',
  '12\\.4',
  '12\\.3',
  '12\\.2',
  '12\\.1',
  '12\\.0',
  '11\\.1',
  '11\\.0',
  '10\\.0',
  '9\\.0'
];

export default async(req: Request, context: Context) => {
  const url = new URL('/docs/javascript-data-grid/', req.url);

  return Response.redirect(url, 301);
};

export const config: Config = {
  path: `/docs/(${LEGACY_ANGULAR_VERSIONS.join('|')})/angular-data-grid(/.*)?`
};
