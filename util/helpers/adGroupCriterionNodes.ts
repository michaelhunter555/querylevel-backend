import { enums, toMicros } from "google-ads-api";

export function getProductPartitionNodes(
  adGroupResourceName: string,
  offerId: string,
  cpcBidMicros: number,
  accountId: string,
  property: string
) {
  let tempResourceId = -20;
  const adGroupCriterionResourceName = `customers/${accountId}/${adGroupResourceName}/${tempResourceId--}`;

  // Root Node (Subdivision)
  const rootNode = {
    resource_name: adGroupCriterionResourceName,
    listing_group: {
      type: enums.ListingGroupType.SUBDIVISION,
    },
    status: enums.AdGroupCriterionStatus.ENABLED,
  };

  // Child Node for Specific Product Item (Unit)
  const childProductItem = {
    ad_group: adGroupResourceName,
    cpc_bid_micros: toMicros(cpcBidMicros),
    listing_group: {
      parent_ad_group_criterion: adGroupCriterionResourceName,
      case_value: {
        [property]: {
          value: `${offerId}`,
        },
      },
      type: enums.ListingGroupType.UNIT,
    },
    status: enums.AdGroupCriterionStatus.ENABLED,
  };

  // Child Node for Other Products (Unit)
  const ChildNodeOther = {
    ad_group: adGroupResourceName,
    cpc_bid_micros: toMicros(cpcBidMicros),
    listing_group: {
      parent_ad_group_criterion: adGroupCriterionResourceName,
      case_value: {
        product_item_id: {},
      },
      type: enums.ListingGroupType.UNIT,
    },
    status: enums.AdGroupCriterionStatus.ENABLED,
  };

  return [rootNode, childProductItem, ChildNodeOther];
}
