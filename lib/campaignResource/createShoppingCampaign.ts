import { enums, resources } from "google-ads-api";

interface CreateShoppingCampaign {
  customer: string;
  campaignData: CampaignData;
}

type CampaignData = {
  name: string;
  enabled: boolean;
  priority: number;
  targetGoogleSearch: boolean;
  targetSearchNetwork: boolean;
  targetPartnerSearchNetwork: boolean;
  targetContentNetwork: boolean;
  biddingStrategyType: number;
  geoTargetType: number;
  targetRoasStrategyId?: string;
  enhancedClick?: boolean;
  enableLocalInventory?: boolean;
  targetRoasValue?: number;
  isExistingPortfolioStrategy?: boolean;
};

export const createShoppingCampaign = (
  customer: string,
  merchId: number | string,
  budgetResource: resources.ICampaignBudget,
  campaign: CampaignData,
  biddingStrategyResource?: string
) => {
  const campaignData = {
    resource_name: `customers/${customer}/campaigns/${-3}`,
    name: `${campaign?.name} - QL`,
    advertising_channel_type: enums.AdvertisingChannelType.SHOPPING,
    status: campaign?.enabled
      ? enums.CampaignStatus.ENABLED
      : enums.CampaignStatus.PAUSED,
    campaign_budget: budgetResource as string,
    shopping_setting: {
      merchant_id: merchId as number,
      campaign_priority: campaign?.priority,
      feed_label: "",
      sales_country: "US",
      enable_local: campaign?.enableLocalInventory,
    },
    bidding_strategy_type: Number(campaign?.biddingStrategyType),
    network_settings: {
      target_google_search: campaign?.targetGoogleSearch,
      target_search_network: campaign?.targetSearchNetwork,
    },
    geo_target_type_setting: {
      positive_geo_target_type: campaign?.geoTargetType,
    },
    ...(biddingStrategyResource && {
      bidding_strategy: biddingStrategyResource,
    }),
  };

  if (
    Number(campaign.biddingStrategyType) ===
    enums.BiddingStrategyType.MANUAL_CPC
  ) {
    const isManualCpC = {
      ...campaignData,
      manual_cpc: {
        enhanced_cpc_enabled: campaign?.enhancedClick,
      },
    };

    return isManualCpC;
  }

  if (
    Number(campaign?.biddingStrategyType) ===
    enums.BiddingStrategyType.TARGET_ROAS
  ) {
    const isTargetRoas = {
      ...campaignData,
      target_roas: {
        target_roas: Number(campaign?.targetRoasValue),
      },
    };

    return isTargetRoas;
  }

  return campaignData;
};
