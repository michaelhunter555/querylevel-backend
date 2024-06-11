import { enums, resources, toMicros } from "google-ads-api";

//root node
export const createRootNode = (
  customer: string,
  adGroupIndex: number,
  rootTempId: number
): resources.IAdGroupCriterion => ({
  resource_name: `customers/${customer}/adGroupCriteria/${
    -5 - adGroupIndex
  }~${rootTempId}`,
  ad_group: `customers/${customer}/adGroups/${-5 - adGroupIndex}`,
  listing_group: {
    type: enums.ListingGroupType.SUBDIVISION,
  },
  status: enums.AdGroupCriterionStatus.ENABLED,
});

//selected brand node
export const createBrandNode = (
  customer: string,
  adGroupIndex: number,
  brandTempId: number,
  parentNode: string,
  vendor: string
): resources.IAdGroupCriterion => ({
  resource_name: `customers/${customer}/adGroupCriteria/${
    -5 - adGroupIndex
  }~${brandTempId}`,
  ad_group: `customers/${customer}/adGroups/${-5 - adGroupIndex}`,
  listing_group: {
    parent_ad_group_criterion: parentNode,
    case_value: {
      product_brand: {
        value: vendor,
      },
    },
    type: enums.ListingGroupType.SUBDIVISION,
  },
  status: enums.AdGroupCriterionStatus.ENABLED,
});

//all other brands node
export const createEverythingElseInBrandNode = (
  customer: string,
  adGroupIndex: number,
  otherBrandTempId: number,
  fixedCpC: string,
  parentCriterion: string
): resources.IAdGroupCriterion => ({
  resource_name: `customers/${customer}/adGroupCriteria/${
    -5 - adGroupIndex
  }~${otherBrandTempId}`,
  ad_group: `customers/${customer}/adGroups/${-5 - adGroupIndex}`,
  cpc_bid_micros: toMicros(Number(fixedCpC)),
  listing_group: {
    case_value: {
      product_brand: {},
    },
    parent_ad_group_criterion: parentCriterion,
    type: enums.ListingGroupType.UNIT,
  },
  status: enums.AdGroupCriterionStatus.ENABLED,
});

//product_item_id under selected brand
export const createProductItemIdNode = (
  customer: string,
  adGroupIndex: number,
  productTempId: number,
  productId: string,
  fixedCpC: string,
  resource: string
): resources.IAdGroupCriterion => ({
  resource_name: `customers/${customer}/adGroupCriteria/${
    -5 - adGroupIndex
  }~${productTempId}`,
  ad_group: `customers/${customer}/adGroups/${-5 - adGroupIndex}`,
  cpc_bid_micros: toMicros(Number(fixedCpC)),
  listing_group: {
    parent_ad_group_criterion: resource,
    case_value: {
      product_item_id: {
        value: productId,
      },
    },
    type: enums.ListingGroupType.UNIT,
  },
  status: enums.AdGroupCriterionStatus.ENABLED,
});

//all other available products
export const createEverythingElseNode = (
  customer: string,
  adGroupIndex: number,
  everythingElseTempId: number,
  fixedCpC: string,
  parentCriterion: string
): resources.IAdGroupCriterion => ({
  resource_name: `customers/${customer}/adGroupCriteria/${
    -5 - adGroupIndex
  }~${everythingElseTempId}`,
  ad_group: `customers/${customer}/adGroups/${-5 - adGroupIndex}`,
  cpc_bid_micros: toMicros(Number(fixedCpC)),
  listing_group: {
    case_value: {
      product_item_id: {},
    },
    parent_ad_group_criterion: parentCriterion,
    type: enums.ListingGroupType.UNIT,
  },
  status: enums.AdGroupCriterionStatus.ENABLED,
});

//const rootPartitionNode = createRootNode(customer.credentials.customer_id, adGroupIndex, rootTempId)
