import { enums, MutateOperation, resources } from "google-ads-api";

//set up campaign priorities
const CAMPAIGN_PRIORITIES = {
  HIGH: 2,
  LOW: 0,
};
const priorityOrder = [
  { key: "LOW", value: CAMPAIGN_PRIORITIES.LOW }, // Assuming LOWER number is higher priority
  { key: "HIGH", value: CAMPAIGN_PRIORITIES.HIGH },
];

export const createAlphaBetaCampaignResource = (
  customer: string,
  merchId: number | string,
  vendor: string,
  enabled: boolean,
  enhancedClick: boolean,
  budgetResource: resources.ICampaignBudget
) => {
  return priorityOrder.map(
    (priority, index): MutateOperation<resources.ICampaign> => ({
      entity: "campaign",
      operation: "create",
      resource: {
        resource_name: `customers/${customer}/campaigns/${-3 - index}`,
        name: `${vendor} ${priority.key} Priority`,
        advertising_channel_type: enums.AdvertisingChannelType.SHOPPING,
        status: enabled
          ? enums.CampaignStatus.ENABLED
          : enums.CampaignStatus.PAUSED,
        campaign_budget: budgetResource as string,
        shopping_setting: {
          merchant_id: merchId as number,
          campaign_priority: priority.value,
          feed_label: "US",
        },
        bidding_strategy_type: enums.BiddingStrategyType.MANUAL_CPC,
        manual_cpc: {
          enhanced_cpc_enabled: enhancedClick,
        },
        network_settings: {
          target_google_search: true,
          target_search_network: false,
          target_partner_search_network: false,
          target_content_network: false,
        },
        geo_target_type_setting: {
          positive_geo_target_type: enums.PositiveGeoTargetType.PRESENCE,
        },
      },
    })
  );
};
