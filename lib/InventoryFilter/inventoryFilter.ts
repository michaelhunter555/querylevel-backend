import { enums, MutateOperation, resources } from "google-ads-api";

export const createProductInventoryFilter = (
  customer: string,
  numOfCampaigns: number,
  arr: MutateOperation<resources.ICampaignCriterion>[],
  inventoryFilter?: string,
  operation?: "create" | "update" | "remove",
  campaignId?: string | number
) => {
  return Array.from({ length: numOfCampaigns }).forEach((_, i) => {
    let dimensions = [];
    const filter = inventoryFilter?.split("="); //ex. product_brand = dimplex
    const filterType = filter && filter[0]?.trim();
    const selectFilter = filter && filter[1]?.trim();

    if (filterType === "product_brand") {
      dimensions.push({ product_brand: { value: selectFilter } });
    }
    if (filterType === "product_type_l1") {
      dimensions.push({
        product_type: {
          value: selectFilter,
          level: enums.ProductTypeLevel.LEVEL1,
        },
      });
    }
    if (filterType === "product_channel") {
      dimensions.push({
        product_channel: {
          channel: selectFilter as keyof typeof enums.ProductChannel,
        },
      });
    }
    if (filterType === "product_condition") {
      dimensions.push({
        product_condition: {
          condition: selectFilter as keyof typeof enums.ProductCondition,
        },
      });
    }
    if (filterType === "product_item_id") {
      dimensions.push({ product_item_id: { value: selectFilter } });
    }

    arr.push({
      entity: "campaign_criterion",
      operation: operation || "create",
      resource: {
        campaign: `customers/${customer}/campaigns/${campaignId ?? -3}`,
        listing_scope: {
          dimensions: dimensions,
        },
        ...(operation === "update"
          ? {
              update_mask: {
                paths: ["listing_scope", "dimensions"],
              },
            }
          : {}),
      },
    });
  });
};
