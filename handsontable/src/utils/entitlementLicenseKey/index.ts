import { detectLicenseKeyFormat, isEntitlementKey } from './detectFormat';
import { extractEntitlementKeyData, getProductEntitlement } from './extractKeyData';
import { classifyEntitlement, resolveChannels } from './classify';
import {
  UNRESTRICTED_GRANTS,
  getLicenseGrants,
  hasProductGrant,
  getProductCapabilities,
  hasCapability,
} from './grants';
import { HANDSONTABLE_PRODUCT } from './constants';

export type {
  LicenseKeyFormat,
  ProductEntitlement,
  EntitlementKeyData,
  LicenseState,
  LicenseLifecycle,
  LicenseChannels,
  LicenseGrants,
} from './types';
export type { LicenseTimeReference } from './classify';

export {
  detectLicenseKeyFormat,
  isEntitlementKey,
  extractEntitlementKeyData,
  getProductEntitlement,
  classifyEntitlement,
  resolveChannels,
  UNRESTRICTED_GRANTS,
  getLicenseGrants,
  hasProductGrant,
  getProductCapabilities,
  hasCapability,
  HANDSONTABLE_PRODUCT,
};
