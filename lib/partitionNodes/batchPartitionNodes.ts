import { enums, resources, toMicros } from "google-ads-api";

//root node
export const createRootNode = (
  customer: string,
  adGroupId: string,
  adGroupResource: string,
  rootTempId: number
): resources.IAdGroupCriterion => ({
  resource_name: `customers/${customer}/adGroupCriteria/${adGroupId}~${rootTempId}`,
  ad_group: adGroupResource,
  listing_group: {
    type: enums.ListingGroupType.SUBDIVISION,
  },
  status: enums.AdGroupCriterionStatus.ENABLED,
});

//selected brand node
export const createBrandNode = (
  customer: string,
  adGroupId: string,
  adGroupResource: string,
  brandTempId: number,
  parentNode: string,
  vendor: string
): resources.IAdGroupCriterion => ({
  resource_name: `customers/${customer}/adGroupCriteria/${adGroupId}~${brandTempId}`,
  ad_group: adGroupResource,
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
  adGroupId: string,
  adGroupResource: string,
  otherBrandTempId: number,
  fixedCpC: string,
  parentCriterion: string
): resources.IAdGroupCriterion => ({
  resource_name: `customers/${customer}/adGroupCriteria/${adGroupId}~${otherBrandTempId}`,
  ad_group: adGroupResource,
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
  adGroupId: string,
  adGroupResource: string,
  productTempId: number,
  productId: string,
  fixedCpC: string,
  resource: string
): resources.IAdGroupCriterion => ({
  resource_name: `customers/${customer}/adGroupCriteria/${adGroupId}~${productTempId}`,
  ad_group: adGroupResource,
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
  adGroupId: string,
  adGroupAdResource: string,
  everythingElseTempId: number,
  fixedCpC: string,
  parentCriterion: string
): resources.IAdGroupCriterion => ({
  resource_name: `customers/${customer}/adGroupCriteria/${adGroupId}~${everythingElseTempId}`,
  ad_group: adGroupAdResource,
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
