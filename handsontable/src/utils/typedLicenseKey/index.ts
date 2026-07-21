import { hasTypedKeyTag, extractTypedKeyData, getProductPayload } from './extractKeyData';
import { classifyTypedKeyState } from './classify';
import {
  UNRESTRICTED_GRANTS,
  getLicenseGrants,
  hasProductGrant,
  getProductTier,
  getProductMode,
  hasAddonGrant,
} from './grants';
import { HANDSONTABLE_PRODUCT } from './constants';

export type {
  TypedKeyType,
  TypedKeyPayload,
  TypedKeyProductPayload,
  TypedKeyData,
  LicenseState,
  LicenseLifecycle,
  ProductGrant,
  LicenseGrants,
} from './types';
export type { LicenseTimeReference } from './classify';

export {
  hasTypedKeyTag,
  extractTypedKeyData,
  getProductPayload,
  classifyTypedKeyState,
  UNRESTRICTED_GRANTS,
  getLicenseGrants,
  hasProductGrant,
  getProductTier,
  getProductMode,
  hasAddonGrant,
  HANDSONTABLE_PRODUCT,
};
