import { enums, resources } from "google-ads-api";

//create a shopping ad group ad

export const createShoppingAdGroupAdResource = (
  customer: string,
  index: number
): resources.IAdGroupAd => ({
  ad_group: `customers/${customer}/adGroups/${-5 - index}`,
  ad: {
    shopping_product_ad: {},
    type: enums.AdType.SHOPPING_PRODUCT_AD,
  },
  status: enums.AdGroupAdStatus.ENABLED,
});
