import { enums, resources, toMicros } from "google-ads-api";

//create a shopping ad group
export const createAdGroupResource = (
  customer: string,
  index: number,
  adGroupPriority: string,
  campaignVendor: string,
  fixedCpC: string,
  targetRoas?: boolean
): resources.IAdGroup => ({
  name: `${campaignVendor} ${adGroupPriority} Priority AdGroup`,
  resource_name: `customers/${customer}/adGroups/${-5 - index}`,
  type: enums.AdGroupType.SHOPPING_PRODUCT_ADS,
  campaign: `customers/${customer}/campaigns/${-3 - index}`,
  cpc_bid_micros: targetRoas ? null : toMicros(Number(fixedCpC)),
  ad_rotation_mode: enums.AdGroupAdRotationMode.OPTIMIZE,
});
