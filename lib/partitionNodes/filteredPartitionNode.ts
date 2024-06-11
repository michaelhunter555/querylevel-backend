import { enums, resources, toMicros } from "google-ads-api";

export const createRootShoppingNode = (
  customer: string,
  rootTempId: number,
  fixedCpC: string,
  targetRoas?: boolean
): resources.IAdGroupCriterion => {
  let resource = {
    resource_name: `customers/${customer}/adGroupCriteria/${-5}~${rootTempId}`,
    ad_group: `customers/${customer}/adGroups/${-5}`,
    negative: false,
    cpc_bid_micros: targetRoas ? null : toMicros(Number(fixedCpC)),
    listing_group: {
      parent_ad_group_criterion: null,
      type: enums.ListingGroupType.UNIT,
      case_value: null,
    },
    status: enums.AdGroupCriterionStatus.ENABLED,
  };
  return resource;
};

export const createEverythingElseShoppingNode = (
  customer: string,
  everythingElseTempId: number,
  fixedCpC: string,
  parentCriterion: string,
  targetRoas?: boolean
): resources.IAdGroupCriterion => {
  let resource: resources.IAdGroupCriterion = {
    resource_name: `customers/${customer}/adGroupCriteria/${-5}~${everythingElseTempId}`,
    ad_group: `customers/${customer}/adGroups/${-5}`,
    cpc_bid_micros: targetRoas ? null : toMicros(Number(fixedCpC)),
    listing_group: {
      parent_ad_group_criterion: parentCriterion,
      type: enums.ListingGroupType.UNIT,
      case_value: {
        product_brand: {},
      },
    },
    status: enums.AdGroupCriterionStatus.ENABLED,
  };

  return resource;
};
